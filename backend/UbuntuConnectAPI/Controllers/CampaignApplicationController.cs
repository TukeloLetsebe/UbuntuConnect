using Microsoft.AspNetCore.Authorization;
//using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Models;
using UbuntuConnectAPI.Services.Verification;
using UbuntuConnectAPI.Services.Notifications;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/campaignapplications")]
public class CampaignApplicationController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IVerificationGate _gate;
    // Optional so direct-construction tests keep working; best-effort only.
    private readonly INotificationService? _notifications;

    public CampaignApplicationController(AppDbContext context, IVerificationGate gate, INotificationService? notifications = null)
    {
        _context = context;
        _gate = gate;
        _notifications = notifications;
    }

    // Best-effort notification helper — never throws into the request flow.
    private async Task NotifyAsync(int userId, string type, string message, int? relatedEntityId = null)
    {
        if (_notifications == null) return;
        try { await _notifications.CreateAsync(userId, type, message, relatedEntityId); }
        catch { /* notifications are non-critical */ }
    }

    // NPO applies to a campaign
    [Authorize(Roles = "NPO")]
    [HttpPost("apply/{campaignId}")]
    public async Task<IActionResult> Apply(int campaignId, [FromBody] CampaignApplicationDto dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        // Only verified NPOs can apply to business partnership campaigns.
        var gate = await _gate.CanTransactAsync(userId);
        if (!gate.Allowed) return StatusCode(403, gate.Reason);

        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.UserId == userId);
        if (npo == null) return BadRequest("No NPO profile linked to this account.");

        var campaign = await _context.PartnershipCampaigns
            .Include(c => c.Business)
            .FirstOrDefaultAsync(c => c.CampaignId == campaignId);
        if (campaign == null) return NotFound("Campaign not found.");

        // A partnership application must include a reason/motivation.
        if (string.IsNullOrWhiteSpace(dto.Motivation))
            return BadRequest("Please provide a reason for applying to this partnership.");

        var already = await _context.CampaignApplications
            .AnyAsync(a => a.CampaignId == campaignId && a.NpoId == npo.NpoId);
        if (already) return BadRequest("You have already applied to this campaign.");

        var app = new CampaignApplication
        {
            CampaignId = campaignId,
            NpoId = npo.NpoId,
            Motivation = dto.Motivation,
            ApplicationDate = DateTime.UtcNow,
            Status = "Pending"
        };

        _context.CampaignApplications.Add(app);
        await _context.SaveChangesAsync();

        // Tell the Business a new NPO applied to their campaign.
        if (campaign.Business != null)
            await NotifyAsync(campaign.Business.UserId, "CampaignApplicationReceived",
                $"{npo.OrganizationName} applied to your campaign \"{campaign.Title}\".", app.ApplicationId);

        return Ok(new { message = "Application submitted.", applicationId = app.ApplicationId });
    }

    // Business views applications for their campaign
    [Authorize(Roles = "Business")]
    [HttpGet("campaign/{campaignId}")]
    public async Task<IActionResult> GetByCampaign(int campaignId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var campaign = await _context.PartnershipCampaigns
            .Include(c => c.Business)
            .FirstOrDefaultAsync(c => c.CampaignId == campaignId);
        if (campaign == null) return NotFound();

        if (campaign.Business.UserId != userId) return Forbid();

        var list = await _context.CampaignApplications
            .Where(a => a.CampaignId == campaignId)
            .Select(a => new
            {
                applicationId = a.ApplicationId,
                npoId = a.NpoId,
                motivation = a.Motivation,
                status = a.Status,
                applicationDate = a.ApplicationDate
            })
            .ToListAsync();

        return Ok(list);
    }

    [Authorize(Roles = "Business")]
    // Approving a campaign application pays the campaign's BudgetPerPartner
    // from the Business wallet into the accepted NPO's wallet, recorded as a
    // 'CampaignContribution' transaction. This makes campaign funding show up
    // in the NPO's wallet balance and be withdrawable — same as donations.
    [HttpPut("{id}/approve")]
    public async Task<IActionResult> Approve(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var app = await _context.CampaignApplications
            .Include(a => a.Campaign)
                .ThenInclude(c => c.Business)
            .Include(a => a.Npo)
            .FirstOrDefaultAsync(a => a.ApplicationId == id);
        if (app == null) return NotFound();

        if (app.Campaign.Business.UserId != userId) return Forbid();

        if (app.Status == "Accepted")
            return BadRequest("This application has already been accepted.");

        var budget = app.Campaign.BudgetPerPartner ?? 0m;

        // No budget set → just accept, no money moves.
        if (budget <= 0)
        {
            app.Status = "Accepted";
            await _context.SaveChangesAsync();
            await NotifyAsync(app.Npo.UserId, "CampaignApplicationAccepted",
                $"Your application to \"{app.Campaign.Title}\" was accepted.", app.ApplicationId);
            return Ok(new { message = "Application accepted. No budget was set for this campaign, so no funds were transferred.", amountPaid = 0m });
        }

        var businessUserId = app.Campaign.Business.UserId;
        var npoUserId = app.Npo.UserId;

        var businessWallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == businessUserId);
        var npoWallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == npoUserId);
        if (businessWallet == null) return BadRequest("Your wallet is not set up.");
        if (npoWallet == null) return BadRequest("The NPO's wallet is not set up.");

        if (businessWallet.Balance < budget)
        {
            // Log the failed contribution attempt, still accept the application.
            _context.Transactions.Add(new Transaction
            {
                SenderUserId = businessUserId,
                ReceiverUserId = npoUserId,
                Amount = budget,
                TransactionType = "CampaignContribution",
                Status = "Failed",
                Timestamp = DateTime.UtcNow
            });
            app.Status = "Accepted";
            await _context.SaveChangesAsync();
            await NotifyAsync(app.Npo.UserId, "CampaignApplicationAccepted",
                $"Your application to \"{app.Campaign.Title}\" was accepted. The partner's contribution is pending.", app.ApplicationId);
            return BadRequest($"Application accepted, but your wallet balance (R {businessWallet.Balance}) is insufficient to fund the campaign budget (R {budget}). Please top up and the payment can be retried.");
        }

        using var dbTx = await _context.Database.BeginTransactionAsync();
        try
        {
            businessWallet.Balance -= budget;
            npoWallet.Balance += budget;

            var tx = new Transaction
            {
                SenderUserId = businessUserId,
                ReceiverUserId = npoUserId,
                Amount = budget,
                TransactionType = "CampaignContribution",
                Status = "Completed",
                Timestamp = DateTime.UtcNow
            };
            _context.Transactions.Add(tx);

            app.Status = "Accepted";

            await _context.SaveChangesAsync();
            await dbTx.CommitAsync();

            await NotifyAsync(app.Npo.UserId, "CampaignApplicationAccepted",
                $"Your application to \"{app.Campaign.Title}\" was accepted and R {budget:0.##} was paid into your wallet.", app.ApplicationId);

            return Ok(new
            {
                message = "Application accepted and campaign budget transferred to the NPO.",
                transactionId = tx.TransactionId,
                amountPaid = budget,
                newBalance = businessWallet.Balance
            });
        }
        catch
        {
            await dbTx.RollbackAsync();
            return StatusCode(500, "Approval succeeded but the fund transfer failed. No funds were moved.");
        }
    }

    [Authorize(Roles = "Business")]
    [HttpPut("{id}/reject")]
    public async Task<IActionResult> Reject(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var app = await _context.CampaignApplications
            .Include(a => a.Campaign)
                .ThenInclude(c => c.Business)
            .Include(a => a.Npo)
            .FirstOrDefaultAsync(a => a.ApplicationId == id);
        if (app == null) return NotFound();

        if (app.Campaign.Business.UserId != userId) return Forbid();

        app.Status = "Rejected";
        await _context.SaveChangesAsync();

        await NotifyAsync(app.Npo.UserId, "CampaignApplicationRejected",
            $"Your application to \"{app.Campaign.Title}\" was not accepted this time.", app.ApplicationId);

        return NoContent();
    }
}
