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
public class ReportController : ControllerBase
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
        var callerIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var callerId = int.Parse(callerIdClaim!);

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
}
