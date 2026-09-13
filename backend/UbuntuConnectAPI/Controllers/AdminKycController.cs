using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.Services.Email;
using UbuntuConnectAPI.Services.Notifications;

namespace UbuntuConnectAPI.Controllers;

/// <summary>
/// Admin review of individual identity-verification (KYC) submissions.
/// Approving flips the individual's User.IsVerified so they can transact.
/// Both outcomes notify + email the individual.
/// </summary>
[ApiController]
[Route("api/admin/kyc")]
[Authorize(Roles = "Admin")]
public class AdminKycController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notifications;
    private readonly IEmailService _email;

    public AdminKycController(AppDbContext context, INotificationService notifications, IEmailService email)
    {
        _context = context;
        _notifications = notifications;
        _email = email;
    }

    private int AdminId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    // List individual KYC submissions (default: Pending).
    [HttpGet]
    public async Task<IActionResult> GetSubmissions([FromQuery] string? status = "Pending")
    {
        var query = _context.Individuals.AsQueryable();
        if (!string.IsNullOrWhiteSpace(status) && status != "All")
            query = query.Where(i => i.KycStatus == status);
        else
            query = query.Where(i => i.KycStatus != "NotSubmitted");

        var items = await query
            .OrderByDescending(i => i.SubmittedDate)
            .Select(i => new
            {
                individualId = i.IndividualId,
                userId = i.UserId,
                fullName = i.FirstName + " " + i.LastName,
                email = i.User.UserEmail,
                idNumber = i.IdNumber,
                idDocumentUrl = i.IdDocumentUrl,
                selfieUrl = i.SelfieUrl,
                kycStatus = i.KycStatus,
                kycRoute = i.KycRoute,
                kycMatchScore = i.KycMatchScore,
                submittedDate = i.SubmittedDate,
                reviewedDate = i.ReviewedDate
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpPut("{individualId}/approve")]
    public async Task<IActionResult> Approve(int individualId)
    {
        var individual = await _context.Individuals
            .Include(i => i.User)
            .FirstOrDefaultAsync(i => i.IndividualId == individualId);
        if (individual == null) return NotFound("Submission not found.");
        if (individual.KycStatus != "Pending")
            return BadRequest("This submission is not pending review.");

        individual.KycStatus = "Approved";
        individual.ReviewedByUserId = AdminId;
        individual.ReviewedDate = DateTime.UtcNow;
        individual.User.IsVerified = true;
        await _context.SaveChangesAsync();

        await _notifications.CreateAsync(
            individual.UserId,
            "KycApproved",
            "Your identity has been verified. You can now donate, top up, and volunteer.");

        await _email.SendAsync(new EmailMessage
        {
            ToEmail = individual.User.UserEmail,
            Subject = "Your UbuntuConnect identity is verified",
            Body = "Good news! Your identity verification has been approved. You now have full access to donate, top up your wallet, and volunteer."
        });

        return Ok(new { message = "Identity approved. The individual has been notified." });
    }

    [HttpPut("{individualId}/reject")]
    public async Task<IActionResult> Reject(int individualId, [FromBody] RejectKycRequest? req)
    {
        var individual = await _context.Individuals
            .Include(i => i.User)
            .FirstOrDefaultAsync(i => i.IndividualId == individualId);
        if (individual == null) return NotFound("Submission not found.");
        if (individual.KycStatus != "Pending")
            return BadRequest("This submission is not pending review.");

        individual.KycStatus = "Rejected";
        individual.ReviewedByUserId = AdminId;
        individual.ReviewedDate = DateTime.UtcNow;
        // Ensure they remain unverified.
        individual.User.IsVerified = false;
        await _context.SaveChangesAsync();

        var reason = string.IsNullOrWhiteSpace(req?.Reason) ? "" : $" Reason: {req!.Reason.Trim()}";

        await _notifications.CreateAsync(
            individual.UserId,
            "KycRejected",
            $"Your identity verification was not approved. Please review your details and submit again.{reason}");

        await _email.SendAsync(new EmailMessage
        {
            ToEmail = individual.User.UserEmail,
            Subject = "Your UbuntuConnect identity verification",
            Body = $"Your identity verification could not be approved.{reason}\n\nPlease log in and submit again with clear photos of your ID and a matching selfie."
        });

        return Ok(new { message = "Submission rejected. The individual has been notified." });
    }
}

public class RejectKycRequest
{
    public string? Reason { get; set; }
}
