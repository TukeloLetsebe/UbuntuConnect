using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Models;
using UbuntuConnectAPI.Services.Verification;
using UbuntuConnectAPI.Services.FaceVerification;
using UbuntuConnectAPI.Services.Payments;
using UbuntuConnectAPI.Services.Notifications;
using UbuntuConnectAPI.Services.Users;
using UbuntuConnectAPI.Validation;
using Microsoft.Extensions.Options;


namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/individual")]
public class IndividualController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly IVerificationGate _gate;
    private readonly IFaceVerificationService _faceService;
    private readonly IPaymentSimulationService? _payments;
    private readonly WalletLimitsOptions _limits;
    // Optional so existing tests constructing this controller keep working;
    // notifications are best-effort and never block a donation.
    private readonly INotificationService? _notifications;
    // Optional for the same reason; falls back to a direct resolver when null.
    private readonly IUserNameResolver? _names;

    // Auto-approve threshold for the self-service face-scan route.
    private const double FaceMatchThreshold = 0.62;

    public IndividualController(
        AppDbContext context,
        IVerificationGate gate,
        IFaceVerificationService faceService,
        IPaymentSimulationService? payments = null,
        IOptions<WalletLimitsOptions>? limits = null,
        INotificationService? notifications = null,
        IUserNameResolver? names = null)
    {
        _context = context;
        _gate = gate;
        _faceService = faceService;
        _payments = payments;
        _limits = limits?.Value ?? new WalletLimitsOptions();
        _notifications = notifications;
        _names = names;
    }

    // ── SUBMIT IDENTITY VERIFICATION (KYC) ─────────────────────
    // Individual uploads ID + selfie (via /api/upload/image) then submits the
    // URLs here, choosing a route: "Admin" (manual review) or "FaceScan"
    // (self-service auto-match). Face-scan falls back to Admin when the engine
    // is disabled or produces a low/failed match.
    [Authorize(Roles = "Individual")]
    [HttpPost("verify-identity")]
    public async Task<IActionResult> SubmitKyc([FromBody] SubmitKycRequest dto)
    {
        var userId = CallerId;

        var individual = await _context.Individuals.FirstOrDefaultAsync(i => i.UserId == userId);
        if (individual == null) return NotFound("Individual profile not found.");

        if (individual.KycStatus == "Pending")
            return BadRequest("You already have a verification submission awaiting review.");
        if (individual.KycStatus == "Approved")
            return BadRequest("Your identity is already verified.");

        if (string.IsNullOrWhiteSpace(dto.IdNumber) ||
            string.IsNullOrWhiteSpace(dto.IdDocumentUrl) ||
            string.IsNullOrWhiteSpace(dto.SelfieUrl))
            return BadRequest("ID number, ID document, and a selfie are all required.");

        var route = dto.Route == "FaceScan" ? "FaceScan" : "Admin";

        individual.IdNumber = dto.IdNumber.Trim();
        individual.IdDocumentUrl = dto.IdDocumentUrl;
        individual.SelfieUrl = dto.SelfieUrl;
        individual.KycRoute = route;
        individual.SubmittedDate = DateTime.UtcNow;
        individual.ReviewedByUserId = null;
        individual.ReviewedDate = null;
        individual.KycMatchScore = null;

        // Self-service face-scan route: try the engine.
        if (route == "FaceScan" && _faceService.IsEnabled)
        {
            var match = await _faceService.CompareAsync(dto.IdDocumentUrl, dto.SelfieUrl);
            if (match.Available && match.Matched && match.Score >= FaceMatchThreshold)
            {
                // Auto-approve.
                individual.KycStatus = "Approved";
                individual.KycMatchScore = (decimal)match.Score;
                individual.ReviewedDate = DateTime.UtcNow;

                var user = await _context.Users.FirstAsync(u => u.UserId == userId);
                user.IsVerified = true;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Identity verified successfully via face match.",
                    status = individual.KycStatus,
                    autoApproved = true,
                    score = match.Score
                });
            }

            // Low/failed match — record score and fall through to pending for admin.
            if (match.Available)
                individual.KycMatchScore = (decimal)match.Score;
        }

        // Admin route, or face-scan that didn't auto-approve → queue for admin.
        individual.KycStatus = "Pending";
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Your identity verification has been submitted for review.",
            status = individual.KycStatus,
            autoApproved = false,
            route
        });
    }

    // ── MY KYC STATUS ──────────────────────────────────────────
    [Authorize(Roles = "Individual")]
    [HttpGet("verify-identity/status")]
    public async Task<IActionResult> GetKycStatus()
    {
        var userId = CallerId;
        var individual = await _context.Individuals.FirstOrDefaultAsync(i => i.UserId == userId);
        if (individual == null) return NotFound("Individual profile not found.");

        return Ok(new
        {
            status = individual.KycStatus,
            route = individual.KycRoute,
            submittedDate = individual.SubmittedDate,
            reviewedDate = individual.ReviewedDate,
            matchScore = individual.KycMatchScore,
            faceEngineEnabled = _faceService.IsEnabled
        });
    }

    //DISCOVER NPOs
    [HttpGet("discover-NPOs")]
    public async Task<IActionResult> DiscoverNpos()
    {
        var npos = await _context.Npos
            .Include(n => n.User)
                .ThenInclude(u => u.Profile)
            .Select(n => new
            {
                npoId = n.NpoId,
                organizationName = n.OrganizationName,
                focusArea = n.NpofocusArea,
                mission = n.Npomission,
                location = n.User.Location,
                isVerified = n.User.IsVerified,
                profileImage = n.User.Profile != null ? n.User.Profile.ProfileImage : null
            })
            .ToListAsync();

        return Ok(npos);
    }

    //FOLLOW AN NPO
    [Authorize]
    [HttpPost("follow/{npoId}")]
    public async Task<IActionResult> FollowNpo(int npoId)
    {
        //Get the logged in user ID from the token generated
        var userId = CallerId;

        //Check the NPO actually exists
        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.NpoId == npoId);
        if (npo == null)
            return NotFound("NPO not found.");

        //Check they aren't already following this NPO
        var alreadyFollowing = await _context.Follows
            .AnyAsync(f => f.UserId == userId && f.NpoId == npoId);

        if (alreadyFollowing)
            return BadRequest("You already follow this NPO.");

        //Create the Follow row
        var follow = new Follow
        {
            UserId = userId,
            NpoId = npoId,
            FollowDate = DateTime.UtcNow
        };

        _context.Follows.Add(follow);
        await _context.SaveChangesAsync();

        // Best-effort: tell the NPO they gained a follower.
        if (_notifications != null)
        {
            try
            {
                var follower = await _context.Individuals.FirstOrDefaultAsync(i => i.UserId == userId);
                var followerName = follower != null ? $"{follower.FirstName} {follower.LastName}" : "Someone";
                await _notifications.CreateAsync(
                    npo.UserId,
                    "NewFollower",
                    $"{followerName} started following your organization.");
            }
            catch { /* notifications are non-critical */ }
        }

        return Ok(new { message = "You are now following this NPO." });
    }

    //UNFOLLOW AN NPO
    [Authorize]
    [HttpDelete("unfollow/{npoId}")]
    public async Task<IActionResult> UnfollowNpo(int npoId)
    {
        var userId = CallerId;

        var follow = await _context.Follows
            .FirstOrDefaultAsync(f => f.UserId == userId && f.NpoId == npoId);

        if (follow == null)
            return BadRequest("You are not following this NPO.");

        _context.Follows.Remove(follow);
        await _context.SaveChangesAsync();

        return Ok(new { message = "You have unfollowed this NPO." });
    }

    //GET MY FOLLOWED NPOs
    [Authorize]
    [HttpGet("my-follows")]
    public async Task<IActionResult> GetMyFollows()
    {
        var userId = CallerId;

        var followedNpos = await _context.Follows
            .Where(f => f.UserId == userId)
            .Include(f => f.Npo)
                .ThenInclude(n => n.User)
                    .ThenInclude(u => u.Profile)
            .Select(f => new
            {
                npoId = f.NpoId,
                organizationName = f.Npo.OrganizationName,
                focusArea = f.Npo.NpofocusArea,
                mission = f.Npo.Npomission,
                location = f.Npo.User.Location,
                isVerified = f.Npo.User.IsVerified,
                profileImage = f.Npo.User.Profile != null ? f.Npo.User.Profile.ProfileImage : null,
                followDate = f.FollowDate
            })
            .OrderByDescending(f => f.followDate)
            .ToListAsync();

        return Ok(followedNpos);
    }

    //VIEW SINGLE NPO PROFILE
    [HttpGet("npo/{npoId}")]
    public async Task<IActionResult> GetNpoProfile(int npoId)
    {
        var npo = await _context.Npos
            .Include(n => n.User)
            .Where(n => n.NpoId == npoId)
            .Select(n => new
            {
                npoId = n.NpoId,
                organizationName = n.OrganizationName,
                focusArea = n.NpofocusArea,
                mission = n.Npomission,
                location = n.User.Location,
                isVerified = n.User.IsVerified,
                followerCount = _context.Follows.Count(f => f.NpoId == n.NpoId)
            })
            .FirstOrDefaultAsync();

        if (npo == null)
            return NotFound("NPO not found.");

        return Ok(npo);
    }
    //APPLY TO VOLUNTEER OPPORTUNITY
    [Authorize]
    [HttpPost("volunteer/apply/{opportunityId}")]
    public async Task<IActionResult> ApplyToVolunteer(int opportunityId, [FromBody] VolunteerApplicationDto dto)
    {
        var userId = CallerId;

        // Verification gate — unverified users may browse but not apply.
        var gate = await _gate.CanTransactAsync(userId);
        if (!gate.Allowed) return StatusCode(403, gate.Reason);

        var opportunity = await _context.VolunteerOpportunities
            .Include(v => v.Npo)
            .FirstOrDefaultAsync(v => v.OpportunityId == opportunityId);
        if (opportunity == null)
            return NotFound("Volunteer opportunity not found.");

        // Look at the applicant's existing application for this opportunity (if any).
        // Active statuses (Pending/Accepted/Completed) block a re-apply; a previously
        // Cancelled or Rejected one is reactivated in place instead of leaving a stale
        // row behind or creating a duplicate.
        var existing = await _context.VolunteerApplications
            .FirstOrDefaultAsync(a => a.UserId == userId && a.OpportunityId == opportunityId);

        var activeStatuses = new[] { "Pending", "Accepted", "Completed" };
        if (existing != null && activeStatuses.Contains(existing.Status))
            return BadRequest("You have already applied to this opportunity.");

        VolunteerApplication application;
        if (existing != null)
        {
            // Reactivate the previously Cancelled/Rejected application: refresh the
            // submitted details and move it back to Pending with a new date so it
            // surfaces as a fresh application in "My Volunteering".
            existing.FirstName = dto.FirstName;
            existing.LastName = dto.LastName;
            existing.Email = dto.Email;
            existing.PhoneNum = dto.PhoneNum;
            existing.Skills = dto.Skills;
            existing.Availability = dto.Availability;
            existing.WhyVolunteer = dto.WhyVolunteer;
            existing.Address = dto.Address;
            existing.Idnumber = dto.Idnumber;
            existing.Status = "Pending";
            existing.ApplicationDate = DateTime.UtcNow;
            application = existing;
        }
        else
        {
            application = new VolunteerApplication
            {
                UserId = userId,
                OpportunityId = opportunityId,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                PhoneNum = dto.PhoneNum,
                Skills = dto.Skills,
                Availability = dto.Availability,
                WhyVolunteer = dto.WhyVolunteer,
                Address = dto.Address,
                Idnumber = dto.Idnumber,
                Status = "Pending",
                ApplicationDate = DateTime.UtcNow
            };
            _context.VolunteerApplications.Add(application);
        }

        await _context.SaveChangesAsync();

        // Best-effort: tell the NPO a new volunteer applied.
        if (_notifications != null && opportunity.Npo != null)
        {
            try
            {
                await _notifications.CreateAsync(
                    opportunity.Npo.UserId,
                    "VolunteerApplicationReceived",
                    $"{dto.FirstName} {dto.LastName} applied to volunteer for \"{opportunity.RoleTitle}\".",
                    application.ApplicationId);
            }
            catch { /* notifications are non-critical */ }
        }

        return Ok(new { message = "Application submitted successfully.", applicationId = application.ApplicationId });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = CallerId;

        var profile = await _context.Individuals
            .Include(i => i.User)
            .Where(i => i.UserId == userId)
            .Select(i => new
            {
                userId = i.UserId,
                firstName = i.FirstName,
                lastName = i.LastName,
                causeOfCare = i.CauseOfCare,
                email = i.User.UserEmail,
                contact = i.User.UserContact,
                location = i.User.Location
            })
            .FirstOrDefaultAsync();

        if (profile == null)
            return NotFound("Profile not found.");

        return Ok(profile);
    }
    [Authorize]
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileDto dto)
    {
        var userId = CallerId;

        var individual = await _context.Individuals.FirstOrDefaultAsync(i => i.UserId == userId);
        if (individual == null)
            return NotFound("Profile not found.");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);

        // Optional phone: if provided, it must be a valid SA number.
        if (!string.IsNullOrWhiteSpace(dto.UserContact) && !ValidationPatterns.IsValidPhone(dto.UserContact))
            return BadRequest("Enter a valid South African phone number, e.g. +27821234567 or 0821234567.");

        if (!string.IsNullOrEmpty(dto.FirstName)) individual.FirstName = dto.FirstName;
        if (!string.IsNullOrEmpty(dto.LastName)) individual.LastName = dto.LastName;
        if (dto.CauseOfCare != null) individual.CauseOfCare = dto.CauseOfCare;
        if (!string.IsNullOrEmpty(dto.UserContact)) user!.UserContact = ValidationPatterns.NormalizePhone(dto.UserContact);
        if (!string.IsNullOrEmpty(dto.Location)) user!.Location = dto.Location;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Profile updated successfully." });
    }
    //MY DONATIONS
    [Authorize]
    [HttpGet("my-donations")]
    public async Task<IActionResult> GetMyDonations()
    {
        var userId = CallerId;

        var donations = await _context.Transactions
            .Where(t => t.SenderUserId == userId && t.TransactionType == "Donation")
            .OrderByDescending(t => t.Timestamp)
            .Select(t => new
            {
                transactionId = t.TransactionId,
                amount = t.Amount,
                status = t.Status,
                timestamp = t.Timestamp,
                receiverUserId = t.ReceiverUserId
            })
            .ToListAsync();

        var totalDonated = donations
            .Where(d => d.status == "Completed")
            .Sum(d => d.amount);

        return Ok(new
        {
            totalDonated = totalDonated,
            count = donations.Count,
            donations = donations
        });
    }

    // FULL TRANSACTION HISTORY — every money movement involving this user
    // (top-ups in, donations out, withdrawals out, campaign funds in) with a
    // resolved counterparty NAME + direction, plus summary totals.
    [Authorize]
    [HttpGet("transactions")]
    public async Task<IActionResult> GetMyTransactions()
    {
        var userId = CallerId;

        var rows = await _context.Transactions
            .Where(t => t.SenderUserId == userId || t.ReceiverUserId == userId)
            .OrderByDescending(t => t.Timestamp)
            .Select(t => new
            {
                t.TransactionId,
                t.SenderUserId,
                t.ReceiverUserId,
                t.Amount,
                t.TransactionType,
                t.Status,
                t.Timestamp
            })
            .ToListAsync();

        // Resolve names for every counterparty id in one lookup.
        var otherIds = rows
            .Select(r => r.SenderUserId == userId ? r.ReceiverUserId : r.SenderUserId)
            .Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();

        // Shared resolver (falls back to a direct instance when not injected, e.g. in tests).
        var resolver = _names ?? new UserNameResolver(_context);
        var names = await resolver.ResolveAsync(otherIds);

        var transactions = rows.Select(r =>
        {
            // "In" means money arrived in this user's wallet.
            var isIncoming = r.ReceiverUserId == userId;
            var otherId = isIncoming ? r.SenderUserId : r.ReceiverUserId;
            string counterparty = r.TransactionType switch
            {
                "TopUp" => "Wallet top-up (card)",
                "Withdrawal" => "Bank withdrawal",
                _ => otherId.HasValue && names.TryGetValue(otherId.Value, out var n) ? n : "UbuntuConnect"
            };
            return new
            {
                transactionId = r.TransactionId,
                type = r.TransactionType,
                direction = isIncoming ? "in" : "out",
                amount = r.Amount,
                status = r.Status,
                timestamp = r.Timestamp,
                counterpartyName = counterparty
            };
        }).ToList();

        bool Completed(string s) => s == "Completed";
        var totalToppedUp = rows.Where(r => r.TransactionType == "TopUp" && Completed(r.Status)).Sum(r => r.Amount);
        var totalDonated = rows.Where(r => r.TransactionType == "Donation" && r.SenderUserId == userId && Completed(r.Status)).Sum(r => r.Amount);
        var totalWithdrawn = rows.Where(r => r.TransactionType == "Withdrawal" && Completed(r.Status)).Sum(r => r.Amount);
        var totalReceived = rows.Where(r => r.ReceiverUserId == userId && r.TransactionType != "TopUp" && Completed(r.Status)).Sum(r => r.Amount);

        return Ok(new
        {
            summary = new { totalToppedUp, totalDonated, totalWithdrawn, totalReceived, count = transactions.Count },
            transactions
        });
    }

    //MY VOLUNTEERING
    [Authorize]
    [HttpGet("my-volunteering")]
    public async Task<IActionResult> GetMyVolunteering()
    {
        var userId = CallerId;

        var applications = await _context.VolunteerApplications
            .Include(a => a.Opportunity)
                .ThenInclude(o => o.Npo)
            .Include(a => a.VolunteerLogs)
            .Where(a => a.UserId == userId)
            .Select(a => new
            {
                applicationId = a.ApplicationId,
                opportunityId = a.OpportunityId,
                roleTitle = a.Opportunity.RoleTitle,
                npoName = a.Opportunity.Npo.OrganizationName,
                status = a.Status,
                applicationDate = a.ApplicationDate,
                totalHoursLogged = a.VolunteerLogs.Sum(l => l.LogHours)
            })
            .OrderByDescending(a => a.applicationDate)
            .ToListAsync();

        return Ok(applications);
    }

    //MY IMPACT 
    [Authorize]
    [HttpGet("my-impact")]
    public async Task<IActionResult> GetMyImpact()
    {
        var userId = CallerId;

        var totalDonated = await _context.Transactions
            .Where(t => t.SenderUserId == userId && t.TransactionType == "Donation" && t.Status == "Completed")
            .SumAsync(t => t.Amount);

        var totalHoursVolunteered = await _context.VolunteerLogs
            .Where(l => l.Application.UserId == userId)
            .SumAsync(l => l.LogHours);

        var npoCount = await _context.Follows
            .Where(f => f.UserId == userId)
            .CountAsync();

        var completedApplications = await _context.VolunteerApplications
    .Where(a => a.UserId == userId && a.Status == "Accepted")
    .CountAsync();

        return Ok(new
        {
            totalDonated = totalDonated,
            totalHoursVolunteered = totalHoursVolunteered,
            npoFollowing = npoCount,
            volunteerRolesCompleted = completedApplications
        });
    }

    //COMMUNITY UPDATES (posts from NPOs I follow) 
    // ── COMMUNITY UPDATES (all posts, newest first) ───────────
    [HttpGet("community-updates")]
    public async Task<IActionResult> GetCommunityUpdates()
    {
        var posts = await _context.Posts
            .Include(p => p.User)
                .ThenInclude(u => u.Npos)
            .OrderByDescending(p => p.Timestamp)
            .Select(p => new
            {
                postId = p.PostId,
                authorName = p.User.Npos.Any()
                    ? p.User.Npos.First().OrganizationName
                    : p.User.UserEmail,
                // Author's NPO id (null when the author isn't an NPO) so the
                // client can link the name/avatar to that NPO's profile.
                authorNpoId = p.User.Npos.Any()
                    ? (int?)p.User.Npos.First().NpoId
                    : null,
                postTitle = p.PostTitle,
                content = p.Content,
                mediaUrl = p.MediaUrl,
                likeCount = p.LikeCount,
                timestamp = p.Timestamp
            })
            .ToListAsync();

        return Ok(posts);
    }
    // ── DONATE TO AN NPO ───────────────────────────────────────
    [Authorize]
    [HttpPost("donate/{npoId}")]
    public async Task<IActionResult> Donate(int npoId, [FromBody] DonateDto dto)
    {
        var userId = CallerId;

        // Verification gate — anti-fraud/AML: only fully verified users may donate.
        var gate = await _gate.CanTransactAsync(userId);
        if (!gate.Allowed) return StatusCode(403, gate.Reason);

        if (dto.Amount <= 0)
            return BadRequest("Donation amount must be greater than zero.");

        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.NpoId == npoId);
        if (npo == null)
            return NotFound("NPO not found.");

        var senderWallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);
        if (senderWallet == null)
            return BadRequest("You do not have a wallet set up yet.");

        // Insufficient funds — log the FAILED attempt, still return an error
        if (senderWallet.Balance < dto.Amount)
        {
            _context.Transactions.Add(new Transaction
            {
                SenderUserId = userId,
                ReceiverUserId = npo.UserId,
                Amount = dto.Amount,
                TransactionType = "Donation",
                Status = "Failed",
                Timestamp = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            return BadRequest("Insufficient wallet balance.");
        }

        var receiverWallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == npo.UserId);
        if (receiverWallet == null)
            return BadRequest("This NPO does not have a wallet set up yet.");

        // ── Atomic block — all or nothing ──────────────────────
        using var dbTransaction = await _context.Database.BeginTransactionAsync();
        try
        {
            senderWallet.Balance -= dto.Amount;
            receiverWallet.Balance += dto.Amount;

            var transaction = new Transaction
            {
                SenderUserId = userId,
                ReceiverUserId = npo.UserId,
                Amount = dto.Amount,
                TransactionType = "Donation",
                Status = "Completed",
                Timestamp = DateTime.UtcNow
            };
            _context.Transactions.Add(transaction);

            await _context.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            // Best-effort: tell the NPO they received a donation.
            if (_notifications != null)
            {
                try
                {
                    await _notifications.CreateAsync(
                        npo.UserId,
                        "DonationReceived",
                        $"You received a donation of R {dto.Amount:0.##}.");
                }
                catch { /* notifications are non-critical */ }
            }

            return Ok(new
            {
                message = "Donation successful.",
                transactionId = transaction.TransactionId,
                newBalance = senderWallet.Balance
            });
        }
        catch
        {
            await dbTransaction.RollbackAsync();
            return StatusCode(500, "Donation failed due to a server error. No funds were moved.");
        }
    }

    [Authorize]
    [HttpGet("volunteer/application/{applicationId}")]
    public async Task<IActionResult> GetVolunteerApplication(int applicationId)
    {
        var userId = CallerId;

        var application = await _context.VolunteerApplications
            .Include(a => a.Opportunity)
                .ThenInclude(o => o.Npo)
            .Include(a => a.VolunteerLogs)
            .FirstOrDefaultAsync(a => a.ApplicationId == applicationId);

        if (application == null)
            return NotFound("Application not found.");

        // Ownership check — single query, no second round-trip
        if (application.UserId != userId)
            return Forbid();

        return Ok(new
        {
            applicationId = application.ApplicationId,
            roleTitle = application.Opportunity.RoleTitle,
            npoName = application.Opportunity.Npo.OrganizationName,
            description = application.Opportunity.Description,
            status = application.Status,
            applicationDate = application.ApplicationDate,
            skills = application.Skills,
            availability = application.Availability,
            whyVolunteer = application.WhyVolunteer,
            totalHoursLogged = application.VolunteerLogs.Sum(l => l.LogHours),
            logs = application.VolunteerLogs.Select(l => new
            {
                logId = l.LogId,
                hours = l.LogHours,
                date = l.LogDate,
                notes = l.Notes
            })
        });
    }
    [Authorize]
    [HttpDelete("volunteer/application/{applicationId}")]
    public async Task<IActionResult> CancelVolunteerApplication(int applicationId)
    {
        var userId = CallerId;

        var application = await _context.VolunteerApplications
            .FirstOrDefaultAsync(a => a.ApplicationId == applicationId);

        if (application == null)
            return NotFound("Application not found.");

        if (application.UserId != userId)
            return Forbid();

        if (application.Status == "Accepted")
            return BadRequest("You cannot cancel an application that has already been accepted. Contact the NPO directly.");

        application.Status = "Cancelled";
        await _context.SaveChangesAsync();

        return Ok(new { message = "Application cancelled." });
    }
    [Authorize]
    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userId = CallerId;

        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
        if (user == null)
            return NotFound("User not found.");

        bool currentPasswordValid = BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash);
        if (!currentPasswordValid)
            return BadRequest("Current password is incorrect.");

        if (dto.NewPassword.Length < 8)
            return BadRequest("New password must be at least 8 characters long.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Password changed successfully." });
    }
    // ── DEACTIVATE MY ACCOUNT ──────────────────────────────────
    [Authorize]
    [HttpPut("deactivate")]
    public async Task<IActionResult> DeactivateAccount([FromBody] DeactivateAccountDto dto)
    {
        var userId = CallerId;

        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
        if (user == null)
            return NotFound("User not found.");

        bool passwordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
        if (!passwordValid)
            return BadRequest("Incorrect password. Account not deactivated.");

        user.IsActive = false;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Your account has been deactivated." });
    }

    // ── TOP UP WALLET ──────────────────────────────────────────
    // Adds funds to the caller's own wallet. In a real system this would
    // integrate with a payment gateway; for now it directly credits the
    // wallet and logs a completed Transaction (same atomic pattern as Donate).
    [Authorize]
    [HttpPost("topup")]
    public async Task<IActionResult> TopUp([FromBody] TopUpRequest dto)
    {
        var userId = CallerId;

        // Verification gate — anti-fraud/AML: only fully verified users may top up.
        var gate = await _gate.CanTransactAsync(userId);
        if (!gate.Allowed) return StatusCode(403, gate.Reason);

        if (dto.Amount <= 0)
            return BadRequest("Top-up amount must be greater than zero.");

        // Per-transaction top-up limits.
        if (dto.Amount < _limits.MinTopUp)
            return BadRequest($"Minimum top-up is R {_limits.MinTopUp:0.##}.");
        if (dto.Amount > _limits.MaxTopUp)
            return BadRequest($"Maximum top-up is R {_limits.MaxTopUp:0.##}.");

        // Simulated card charge. A card is always required and must be
        // well-formed (13–16 digits + non-expired expiry + CVV); no real issuer check.
        if (_payments != null)
        {
            var charge = _payments.Charge(dto.CardNumber, dto.CardExpiry, dto.CardCvv);
            if (!charge.Approved)
                return BadRequest(charge.DeclineReason ?? "Card was declined.");
        }

        var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
            return BadRequest("You do not have a wallet set up yet.");

        using var dbTransaction = await _context.Database.BeginTransactionAsync();
        try
        {
            wallet.Balance += dto.Amount;

            var transaction = new Transaction
            {
                SenderUserId = null,       // external source (no internal sender)
                ReceiverUserId = userId,
                Amount = dto.Amount,
                TransactionType = "TopUp",
                Status = "Completed",
                Timestamp = DateTime.UtcNow
            };
            _context.Transactions.Add(transaction);

            await _context.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            return Ok(new
            {
                message = "Wallet topped up successfully.",
                transactionId = transaction.TransactionId,
                newBalance = wallet.Balance
            });
        }
        catch
        {
            await dbTransaction.RollbackAsync();
            return StatusCode(500, "Top-up failed due to a server error.");
        }
    }
}