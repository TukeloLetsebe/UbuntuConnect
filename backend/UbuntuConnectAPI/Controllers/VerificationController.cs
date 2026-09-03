using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.Models;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/verification")]
public class VerificationController : ControllerBase
{
    private readonly AppDbContext _context;

    public VerificationController(AppDbContext context)
    {
        _context = context;
    }

    // NPO submits a verification request with document URLs
    [Authorize(Roles = "NPO")]
    [HttpPost("submit")]
    public async Task<IActionResult> Submit([FromBody] SubmitVerificationRequest req)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.UserId == userId);
        if (npo == null) return BadRequest("No NPO profile linked to this account.");

        // Check if there's already a pending verification
        var existingPending = await _context.Verifications
            .AnyAsync(v => v.NpoId == npo.NpoId && v.Status == "Pending");

        if (existingPending)
            return BadRequest("You already have a pending verification request. Please wait for admin review.");

        if (string.IsNullOrWhiteSpace(req.NpoCertificate) && string.IsNullOrWhiteSpace(req.NpoTaxCertificate))
            return BadRequest("At least one document (NPO Certificate or Tax Certificate) must be provided.");

        var verification = new Verification
        {
            NpoId = npo.NpoId,
            Npocertificate = req.NpoCertificate,
            NpotaxCertificate = req.NpoTaxCertificate,
            Status = "Pending",
            SubmittedDate = DateTime.UtcNow,
            ReviewedByUserId = null,
            ReviewedDate = null
        };

        _context.Verifications.Add(verification);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMyVerification), null, new
        {
            verificationId = verification.VerificationId,
            npoId = verification.NpoId,
            npoCertificate = verification.Npocertificate,
            npoTaxCertificate = verification.NpotaxCertificate,
            status = verification.Status,
            submittedDate = verification.SubmittedDate,
            reviewedDate = verification.ReviewedDate
        });
    }

    // NPO views their own verification status
    [Authorize(Roles = "NPO")]
    [HttpGet("my-status")]
    public async Task<IActionResult> GetMyVerification()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.UserId == userId);
        if (npo == null) return BadRequest("No NPO profile linked to this account.");

        var verifications = await _context.Verifications
            .Where(v => v.NpoId == npo.NpoId)
            .OrderByDescending(v => v.SubmittedDate)
            .Select(v => new
            {
                verificationId = v.VerificationId,
                npoId = v.NpoId,
                npoCertificate = v.Npocertificate,
                npoTaxCertificate = v.NpotaxCertificate,
                status = v.Status,
                submittedDate = v.SubmittedDate,
                reviewedDate = v.ReviewedDate
            })
            .ToListAsync();

        return Ok(verifications);
    }
}

public class SubmitVerificationRequest
{
    public string? NpoCertificate { get; set; }
    public string? NpoTaxCertificate { get; set; }
}
