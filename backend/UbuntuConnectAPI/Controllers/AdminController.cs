using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.Services.Cleanup;
using UbuntuConnectAPI.Services.Email;
using UbuntuConnectAPI.Services.Notifications;
using UbuntuConnectAPI.Services.Users;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly IGhostAccountCleanupService _ghostCleanup;
    private readonly IUserNameResolver _names;
    // Optional so existing tests that construct the controller directly keep working;
    // notifications/emails are best-effort and never block the admin decision.
    private readonly INotificationService? _notifications;
    private readonly IEmailService? _email;

    public AdminController(
        AppDbContext context,
        IGhostAccountCleanupService ghostCleanup,
        IUserNameResolver names,
        INotificationService? notifications = null,
        IEmailService? email = null)
    {
        _context = context;
        _ghostCleanup = ghostCleanup;
        _names = names;
        _notifications = notifications;
        _email = email;
    }

    // ── PLATFORM STATS ─────────────────────────────────────────
    [HttpGet("stats")]
    public async Task<IActionResult> GetPlatformStats()
    {
        var totalUsers = await _context.Users.CountAsync();
        var individuals = await _context.Users.CountAsync(u => u.UserType == "Individual");
        var npos = await _context.Users.CountAsync(u => u.UserType == "NPO");
        var businesses = await _context.Users.CountAsync(u => u.UserType == "Business");
        var totalDonations = await _context.Transactions
            .Where(t => t.TransactionType == "Donation" && t.Status == "Completed")
            .SumAsync(t => t.Amount);
        var totalTransactions = await _context.Transactions.CountAsync();
        var activeCampaigns = await _context.PartnershipCampaigns.CountAsync();
        var pendingVerifications = await _context.Verifications.CountAsync(v => v.Status == "Pending");
        var activeUsers = await _context.Users.CountAsync(u => u.IsActive);
        var inactiveUsers = totalUsers - activeUsers;

        return Ok(new
        {
            totalUsers,
            individuals,
            npos,
            businesses,
            totalDonations,
            totalTransactions,
            activeCampaigns,
            pendingVerifications,
            activeUsers,
            inactiveUsers
        });
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _context.Users
            .OrderByDescending(u => u.UserId)
            .Select(u => new
            {
                userId = u.UserId,
                email = u.UserEmail,
                userType = u.UserType,
                isActive = u.IsActive,
                isVerified = u.IsVerified
            })
            .ToListAsync();
        return Ok(users);
    }

    [HttpGet("users/{id}")]
    public async Task<IActionResult> GetUser(int id)
    {
        var user = await _context.Users
            .Where(u => u.UserId == id)
            .Select(u => new
            {
                userId = u.UserId,
                email = u.UserEmail,
                contact = u.UserContact,
                location = u.Location,
                userType = u.UserType,
                isActive = u.IsActive,
                isVerified = u.IsVerified
            })
            .FirstOrDefaultAsync();
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpPut("users/{id}/activate")]
    public async Task<IActionResult> ActivateUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();
        user.IsActive = true;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("users/{id}/deactivate")]
    public async Task<IActionResult> DeactivateUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();
        user.IsActive = false;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("verifications")]
    public async Task<IActionResult> GetVerifications([FromQuery] string? status)
    {
        var q = _context.Verifications.AsQueryable();
        if (!string.IsNullOrEmpty(status)) q = q.Where(v => v.Status == status);

        var list = await q
            .OrderByDescending(v => v.SubmittedDate)
            .Select(v => new
            {
                verificationId = v.VerificationId,
                status = v.Status,
                submittedDate = v.SubmittedDate,
                reviewedByUserId = v.ReviewedByUserId,
                reviewedDate = v.ReviewedDate,

                // Which kind of applicant this is.
                subjectType = v.BusinessId != null ? "Business" : "NPO",
                npoId = v.NpoId,
                businessId = v.BusinessId,

                // Display name + registration shown on the admin card, resolved
                // from whichever subject the row belongs to.
                organizationName = v.BusinessId != null
                    ? (v.Business!.ContactPersonName ?? "Business")
                    : v.Npo!.OrganizationName,
                regNum = v.BusinessId != null ? v.Business!.BusinessRegNum : v.Npo!.NporegNum,
                focusArea = v.BusinessId != null ? v.Business!.Industry : v.Npo!.NpofocusArea,
                mission = v.BusinessId != null ? v.Business!.CsrGoal : v.Npo!.Npomission,

                // Contact details come from the subject's linked User.
                email = v.BusinessId != null ? v.Business!.User.UserEmail : v.Npo!.User.UserEmail,
                contact = v.BusinessId != null ? v.Business!.User.UserContact : v.Npo!.User.UserContact,
                location = v.BusinessId != null ? v.Business!.User.Location : v.Npo!.User.Location,
                isVerified = v.BusinessId != null ? v.Business!.User.IsVerified : v.Npo!.User.IsVerified,

                // Supporting documents (NPO: certificate + tax; Business: CIPC + tax clearance).
                document1 = v.Npocertificate,
                document2 = v.NpotaxCertificate,
                // Back-compat aliases for the existing admin UI.
                npoCertificate = v.Npocertificate,
                npoTaxCertificate = v.NpotaxCertificate
            })
            .ToListAsync();

        return Ok(list);
    }

    [HttpPut("verifications/{id}/approve")]
    public async Task<IActionResult> ApproveVerification(int id)
    {
        var adminId = CallerId;

        var v = await _context.Verifications.FindAsync(id);
        if (v == null) return NotFound("Verification request not found.");

        var subject = await ResolveSubjectAsync(v);
        if (subject.User == null) return NotFound("The applicant for this verification no longer exists.");

        v.Status = "Approved";
        v.ReviewedByUserId = adminId;
        v.ReviewedDate = DateTime.UtcNow;
        subject.User.IsVerified = true;

        await _context.SaveChangesAsync();

        await NotifyVerificationOutcomeAsync(subject.User, subject.DisplayName, subject.IsBusiness, approved: true, reason: null);
        return NoContent();
    }

    [HttpPut("verifications/{id}/reject")]
    public async Task<IActionResult> RejectVerification(int id, [FromBody] RejectVerificationRequest? req = null)
    {
        var adminId = CallerId;

        var v = await _context.Verifications.FindAsync(id);
        if (v == null) return NotFound("Verification request not found.");

        var subject = await ResolveSubjectAsync(v);

        v.Status = "Rejected";
        v.ReviewedByUserId = adminId;
        v.ReviewedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        if (subject.User != null)
            await NotifyVerificationOutcomeAsync(subject.User, subject.DisplayName, subject.IsBusiness, approved: false, reason: req?.Reason);

        return NoContent();
    }

    // Resolves the User who owns a verification (either an NPO or a Business),
    // plus a human-readable name and which kind it is.
    private async Task<(Models.User? User, string DisplayName, bool IsBusiness)> ResolveSubjectAsync(Models.Verification v)
    {
        if (v.BusinessId != null)
        {
            var business = await _context.Businesses.Include(b => b.User).FirstOrDefaultAsync(b => b.BusinessId == v.BusinessId);
            return (business?.User, business?.ContactPersonName ?? "your business", true);
        }

        var npo = await _context.Npos.Include(n => n.User).FirstOrDefaultAsync(n => n.NpoId == v.NpoId);
        return (npo?.User, npo?.OrganizationName ?? "your organization", false);
    }

    // Sends the applicant an in-app notification + email about their verification
    // outcome. Best-effort: failures are swallowed so they never block the admin.
    private async Task NotifyVerificationOutcomeAsync(Models.User user, string displayName, bool isBusiness, bool approved, string? reason)
    {
        var trimmedReason = string.IsNullOrWhiteSpace(reason) ? "" : $" Reason: {reason.Trim()}";
        var subjectWord = isBusiness ? "business" : "NPO";
        var unlocks = isBusiness
            ? "create partnership campaigns, donate to NPOs, and withdraw funds"
            : "create fundraisers, post volunteer opportunities, apply to campaigns, donate, and withdraw funds";

        if (_notifications != null)
        {
            try
            {
                await _notifications.CreateAsync(
                    user.UserId,
                    approved ? "VerificationApproved" : "VerificationRejected",
                    approved
                        ? $"Your {subjectWord} has been verified! You can now {unlocks}."
                        : $"Your {subjectWord} verification was not approved. Please review your documents and submit again.{trimmedReason}");
            }
            catch { /* notifications are non-critical */ }
        }

        if (_email != null && !string.IsNullOrWhiteSpace(user.UserEmail))
        {
            try
            {
                await _email.SendAsync(new EmailMessage
                {
                    ToEmail = user.UserEmail,
                    Subject = approved
                        ? $"Your UbuntuConnect {subjectWord} is verified"
                        : $"Your UbuntuConnect {subjectWord} verification",
                    Body = approved
                        ? $"Good news! {displayName}'s verification has been approved. You now have full access to {unlocks}.\n\n— UbuntuConnect"
                        : $"Your verification for {displayName} could not be approved.{trimmedReason}\n\nPlease log in, review your submitted documents, and submit again.\n\n— UbuntuConnect"
                });
            }
            catch { /* email is non-critical */ }
        }
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions([FromQuery] int? userId)
    {
        var q = _context.Transactions.AsQueryable();
        if (userId.HasValue)
            q = q.Where(t => t.SenderUserId == userId.Value || t.ReceiverUserId == userId.Value);

        var rows = await q.OrderByDescending(t => t.Timestamp)
            .Select(t => new
            {
                transactionId = t.TransactionId,
                senderUserId = t.SenderUserId,
                receiverUserId = t.ReceiverUserId,
                amount = t.Amount,
                transactionType = t.TransactionType,
                status = t.Status,
                timestamp = t.Timestamp
            })
            .ToListAsync();

        // Resolve display names for the sender/receiver ids in one lookup, so the
        // admin UI shows "From Thabo Mokoena → Safe Waters Trust", not "User #3".
        var ids = rows.SelectMany(r => new[] { r.senderUserId, r.receiverUserId })
                      .Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();
        var names = await _names.ResolveAsync(ids);

        var txs = rows.Select(r => new
        {
            r.transactionId,
            r.senderUserId,
            r.receiverUserId,
            senderName = r.senderUserId.HasValue && names.TryGetValue(r.senderUserId.Value, out var sn) ? sn : null,
            receiverName = r.receiverUserId.HasValue && names.TryGetValue(r.receiverUserId.Value, out var rn) ? rn : null,
            r.amount,
            r.transactionType,
            r.status,
            r.timestamp
        });

        return Ok(txs);
    }

    // ── GHOST ACCOUNT CLEANUP (Task 8) ─────────────────────────
    // Preview which ghost (never-verified) accounts would be removed, without
    // changing anything. Admins use this before running an actual cleanup.
    [HttpGet("ghost-cleanup/preview")]
    public async Task<IActionResult> PreviewGhostCleanup()
    {
        var result = await _ghostCleanup.RunAsync(dryRun: true);
        return Ok(new
        {
            dryRun = true,
            softDeleted = result.SoftDeleted,
            hardDeleted = result.HardDeleted,
            softDeletedUserIds = result.SoftDeletedUserIds,
            hardDeletedUserIds = result.HardDeletedUserIds
        });
    }

    // Run an actual cleanup pass on demand (applies soft/hard deletes).
    [HttpPost("ghost-cleanup/run")]
    public async Task<IActionResult> RunGhostCleanup()
    {
        var result = await _ghostCleanup.RunAsync(dryRun: false);
        return Ok(new
        {
            dryRun = false,
            softDeleted = result.SoftDeleted,
            hardDeleted = result.HardDeleted
        });
    }
}

public class RejectVerificationRequest
{
    public string? Reason { get; set; }
}
