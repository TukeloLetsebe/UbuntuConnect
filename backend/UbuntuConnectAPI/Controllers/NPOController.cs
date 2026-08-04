using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/npo")]
public class NPOController : ControllerBase
{
    private readonly AppDbContext _context;

    public NPOController(AppDbContext context)
    {
        _context = context;
    }

    // Public — anyone can browse NPOs (same as IndividualController.DiscoverNpos)
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _context.Npos
            .Select(n => new
            {
                npoId = n.NpoId,
                userId = n.UserId,
                nporegNum = n.NporegNum,
                organizationName = n.OrganizationName,
                npofocusArea = n.NpofocusArea,
                npomission = n.Npomission
            })
            .ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetNpoById(int id)
    {
        var npo = await _context.Npos
            .Where(n => n.NpoId == id)
            .Select(n => new
            {
                npoId = n.NpoId,
                userId = n.UserId,
                nporegNum = n.NporegNum,
                organizationName = n.OrganizationName,
                npofocusArea = n.NpofocusArea,
                npomission = n.Npomission
            })
            .FirstOrDefaultAsync();

        if (npo == null) return NotFound();
        return Ok(npo);
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUserId(int userId)
    {
        var npo = await _context.Npos
            .Where(n => n.UserId == userId)
            .Select(n => new
            {
                npoId = n.NpoId,
                userId = n.UserId,
                nporegNum = n.NporegNum,
                organizationName = n.OrganizationName,
                npofocusArea = n.NpofocusArea,
                npomission = n.Npomission
            })
            .FirstOrDefaultAsync();

        if (npo == null) return NotFound();
        return Ok(npo);
    }

    // Update own NPO profile — ownership-checked via JWT
    [Authorize(Roles = "NPO")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateNPORequest req)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.NpoId == id);
        if (npo == null) return NotFound();

        // Ownership check — only the NPO's own user can update their profile
        if (npo.UserId != userId) return Forbid();

        if (req.OrganizationName != null) npo.OrganizationName = req.OrganizationName;
        if (req.NPOFocusArea != null) npo.NpofocusArea = req.NPOFocusArea;
        if (req.NPOMission != null) npo.Npomission = req.NPOMission;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // NOTE: Delete endpoint removed. Deleting an NPO would cascade-delete
    // volunteer opportunities, applications, follows, etc. Same reasoning as
    // your soft-delete approach for Users — this should go through the
    // deactivate-account pattern instead, not a hard delete. Add later if needed.
}