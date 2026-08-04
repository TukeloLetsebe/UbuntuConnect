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


namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;

    public AuthController(AppDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
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

        // Validate UserType before starting any DB work
        var validTypes = new[] { "Individual", "NPO", "Business", "Admin" };
        if (!validTypes.Contains(dto.UserType))
            return BadRequest("Invalid UserType. Must be Individual, NPO, Business, or Admin.");

        // Validate subtype-specific required fields up front (before transaction)
        switch (dto.UserType)
        {
            case "Individual":
                if (string.IsNullOrEmpty(dto.FirstName) || string.IsNullOrEmpty(dto.LastName))
                    return BadRequest("First name and last name are required for Individual registration.");
                break;
            case "NPO":
                if (string.IsNullOrEmpty(dto.NpoRegNum) || string.IsNullOrEmpty(dto.OrganizationName))
                    return BadRequest("NPO registration number and organisation name are required.");
                break;
            case "Business":
                if (string.IsNullOrEmpty(dto.BusinessRegNum))
                    return BadRequest("Business registration number is required.");
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

            return Ok(new
            {
                message = "Registration successful.",
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
            isVerified = user.IsVerified
        });
    }
    

}