using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/VolunteerApplication")]
public class VolunteerApplicationController : ControllerBase
{
    private readonly AppDbContext _context;

    public VolunteerApplicationController(AppDbContext context)
    {
        _context = context;
    }

    // NOTE: This "get all across the whole platform" endpoint is really an
    // admin/NPO-management view, not something an Individual should be able
    // to call. Locking it to NPO role — an NPO managing applicants across
    // opportunities. If you want a true cross-platform admin view later,
    // that belongs in an AdminController instead.
    [Authorize(Roles = "NPO")]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _context.VolunteerApplications.OrderByDescending(v => v.ApplicationDate).ToListAsync();
        return Ok(list);
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

        // Ownership check — only the NPO that owns this opportunity can view its applicants
        if (opportunity.Npo.UserId != userId) return Forbid();

        var list = await _context.VolunteerApplications
            .Where(v => v.OpportunityId == opportunityId)
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

        var list = await _context.VolunteerApplications.Where(v => v.UserId == userId).ToListAsync();
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

    // NOTE: Delete endpoint removed. Your IndividualController already has
    // CancelVolunteerApplication, which soft-cancels (Status = "Cancelled")
    // rather than deleting the row. Keeping one path for this avoids two
    // different "remove an application" behaviors existing side by side.
}