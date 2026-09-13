using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.Models;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Validation;
using UbuntuConnectAPI.Services.Email;


namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;
    private readonly IEmailService _emailService;
    private readonly IEmailVerificationTokenService _tokenService;
    private readonly EmailOptions _emailOptions;

    public AuthController(
        AppDbContext context,
        IConfiguration config,
        IEmailService emailService,
        IEmailVerificationTokenService tokenService,
        Microsoft.Extensions.Options.IOptions<EmailOptions> emailOptions)
    {
        _context = context;
        _config = config;
        _emailService = emailService;
        _tokenService = tokenService;
        _emailOptions = emailOptions.Value;
    }

    // Issues a verification token for the user and "sends" the verification email.
    private async Task SendVerificationEmailAsync(User user)
    {
        var token = await _tokenService.IssueAsync(user.UserId, "EmailVerification");
        var link = $"{_emailOptions.FrontendBaseUrl.TrimEnd('/')}/verify-email?token={Uri.EscapeDataString(token.Token)}";
        await _emailService.SendAsync(new EmailMessage
        {
            ToEmail = user.UserEmail,
            Subject = "Verify your UbuntuConnect email",
            Body =
                $"Welcome to UbuntuConnect!\n\n" +
                $"Please confirm your email address by opening this link:\n{link}\n\n" +
                $"This link expires in 24 hours. If you did not create an account, ignore this email."
        });
    }

    //REGISTER
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest dto)
    {
        //Check if email already exists
        var emailExists = await _context.Users
            .AnyAsync(u => u.UserEmail == dto.UserEmail);

        if (emailExists)
            return BadRequest("An account with this email already exists.");

        // Validate email format
        if (!ValidationPatterns.IsValidEmail(dto.UserEmail))
            return BadRequest("Enter a valid email address.");

        // Enforce password strength server-side (defensive — the UI also checks).
        if (!ValidationPatterns.IsStrongPassword(dto.Password))
            return BadRequest("Password must be at least 8 characters and include a letter and a number.");

        // Validate UserType before starting any DB work.
        // Admin accounts are NOT self-registerable — they are created only via
        // the secure server-side seeding path (see AdminSeeder). Public
        // registration is limited to Individual, NPO and Business.
        var validTypes = new[] { "Individual", "NPO", "Business" };
        if (!validTypes.Contains(dto.UserType))
            return BadRequest("Invalid UserType. Must be Individual, NPO, or Business.");

        // Optional phone: if provided, it must be a valid SA number.
        if (!string.IsNullOrWhiteSpace(dto.UserContact) && !ValidationPatterns.IsValidPhone(dto.UserContact))
            return BadRequest("Enter a valid South African phone number, e.g. +27821234567 or 0821234567.");

        // Validate subtype-specific required fields + formats up front (before transaction)
        switch (dto.UserType)
        {
            case "Individual":
                if (string.IsNullOrEmpty(dto.FirstName) || string.IsNullOrEmpty(dto.LastName))
                    return BadRequest("First name and last name are required for Individual registration.");
                break;
            case "NPO":
                if (string.IsNullOrEmpty(dto.NpoRegNum) || string.IsNullOrEmpty(dto.OrganizationName))
                    return BadRequest("NPO registration number and organisation name are required.");
                if (!ValidationPatterns.IsValidNpoRegNum(dto.NpoRegNum))
                    return BadRequest("Enter a valid NPO registration number, e.g. 123-456 or 123-456-NPO.");
                break;
            case "Business":
                if (string.IsNullOrEmpty(dto.BusinessRegNum))
                    return BadRequest("Business registration number is required.");
                if (!ValidationPatterns.IsValidCipcNumber(dto.BusinessRegNum))
                    return BadRequest("Enter a valid company registration number in the format YYYY/NNNNNN/NN, e.g. 2026/123456/07.");
                break;
        }

        // ── Atomic block — User + Wallet + Subtype + Profile: all or nothing ──
        using var dbTransaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var user = new User
            {
                UserEmail = dto.UserEmail,
                UserContact = dto.UserContact,
                Location = dto.Location,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                UserType = dto.UserType,
                IsVerified = false,
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync(); // UserId assigned by SQL Server

            // Wallet — auto-created for every user
            _context.Wallets.Add(new Wallet { UserId = user.UserId, Balance = 0 });

            // Subtype row
            string profileName = dto.UserEmail;
            switch (dto.UserType)
            {
                case "Individual":
                    _context.Individuals.Add(new Individual
                    {
                        UserId = user.UserId,
                        FirstName = dto.FirstName!,
                        LastName = dto.LastName!,
                        CauseOfCare = dto.CauseOfCare
                    });
                    profileName = $"{dto.FirstName} {dto.LastName}";
                    break;

                case "NPO":
                    _context.Npos.Add(new Npo
                    {
                        UserId = user.UserId,
                        NporegNum = dto.NpoRegNum!,
                        OrganizationName = dto.OrganizationName!,
                        NpofocusArea = dto.NpoFocusArea,
                        Npomission = dto.NpoMission
                    });
                    profileName = dto.OrganizationName!;
                    break;

                case "Business":
                    _context.Businesses.Add(new Business
                    {
                        UserId = user.UserId,
                        BusinessRegNum = dto.BusinessRegNum!,
                        Industry = dto.Industry,
                        ContactPersonName = dto.ContactPersonName,
                        ContactPersonTitle = dto.ContactPersonTitle,
                        BusinessEmail = dto.BusinessEmail,
                        CsrGoal = dto.CsrGoal
                    });
                    profileName = !string.IsNullOrEmpty(dto.ContactPersonName)
                        ? dto.ContactPersonName
                        : dto.UserEmail;
                    break;

                case "Admin":
                    // No subtype table for Admin
                    break;
            }

            // Profile — one per user regardless of type
            _context.Profiles.Add(new Profile
            {
                UserId = user.UserId,
                ProfileName = profileName,
                Following = 0,
                Followers = 0
            });

            await _context.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            // Stage 1: issue + send an email verification link (mock in dev).
            await SendVerificationEmailAsync(user);

            return Ok(new
            {
                message = "Registration successful. Please check your email to verify your account.",
                userId = user.UserId,
                userType = user.UserType
            });
        }
        catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("UNIQUE") == true ||
                                            ex.InnerException?.Message.Contains("duplicate") == true)
        {
            await dbTransaction.RollbackAsync();
            return BadRequest("A record with a duplicate unique value already exists (e.g., NPO registration number or email).");
        }
        catch
        {
            await dbTransaction.RollbackAsync();
            return StatusCode(500, "Registration failed due to a server error. No data was saved.");
        }
    }
    //LOGIN
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest dto)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserEmail == dto.UserEmail);

        if (user == null)
            return Unauthorized("Invalid email or password.");
        if (!user.IsActive)
            return Unauthorized("This account has been deactivated.");

        bool passwordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);


        if (!passwordValid)
            return Unauthorized("Invalid email or password.");

        // Build the token
        var claims = new[]
        {
        new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
        new Claim(ClaimTypes.Email, user.UserEmail),
        new Claim(ClaimTypes.Role, user.UserType)
    };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(double.Parse(_config["Jwt:ExpiryMinutes"]!)),
            signingCredentials: creds
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

        return Ok(new
        {
            message = "Login successful.",
            token = tokenString,
            userId = user.UserId,
            userType = user.UserType,
            email = user.UserEmail,
            isVerified = user.IsVerified,
            isEmailVerified = user.IsEmailVerified
        });
    }

    // ── EMAIL VERIFICATION (Stage 1) ───────────────────────────
    // Confirms email ownership. The link/code is delivered by the email
    // service (logged to console in dev). Public endpoint — the token itself
    // is the proof, so no auth is required.
    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest dto)
    {
        var token = await _tokenService.ValidateAsync(dto.Token, "EmailVerification");
        if (token == null)
            return BadRequest("This verification link is invalid or has expired.");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == token.UserId);
        if (user == null)
            return NotFound("User not found.");

        if (!user.IsEmailVerified)
        {
            user.IsEmailVerified = true;
            await _context.SaveChangesAsync();
        }
        await _tokenService.ConsumeAsync(token);

        return Ok(new { message = "Email verified successfully.", isEmailVerified = true });
    }

    // Re-issues a verification link for an account that is not yet verified.
    // Always returns 200 (does not reveal whether an email is registered).
    [HttpPost("resend-verification")]
    public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationRequest dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserEmail == dto.UserEmail);
        if (user != null && !user.IsEmailVerified)
        {
            await SendVerificationEmailAsync(user);
        }
        return Ok(new { message = "If that account exists and is unverified, a new verification email has been sent." });
    }
}