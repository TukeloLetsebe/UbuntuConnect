using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Models;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/VolunteerOpportunity")]
public class VolunteerOpportunityController : ControllerBase
{
    private readonly AppDbContext _context;

    public VolunteerOpportunityController(AppDbContext context)
    {
        _context = context;
    }

    // Public — Individuals browse these before applying (IndividualController depends on this data existing)
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _context.VolunteerOpportunities.ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var opp = await _context.VolunteerOpportunities.FindAsync(id);
        if (opp == null) return NotFound();
        return Ok(opp);
    }

    [HttpGet("npo/{npoId}")]
    public async Task<IActionResult> GetByNpo(int npoId)
    {
        var list = await _context.VolunteerOpportunities.Where(v => v.NpoId == npoId).ToListAsync();
        return Ok(list);
    }

    [Authorize(Roles = "NPO")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVolunteerOpportunityRequest req)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        // Derive the caller's own NPO — never trust req.NpoId from the body
        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.UserId == userId);
        if (npo == null) return BadRequest("No NPO profile linked to this account.");

        var opp = new VolunteerOpportunity
        {
            NpoId = npo.NpoId,
            FundingRequestId = req.FundingRequestId,
            RoleTitle = req.RoleTitle,
            Category = req.Category,
            NumOfPositions = req.NumOfPositions,
            Description = req.Description,
            SkillsRequired = req.SkillsRequired,
            TimeCommitment = req.TimeCommitment,
            Duration = req.Duration,
            MediaUrl = req.MediaURL
        };

        _context.VolunteerOpportunities.Add(opp);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = opp.OpportunityId }, opp);
    }

    [Authorize(Roles = "NPO")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateVolunteerOpportunityRequest req)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var opp = await _context.VolunteerOpportunities
            .Include(o => o.Npo)
            .FirstOrDefaultAsync(o => o.OpportunityId == id);
        if (opp == null) return NotFound();

        // Ownership check — only the NPO that posted it can edit it
        if (opp.Npo.UserId != userId) return Forbid();

        if (req.FundingRequestId.HasValue) opp.FundingRequestId = req.FundingRequestId;
        if (req.RoleTitle != null) opp.RoleTitle = req.RoleTitle;
        if (req.Category != null) opp.Category = req.Category;
        if (req.NumOfPositions.HasValue) opp.NumOfPositions = req.NumOfPositions.Value;
        if (req.Description != null) opp.Description = req.Description;
        if (req.SkillsRequired != null) opp.SkillsRequired = req.SkillsRequired;
        if (req.TimeCommitment != null) opp.TimeCommitment = req.TimeCommitment;
        if (req.Duration != null) opp.Duration = req.Duration;
        if (req.MediaURL != null) opp.MediaUrl = req.MediaURL;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "NPO")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var opp = await _context.VolunteerOpportunities
            .Include(o => o.Npo)
            .FirstOrDefaultAsync(o => o.OpportunityId == id);
        if (opp == null) return NotFound();

        if (opp.Npo.UserId != userId) return Forbid();

        _context.VolunteerOpportunities.Remove(opp);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}