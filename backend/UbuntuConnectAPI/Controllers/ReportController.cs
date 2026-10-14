using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Globalization;
using UbuntuConnectAPI.Data;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportController : BaseApiController
{
    private readonly AppDbContext _context;

    public ReportController(AppDbContext context)
    {
        _context = context;
    }

    // Donation summary and tracking. Admins or the user themselves can query.
    [HttpGet("donations")]
    public async Task<IActionResult> DonationReport([FromQuery] DateTime? start, [FromQuery] DateTime? end, [FromQuery] int? npoId)
    {
        var callerIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var callerId = callerIdClaim != null ? int.Parse(callerIdClaim) : (int?)null;

        // When npoId is omitted, this becomes a platform-wide report — Admin only
        if (!npoId.HasValue)
        {
            if (!User.IsInRole("Admin"))
                return Forbid();
        }
        else
        {
            // If npoId specified, ensure caller is admin or the owner of that NPO
            var npoCheck = await _context.Npos.FindAsync(npoId.Value);
            if (npoCheck == null) return NotFound("NPO not found.");

            var isAdmin = User.IsInRole("Admin");
            if (!isAdmin && npoCheck.UserId != callerId) return Forbid();
        }

        var q = _context.Transactions.Where(t => t.TransactionType == "Donation");
        if (start.HasValue) q = q.Where(t => t.Timestamp >= start.Value);
        if (end.HasValue) q = q.Where(t => t.Timestamp <= end.Value);
        if (npoId.HasValue)
        {
            var npo = await _context.Npos.FindAsync(npoId.Value);
            // receiverUserId for donations to NPO is npo.UserId
            if (npo != null) q = q.Where(t => t.ReceiverUserId == npo.UserId);
        }

        var total = await q.Where(t => t.Status == "Completed").SumAsync(t => (decimal?)t.Amount) ?? 0m;
        var count = await q.Where(t => t.Status == "Completed").CountAsync();

        var list = await q.OrderByDescending(t => t.Timestamp)
            .Select(t => new
            {
                transactionId = t.TransactionId,
                senderUserId = t.SenderUserId,
                receiverUserId = t.ReceiverUserId,
                amount = t.Amount,
                status = t.Status,
                timestamp = t.Timestamp
            })
            .ToListAsync();

        return Ok(new { totalDonated = total, count = count, transactions = list });
    }

    // CSV export for donation report
    [HttpGet("donations/csv")]
    public async Task<IActionResult> DonationReportCsv([FromQuery] DateTime? start, [FromQuery] DateTime? end, [FromQuery] int? npoId)
    {
        var callerIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var callerId = callerIdClaim != null ? int.Parse(callerIdClaim) : (int?)null;

        // When npoId is omitted, this becomes a platform-wide report — Admin only
        if (!npoId.HasValue)
        {
            if (!User.IsInRole("Admin"))
                return Forbid();
        }
        else
        {
            var npoCheck = await _context.Npos.FindAsync(npoId.Value);
            if (npoCheck == null) return NotFound("NPO not found.");

            var isAdmin = User.IsInRole("Admin");
            if (!isAdmin && npoCheck.UserId != callerId) return Forbid();
        }

        var q = _context.Transactions.Where(t => t.TransactionType == "Donation");
        if (start.HasValue) q = q.Where(t => t.Timestamp >= start.Value);
        if (end.HasValue) q = q.Where(t => t.Timestamp <= end.Value);
        if (npoId.HasValue)
        {
            var npo = await _context.Npos.FindAsync(npoId.Value);
            if (npo != null) q = q.Where(t => t.ReceiverUserId == npo.UserId);
        }

        var rows = await q.OrderByDescending(t => t.Timestamp)
            .Select(t => new
            {
                transactionId = t.TransactionId,
                senderUserId = t.SenderUserId,
                receiverUserId = t.ReceiverUserId,
                amount = t.Amount,
                status = t.Status,
                timestamp = t.Timestamp
            })
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("transactionId,senderUserId,receiverUserId,amount,status,timestamp");
        foreach (var r in rows)
        {
            // CSV-escape: simple approach since fields here are numeric/enum/date
            var line = string.Format(CultureInfo.InvariantCulture, "{0},{1},{2},{3:0.00},{4},{5:O}",
                r.transactionId, r.senderUserId, r.receiverUserId, r.amount, r.status, r.timestamp);
            sb.AppendLine(line);
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        var filename = $"donations_{DateTime.UtcNow:yyyyMMddHHmmss}.csv";
        return File(bytes, "text/csv", filename);
    }

    // ── MY DONATIONS CSV (any authenticated user exports their own) ──
    [HttpGet("my-donations/csv")]
    public async Task<IActionResult> MyDonationsCsv([FromQuery] DateTime? start, [FromQuery] DateTime? end)
    {
        var callerId = CallerId;

        var q = _context.Transactions
            .Where(t => t.SenderUserId == callerId && t.TransactionType == "Donation");
        if (start.HasValue) q = q.Where(t => t.Timestamp >= start.Value);
        if (end.HasValue) q = q.Where(t => t.Timestamp <= end.Value);

        var rows = await q.OrderByDescending(t => t.Timestamp)
            .Select(t => new
            {
                transactionId = t.TransactionId,
                receiverUserId = t.ReceiverUserId,
                amount = t.Amount,
                status = t.Status,
                timestamp = t.Timestamp
            })
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("transactionId,receiverUserId,amount,status,timestamp");
        foreach (var r in rows)
        {
            var line = string.Format(CultureInfo.InvariantCulture, "{0},{1},{2:0.00},{3},{4:O}",
                r.transactionId, r.receiverUserId, r.amount, r.status, r.timestamp);
            sb.AppendLine(line);
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        var filename = $"my_donations_{DateTime.UtcNow:yyyyMMddHHmmss}.csv";
        return File(bytes, "text/csv", filename);
    }

    // Builds a list of the last `months` month buckets (oldest first) as labels
    // like "2026-04", each initialised to 0. Reused by the summary endpoints.
    private static List<(string Label, int Year, int Month)> LastMonths(int months)
    {
        var list = new List<(string, int, int)>();
        var now = DateTime.UtcNow;
        for (var i = months - 1; i >= 0; i--)
        {
            var d = now.AddMonths(-i);
            list.Add(($"{d:yyyy-MM}", d.Year, d.Month));
        }
        return list;
    }

    // ── NPO REPORT SUMMARY ─────────────────────────────────────
    // Donations received over time, fundraiser performance, volunteer + supporter stats.
    [Authorize(Roles = "NPO")]
    [HttpGet("npo-summary")]
    public async Task<IActionResult> NpoSummary()
    {
        var userId = CallerId;
        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.UserId == userId);
        if (npo == null) return BadRequest("No NPO profile linked to this account.");

        var incoming = await _context.Transactions
            .Where(t => t.ReceiverUserId == userId
                && (t.TransactionType == "Donation" || t.TransactionType == "CampaignContribution")
                && t.Status == "Completed")
            .Select(t => new { t.Amount, t.Timestamp })
            .ToListAsync();

        var months = LastMonths(6);
        var monthly = months.Select(m => new
        {
            month = m.Label,
            total = incoming.Where(x => x.Timestamp.Year == m.Year && x.Timestamp.Month == m.Month).Sum(x => x.Amount)
        }).ToList();

        var projects = await _context.Projects
            .Where(p => p.NpoId == npo.NpoId)
            .Select(p => new { p.ProjectName, p.TargetAmount, p.RaisedAmount, p.ProjectStatus })
            .ToListAsync();

        var opportunityIds = await _context.VolunteerOpportunities
            .Where(o => o.NpoId == npo.NpoId).Select(o => o.OpportunityId).ToListAsync();
        var apps = await _context.VolunteerApplications
            .Where(a => opportunityIds.Contains(a.OpportunityId))
            .GroupBy(a => a.Status)
            .Select(g => new { status = g.Key, count = g.Count() })
            .ToListAsync();

        var followerCount = await _context.Follows.CountAsync(f => f.NpoId == npo.NpoId);

        return Ok(new
        {
            totalReceived = incoming.Sum(x => x.Amount),
            donationCount = incoming.Count,
            followerCount,
            monthlyReceived = monthly,
            fundraisers = projects.Select(p => new
            {
                name = p.ProjectName,
                target = p.TargetAmount,
                raised = p.RaisedAmount,
                status = p.ProjectStatus
            }),
            volunteerApplications = apps
        });
    }

    // ── BUSINESS REPORT SUMMARY ────────────────────────────────
    [Authorize(Roles = "Business")]
    [HttpGet("business-summary")]
    public async Task<IActionResult> BusinessSummary()
    {
        var userId = CallerId;
        var business = await _context.Businesses.FirstOrDefaultAsync(b => b.UserId == userId);
        if (business == null) return BadRequest("No Business profile linked to this account.");

        var outgoing = await _context.Transactions
            .Where(t => t.SenderUserId == userId
                && (t.TransactionType == "Donation" || t.TransactionType == "CampaignContribution")
                && t.Status == "Completed")
            .Select(t => new { t.Amount, t.Timestamp })
            .ToListAsync();

        var months = LastMonths(6);
        var monthly = months.Select(m => new
        {
            month = m.Label,
            total = outgoing.Where(x => x.Timestamp.Year == m.Year && x.Timestamp.Month == m.Month).Sum(x => x.Amount)
        }).ToList();

        var campaignIds = await _context.PartnershipCampaigns
            .Where(c => c.BusinessId == business.BusinessId).Select(c => c.CampaignId).ToListAsync();
        var appsByStatus = await _context.CampaignApplications
            .Where(a => campaignIds.Contains(a.CampaignId))
            .GroupBy(a => a.Status)
            .Select(g => new { status = g.Key, count = g.Count() })
            .ToListAsync();

        var nposSupported = outgoing.Count == 0 ? 0 : await _context.Transactions
            .Where(t => t.SenderUserId == userId
                && (t.TransactionType == "Donation" || t.TransactionType == "CampaignContribution")
                && t.Status == "Completed")
            .Select(t => t.ReceiverUserId).Distinct().CountAsync();

        return Ok(new
        {
            totalDonated = outgoing.Sum(x => x.Amount),
            donationCount = outgoing.Count,
            campaignCount = campaignIds.Count,
            nposSupported,
            monthlyDonated = monthly,
            campaignApplications = appsByStatus
        });
    }

    // ── ADMIN PLATFORM SUMMARY ─────────────────────────────────
    [Authorize(Roles = "Admin")]
    [HttpGet("admin-summary")]
    public async Task<IActionResult> AdminSummary()
    {
        var usersByType = await _context.Users
            .GroupBy(u => u.UserType)
            .Select(g => new { type = g.Key, count = g.Count() })
            .ToListAsync();

        var completedDonations = await _context.Transactions
            .Where(t => (t.TransactionType == "Donation" || t.TransactionType == "CampaignContribution") && t.Status == "Completed")
            .Select(t => new { t.Amount, t.Timestamp })
            .ToListAsync();

        var months = LastMonths(6);
        var monthly = months.Select(m => new
        {
            month = m.Label,
            total = completedDonations.Where(x => x.Timestamp.Year == m.Year && x.Timestamp.Month == m.Month).Sum(x => x.Amount)
        }).ToList();

        var activeFundraisers = await _context.Projects.CountAsync(p => p.ProjectStatus == "Active");
        var pendingVerifications = await _context.Verifications.CountAsync(v => v.Status == "Pending");
        var totalUsers = await _context.Users.CountAsync();
        var verifiedUsers = await _context.Users.CountAsync(u => u.IsVerified);

        return Ok(new
        {
            totalUsers,
            verifiedUsers,
            activeFundraisers,
            pendingVerifications,
            totalDonated = completedDonations.Sum(x => x.Amount),
            donationCount = completedDonations.Count,
            usersByType,
            monthlyDonations = monthly
        });
    }
}
