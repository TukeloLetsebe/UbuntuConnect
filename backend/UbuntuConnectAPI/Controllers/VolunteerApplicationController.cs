using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Models;
using UbuntuConnectAPI.Services.Email;
using UbuntuConnectAPI.Services.Notifications;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/VolunteerApplication")]
public class VolunteerApplicationController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly INotificationService? _notifications;
    private readonly IEmailService? _email;

    public VolunteerApplicationController(
        AppDbContext context,
        INotificationService? notifications = null,
        IEmailService? email = null)
    {
        _context = context;
        _notifications = notifications;
        _email = email;
    }

    // Returns volunteer applications for opportunities belonging to the caller's NPO only.
    [Authorize(Roles = "NPO")]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        // Find the caller's NPO
        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.UserId == userId);
        if (npo == null) return BadRequest("No NPO profile linked to this account.");

        // Only return applications for opportunities owned by this NPO
        var list = await _context.VolunteerApplications
            .Where(a => a.Opportunity.NpoId == npo.NpoId)
            .OrderByDescending(v => v.ApplicationDate)
            .Select(a => new
            {
                applicationId = a.ApplicationId,
                userId = a.UserId,
                opportunityId = a.OpportunityId,
                roleTitle = a.Opportunity.RoleTitle,
                firstName = a.FirstName,
                lastName = a.LastName,
                email = a.Email,
                phoneNum = a.PhoneNum,
                skills = a.Skills,
                availability = a.Availability,
                whyVolunteer = a.WhyVolunteer,
                status = a.Status,
                applicationDate = a.ApplicationDate
            })
            .ToListAsync();
        return Ok(list);
    }

    // Returns the applicant's VERIFIED identity (ID document + selfie) to the NPO
    // that owns the opportunity — and only if that individual passed KYC. The
    // images come from the individual's identity record (the source of truth),
    // never copied onto the application. Ownership is enforced; a non-owning NPO
    // is forbidden. Treat this as the most sensitive endpoint in the system.
    [Authorize(Roles = "NPO")]
    [HttpGet("{id}/identity")]
    public async Task<IActionResult> GetApplicantIdentity(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var app = await _context.VolunteerApplications
            .Include(a => a.Opportunity)
                .ThenInclude(o => o.Npo)
            .FirstOrDefaultAsync(a => a.ApplicationId == id);
        if (app == null) return NotFound("Application not found.");

        // Ownership check — only the NPO that owns the opportunity may view this.
        if (app.Opportunity.Npo.UserId != userId) return Forbid();

        var individual = await _context.Individuals
            .FirstOrDefaultAsync(i => i.UserId == app.UserId);

        // Only expose identity for a volunteer who has actually been verified.
        if (individual == null || individual.KycStatus != "Approved")
        {
            return Ok(new
            {
                verified = false,
                idNumber = (string?)null,
                idDocumentUrl = (string?)null,
                selfieUrl = (string?)null
            });
        }

        return Ok(new
        {
            verified = true,
            idNumber = individual.IdNumber,
            idDocumentUrl = individual.IdDocumentUrl,
            selfieUrl = individual.SelfieUrl
        });
    }

    [Authorize(Roles = "NPO")]
    [HttpGet("opportunity/{opportunityId}")]
    public async Task<IActionResult> GetByOpportunity(int opportunityId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var opportunity = await _context.VolunteerOpportunities
            .Include(o => o.Npo)
            .FirstOrDefaultAsync(o => o.OpportunityId == opportunityId);
        if (opportunity == null) return NotFound("Opportunity not found.");

        if (opportunity.Npo.UserId != userId) return Forbid();

        var list = await _context.VolunteerApplications
            .Where(v => v.OpportunityId == opportunityId)
            .Select(a => new
            {
                applicationId = a.ApplicationId,
                userId = a.UserId,
                firstName = a.FirstName,
                lastName = a.LastName,
                email = a.Email,
                phoneNum = a.PhoneNum,
                skills = a.Skills,
                availability = a.Availability,
                whyVolunteer = a.WhyVolunteer,
                status = a.Status,
                applicationDate = a.ApplicationDate
            })
            .ToListAsync();
        return Ok(list);
    }

    // Individual viewing their own applications — this duplicates
    // IndividualController.GetMyVolunteering in spirit, so it's restricted
    // to the caller's own UserId rather than any arbitrary userId in the URL.
    [Authorize]
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUser(int userId)
    {
        var callerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var callerId = int.Parse(callerIdClaim!);

        if (callerId != userId) return Forbid();

        var list = await _context.VolunteerApplications
            .Where(v => v.UserId == userId)
            .Select(a => new
            {
                applicationId = a.ApplicationId,
                opportunityId = a.OpportunityId,
                status = a.Status,
                applicationDate = a.ApplicationDate
            })
            .ToListAsync();
        return Ok(list);
    }

    [Authorize(Roles = "NPO")]
    [HttpPut("{id}/accept")]
    public async Task<IActionResult> Accept(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var app = await _context.VolunteerApplications
            .Include(a => a.Opportunity)
                .ThenInclude(o => o.Npo)
            .FirstOrDefaultAsync(a => a.ApplicationId == id);
        if (app == null) return NotFound();

        if (app.Opportunity.Npo.UserId != userId) return Forbid();

        app.Status = "Accepted";
        await _context.SaveChangesAsync();

        await NotifyApplicantAsync(app, accepted: true);
        return NoContent();
    }

    [Authorize(Roles = "NPO")]
    [HttpPut("{id}/reject")]
    public async Task<IActionResult> Reject(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var app = await _context.VolunteerApplications
            .Include(a => a.Opportunity)
                .ThenInclude(o => o.Npo)
            .FirstOrDefaultAsync(a => a.ApplicationId == id);
        if (app == null) return NotFound();

        if (app.Opportunity.Npo.UserId != userId) return Forbid();

        app.Status = "Rejected";
        await _context.SaveChangesAsync();

        await NotifyApplicantAsync(app, accepted: false);
        return NoContent();
    }

    [Authorize(Roles = "NPO")]
    [HttpPut("{id}/pending")]
    public async Task<IActionResult> Pending(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var app = await _context.VolunteerApplications
            .Include(a => a.Opportunity)
                .ThenInclude(o => o.Npo)
            .FirstOrDefaultAsync(a => a.ApplicationId == id);
        if (app == null) return NotFound();

        if (app.Opportunity.Npo.UserId != userId) return Forbid();

        app.Status = "Pending";
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // Mark an accepted volunteer as Completed once their engagement is finished.
    // Soft status change only — logged hours (and the volunteer's impact totals)
    // are preserved. NPO-only, and only the NPO that owns the opportunity.
    [Authorize(Roles = "NPO")]
    [HttpPut("{id}/complete")]
    public async Task<IActionResult> Complete(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var app = await _context.VolunteerApplications
            .Include(a => a.Opportunity)
                .ThenInclude(o => o.Npo)
            .FirstOrDefaultAsync(a => a.ApplicationId == id);
        if (app == null) return NotFound();

        if (app.Opportunity.Npo.UserId != userId) return Forbid();

        // Only an accepted volunteer can be completed.
        if (app.Status != "Accepted")
            return BadRequest("Only an accepted volunteer can be marked as completed.");

        app.Status = "Completed";
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // Best-effort notification + email to the applicant when an NPO decides on
    // their application. Failures here never block the decision itself.
    private async Task NotifyApplicantAsync(VolunteerApplication app, bool accepted)
    {
        var orgName = app.Opportunity.Npo.OrganizationName;
        var role = app.Opportunity.RoleTitle;
        var decision = accepted ? "accepted" : "not accepted";

        var notificationMessage = accepted
            ? $"Great news! {orgName} accepted your application for \"{role}\"."
            : $"{orgName} reviewed your application for \"{role}\" and it was {decision} this time.";

        if (_notifications != null)
        {
            try
            {
                await _notifications.CreateAsync(
                    app.UserId,
                    accepted ? "VolunteerAccepted" : "VolunteerRejected",
                    notificationMessage,
                    app.ApplicationId);
            }
            catch { /* notifications are non-critical */ }
        }

        if (_email != null)
        {
            var subject = accepted
                ? $"Your volunteer application was accepted — {role}"
                : $"Update on your volunteer application — {role}";
            var body = accepted
                ? $"Hi {app.FirstName},\n\nGreat news! {orgName} has accepted your application to volunteer for \"{role}\".\n\nThey may be in touch with next steps. Thank you for offering your time.\n\n— UbuntuConnect"
                : $"Hi {app.FirstName},\n\nThank you for applying to volunteer for \"{role}\" with {orgName}. After review, your application was not accepted this time.\n\nDon't be discouraged — there are many other opportunities on UbuntuConnect.\n\n— UbuntuConnect";
            try
            {
                await _email.SendAsync(new EmailMessage
                {
                    ToEmail = app.Email,
                    Subject = subject,
                    Body = body
                });
            }
            catch { /* email is non-critical */ }
        }
    }

    // NOTE: Delete endpoint removed. Your IndividualController already has
    // CancelVolunteerApplication, which soft-cancels (Status = "Cancelled")
    // rather than deleting the row. Keeping one path for this avoids two
    // different "remove an application" behaviors existing side by side.

    // ── DELETE VOLUNTEER APPLICATION ───────────────────────────
    // Only the applicant themselves or the owning NPO can delete an application.
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var app = await _context.VolunteerApplications
            .Include(a => a.Opportunity)
                .ThenInclude(o => o.Npo)
            .FirstOrDefaultAsync(a => a.ApplicationId == id);

        if (app == null) return NotFound("Application not found.");

        // Ownership check: applicant themselves OR the NPO that owns the opportunity
        bool isApplicant = app.UserId == userId;
        bool isOwningNpo = app.Opportunity.Npo.UserId == userId;

        if (!isApplicant && !isOwningNpo)
            return Forbid();

        // Remove related volunteer logs first
        var logs = await _context.VolunteerLogs
            .Where(l => l.ApplicationId == id)
            .ToListAsync();
        _context.VolunteerLogs.RemoveRange(logs);

        _context.VolunteerApplications.Remove(app);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // ── LOG VOLUNTEER HOURS ────────────────────────────────────
    // NPO logs hours for a volunteer whose application was accepted.
    // Only the NPO that owns the opportunity can log hours for it.
    [Authorize(Roles = "NPO")]
    [HttpPost("{id}/log-hours")]
    public async Task<IActionResult> LogHours(int id, [FromBody] LogHoursRequest req)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var app = await _context.VolunteerApplications
            .Include(a => a.Opportunity)
                .ThenInclude(o => o.Npo)
            .FirstOrDefaultAsync(a => a.ApplicationId == id);
        if (app == null) return NotFound("Application not found.");

        // Ownership check — NPO must own the opportunity
        if (app.Opportunity.Npo.UserId != userId) return Forbid();

        // Only accepted volunteers can have hours logged
        if (app.Status != "Accepted")
            return BadRequest("Hours can only be logged for accepted volunteers.");

        if (req.Hours <= 0)
            return BadRequest("Hours must be greater than zero.");

        var log = new Models.VolunteerLog
        {
            ApplicationId = id,
            LogHours = req.Hours,
            LogDate = req.Date ?? DateOnly.FromDateTime(DateTime.UtcNow),
            Notes = req.Notes
        };

        _context.VolunteerLogs.Add(log);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            logId = log.LogId,
            applicationId = log.ApplicationId,
            hours = log.LogHours,
            date = log.LogDate,
            notes = log.Notes
        });
    }
}