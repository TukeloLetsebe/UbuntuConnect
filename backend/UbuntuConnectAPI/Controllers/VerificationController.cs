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

    // Business submits a verification request with its CIPC registration
    // document and tax clearance certificate (stored in the same two columns).
    [Authorize(Roles = "Business")]
    [HttpPost("business/submit")]
    public async Task<IActionResult> SubmitBusiness([FromBody] SubmitBusinessVerificationRequest req)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var business = await _context.Businesses.FirstOrDefaultAsync(b => b.UserId == userId);
        if (business == null) return BadRequest("No business profile is linked to this account.");

        var existingPending = await _context.Verifications
            .AnyAsync(v => v.BusinessId == business.BusinessId && v.Status == "Pending");
        if (existingPending)
            return BadRequest("You already have a pending verification request. Please wait for admin review.");

        if (string.IsNullOrWhiteSpace(req.CipcDocument) && string.IsNullOrWhiteSpace(req.TaxClearance))
            return BadRequest("Please upload at least one document — your CIPC registration document or tax clearance certificate.");

        var verification = new Verification
        {
            BusinessId = business.BusinessId,
            Npocertificate = req.CipcDocument,       // reused column: CIPC document
            NpotaxCertificate = req.TaxClearance,    // reused column: tax clearance
            Status = "Pending",
            SubmittedDate = DateTime.UtcNow,
            ReviewedByUserId = null,
            ReviewedDate = null
        };

        _context.Verifications.Add(verification);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            verificationId = verification.VerificationId,
            businessId = verification.BusinessId,
            cipcDocument = verification.Npocertificate,
            taxClearance = verification.NpotaxCertificate,
            status = verification.Status,
            submittedDate = verification.SubmittedDate,
            reviewedDate = verification.ReviewedDate
        });
    }

    // Business views its own verification history/status.
    [Authorize(Roles = "Business")]
    [HttpGet("business/my-status")]
    public async Task<IActionResult> GetMyBusinessVerification()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var business = await _context.Businesses.FirstOrDefaultAsync(b => b.UserId == userId);
        if (business == null) return BadRequest("No business profile is linked to this account.");

        var verifications = await _context.Verifications
            .Where(v => v.BusinessId == business.BusinessId)
            .OrderByDescending(v => v.SubmittedDate)
            .Select(v => new
            {
                verificationId = v.VerificationId,
                businessId = v.BusinessId,
                cipcDocument = v.Npocertificate,
                taxClearance = v.NpotaxCertificate,
                status = v.Status,
                submittedDate = v.SubmittedDate,
                reviewedDate = v.ReviewedDate
            })
            .ToListAsync();

        return Ok(verifications);
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

    // Businesses (and admins) can view an NPO's submitted verification documents
    // to vet a potential partner. Returns the NPO's latest verification record.
    [Authorize(Roles = "Business,Admin")]
    [HttpGet("npo/{npoId}")]
    public async Task<IActionResult> GetNpoDocuments(int npoId)
    {
        var npoExists = await _context.Npos.AnyAsync(n => n.NpoId == npoId);
        if (!npoExists) return NotFound("NPO not found.");

        var latest = await _context.Verifications
            .Where(v => v.NpoId == npoId)
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
            .FirstOrDefaultAsync();

        if (latest == null)
            return Ok(new { npoId, hasDocuments = false, status = (string?)null, npoCertificate = (string?)null, npoTaxCertificate = (string?)null });

        return Ok(new
        {
            latest.npoId,
            hasDocuments = latest.npoCertificate != null || latest.npoTaxCertificate != null,
            latest.status,
            latest.npoCertificate,
            latest.npoTaxCertificate,
            latest.submittedDate,
            latest.reviewedDate
        });
    }
}

public class SubmitVerificationRequest
{
    public string? NpoCertificate { get; set; }
    public string? NpoTaxCertificate { get; set; }
}

public class SubmitBusinessVerificationRequest
{
    /// <summary>CIPC company registration document URL.</summary>
    public string? CipcDocument { get; set; }
    /// <summary>Tax clearance certificate URL.</summary>
    public string? TaxClearance { get; set; }
}
