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
        var list = await _context.Npos.ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetNpoById(int id)
    {
        var npo = await _context.Npos.FindAsync(id);
        if (npo == null) return NotFound();
        return Ok(npo);
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUserId(int userId)
    {
        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.UserId == userId);
        if (npo == null) return NotFound();
        return Ok(npo);
    }

    // NOTE: "Create" endpoint removed — NPO creation happens during
    // AuthController.Register, which already creates the Users + NPO + Wallet
    // rows together. A separate Create endpoint here would produce orphaned
    // NPO rows with no linked User/Wallet.

    [Authorize(Roles = "NPO")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateNPORequest req)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var npo = await _context.Npos.FindAsync(id);
        if (npo == null) return NotFound();

        // Ownership check — only the NPO's own account can edit its profile
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