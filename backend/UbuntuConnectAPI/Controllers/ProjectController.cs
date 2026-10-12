using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.Models;
using UbuntuConnectAPI.Services.Verification;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/project")]
public class ProjectController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IVerificationGate _gate;

    public ProjectController(AppDbContext context, IVerificationGate gate)
    {
        _context = context;
        _gate = gate;
    }

    // Public — get all active projects
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var projects = await _context.Projects
            .OrderByDescending(p => p.ProjectId)
            .Select(p => new
            {
                projectId = p.ProjectId,
                npoId = p.NpoId,
                npoName = p.Npo.OrganizationName,
                projectName = p.ProjectName,
                projectDesc = p.ProjectDesc,
                projectStatus = p.ProjectStatus,
                projectProgress = p.ProjectProgress,
                targetAmount = p.TargetAmount,
                raisedAmount = p.RaisedAmount,
                images = p.Images,
                startDate = p.StartDate,
                endDate = p.EndDate
            })
            .ToListAsync();
        return Ok(projects);
    }

    // Get single project by ID
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var project = await _context.Projects
            .Where(p => p.ProjectId == id)
            .Select(p => new
            {
                projectId = p.ProjectId,
                npoId = p.NpoId,
                npoName = p.Npo.OrganizationName,
                projectName = p.ProjectName,
                projectDesc = p.ProjectDesc,
                projectStatus = p.ProjectStatus,
                projectProgress = p.ProjectProgress,
                targetAmount = p.TargetAmount,
                raisedAmount = p.RaisedAmount,
                images = p.Images,
                startDate = p.StartDate,
                endDate = p.EndDate
            })
            .FirstOrDefaultAsync();

        if (project == null) return NotFound();
        return Ok(project);
    }

    // Get projects by NPO (ownership via JWT)
    [Authorize(Roles = "NPO")]
    [HttpGet("my-projects")]
    public async Task<IActionResult> GetMyProjects()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.UserId == userId);
        if (npo == null) return BadRequest("No NPO profile linked to this account.");

        var projects = await _context.Projects
            .Where(p => p.NpoId == npo.NpoId)
            .OrderByDescending(p => p.ProjectId)
            .Select(p => new
            {
                projectId = p.ProjectId,
                npoId = p.NpoId,
                projectName = p.ProjectName,
                projectDesc = p.ProjectDesc,
                projectStatus = p.ProjectStatus,
                projectProgress = p.ProjectProgress,
                targetAmount = p.TargetAmount,
                raisedAmount = p.RaisedAmount,
                images = p.Images,
                startDate = p.StartDate,
                endDate = p.EndDate
            })
            .ToListAsync();

        return Ok(projects);
    }

    // Create a new project
    [Authorize(Roles = "NPO")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProjectRequest req)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        // Only verified NPOs can create fundraisers (they solicit money).
        var gate = await _gate.CanTransactAsync(userId);
        if (!gate.Allowed) return StatusCode(403, gate.Reason);

        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.UserId == userId);
        if (npo == null) return BadRequest("No NPO profile linked to this account.");

        if (string.IsNullOrWhiteSpace(req.ProjectName))
            return BadRequest("ProjectName is required.");

        var validStatuses = new[] { "Planning", "Active", "Completed", "Suspended" };
        var status = string.IsNullOrWhiteSpace(req.ProjectStatus) ? "Planning" : req.ProjectStatus;
        if (!validStatuses.Contains(status))
            return BadRequest("ProjectStatus must be one of: Planning, Active, Completed, Suspended");

        // Resolve fundraiser timing.
        var startDate = req.StartDate ?? DateTime.UtcNow;
        DateTime? endDate = req.EndDate;
        if (endDate == null && req.DurationDays.HasValue)
        {
            if (req.DurationDays.Value <= 0)
                return BadRequest("DurationDays must be greater than zero.");
            endDate = startDate.AddDays(req.DurationDays.Value);
        }
        if (endDate.HasValue && endDate.Value <= startDate)
            return BadRequest("EndDate must be after the start date.");

        var project = new Project
        {
            NpoId = npo.NpoId,
            ProjectName = req.ProjectName,
            ProjectDesc = req.ProjectDesc,
            ProjectStatus = status,
            ProjectProgress = req.ProjectProgress ?? 0,
            TargetAmount = req.TargetAmount ?? 0,
            RaisedAmount = 0,
            Images = req.Images,
            StartDate = startDate,
            EndDate = endDate
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = project.ProjectId }, new
        {
            projectId = project.ProjectId,
            npoId = project.NpoId,
            projectName = project.ProjectName,
            projectDesc = project.ProjectDesc,
            projectStatus = project.ProjectStatus,
            projectProgress = project.ProjectProgress,
            targetAmount = project.TargetAmount,
            raisedAmount = project.RaisedAmount,
            images = project.Images,
            startDate = project.StartDate,
            endDate = project.EndDate
        });
    }

    // Update a project (ownership-checked)
    [Authorize(Roles = "NPO")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProjectRequest req)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.UserId == userId);
        if (npo == null) return BadRequest("No NPO profile linked to this account.");

        var project = await _context.Projects.FindAsync(id);
        if (project == null) return NotFound();
        if (project.NpoId != npo.NpoId) return Forbid();

        if (req.ProjectName != null) project.ProjectName = req.ProjectName;
        if (req.ProjectDesc != null) project.ProjectDesc = req.ProjectDesc;
        if (req.ProjectStatus != null)
        {
            var validStatuses = new[] { "Planning", "Active", "Completed", "Suspended" };
            if (!validStatuses.Contains(req.ProjectStatus))
                return BadRequest("ProjectStatus must be one of: Planning, Active, Completed, Suspended");
            project.ProjectStatus = req.ProjectStatus;
        }
        if (req.ProjectProgress.HasValue)
        {
            if (req.ProjectProgress < 0 || req.ProjectProgress > 100)
                return BadRequest("ProjectProgress must be between 0 and 100.");
            project.ProjectProgress = req.ProjectProgress.Value;
        }
        if (req.TargetAmount.HasValue) project.TargetAmount = req.TargetAmount.Value;
        if (req.Images != null) project.Images = req.Images;

        if (req.StartDate.HasValue) project.StartDate = req.StartDate.Value;
        if (req.EndDate.HasValue)
        {
            project.EndDate = req.EndDate.Value;
        }
        else if (req.DurationDays.HasValue)
        {
            if (req.DurationDays.Value <= 0)
                return BadRequest("DurationDays must be greater than zero.");
            var basis = project.StartDate ?? DateTime.UtcNow;
            project.EndDate = basis.AddDays(req.DurationDays.Value);
        }
        if (project.EndDate.HasValue && project.StartDate.HasValue && project.EndDate.Value <= project.StartDate.Value)
            return BadRequest("EndDate must be after the start date.");

        await _context.SaveChangesAsync();
        return Ok(new
        {
            projectId = project.ProjectId,
            npoId = project.NpoId,
            projectName = project.ProjectName,
            projectDesc = project.ProjectDesc,
            projectStatus = project.ProjectStatus,
            projectProgress = project.ProjectProgress,
            targetAmount = project.TargetAmount,
            raisedAmount = project.RaisedAmount,
            images = project.Images,
            startDate = project.StartDate,
            endDate = project.EndDate
        });
    }

    // Delete a project (ownership-checked)
    [Authorize(Roles = "NPO")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.UserId == userId);
        if (npo == null) return BadRequest("No NPO profile linked to this account.");

        var project = await _context.Projects.FindAsync(id);
        if (project == null) return NotFound();
        if (project.NpoId != npo.NpoId) return Forbid();

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

public class CreateProjectRequest
{
    public string ProjectName { get; set; } = null!;
    public string? ProjectDesc { get; set; }
    public string? ProjectStatus { get; set; }
    public decimal? ProjectProgress { get; set; }
    public decimal? TargetAmount { get; set; }
    public string? Images { get; set; }

    // Timing (Task 18). Provide either an explicit EndDate or a DurationDays
    // (relative to StartDate, or "now" when StartDate is omitted). EndDate wins if both given.
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? DurationDays { get; set; }
}

public class UpdateProjectRequest
{
    public string? ProjectName { get; set; }
    public string? ProjectDesc { get; set; }
    public string? ProjectStatus { get; set; }
    public decimal? ProjectProgress { get; set; }
    public decimal? TargetAmount { get; set; }
    public string? Images { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? DurationDays { get; set; }
}
