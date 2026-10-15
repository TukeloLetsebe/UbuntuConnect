using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Models;
using UbuntuConnectAPI.Services.Payments;
using UbuntuConnectAPI.Services.Verification;
using Microsoft.Extensions.Options;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/transaction")]
public class TransactionController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly WalletLimitsOptions _limits;
    private readonly IVerificationGate _gate;

    public TransactionController(AppDbContext context, IVerificationGate gate, IOptions<WalletLimitsOptions>? limits = null)
    {
        _context = context;
        _gate = gate;
        _limits = limits?.Value ?? new WalletLimitsOptions();
    }

    // Exposes the effective wallet limits so the frontend can show/enforce them.
    [Authorize]
    [HttpGet("wallet-limits")]
    public IActionResult GetWalletLimits() => Ok(new
    {
        minTopUp = _limits.MinTopUp,
        maxTopUp = _limits.MaxTopUp,
        minWithdrawal = _limits.MinWithdrawal,
        maxWithdrawal = _limits.MaxWithdrawal,
        maxWithdrawalPerDay = _limits.MaxWithdrawalPerDay
    });

    [Authorize]
    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetByUser(int userId)
    {
        var callerId = CallerId;

        if (callerId != userId) return Forbid();

        var txs = await _context.Transactions
            .Where(t => t.SenderUserId == userId || t.ReceiverUserId == userId)
            .OrderByDescending(t => t.Timestamp)
            .Select(t => new
            {
                transactionId = t.TransactionId,
                senderUserId = t.SenderUserId,
                receiverUserId = t.ReceiverUserId,
                amount = t.Amount,
                transactionType = t.TransactionType,
                status = t.Status,
                timestamp = t.Timestamp,
                reason = t.Reason
            })
            .ToListAsync();

        return Ok(txs);
    }

    [Authorize]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var callerId = CallerId;

        var tx = await _context.Transactions.FindAsync(id);
        if (tx == null) return NotFound();

        if (tx.SenderUserId != callerId && tx.ReceiverUserId != callerId) return Forbid();

        return Ok(new
        {
            transactionId = tx.TransactionId,
            senderUserId = tx.SenderUserId,
            receiverUserId = tx.ReceiverUserId,
            amount = tx.Amount,
            transactionType = tx.TransactionType,
            status = tx.Status,
            timestamp = tx.Timestamp,
            reason = tx.Reason
        });
    }

    // Same atomic-transaction pattern as IndividualController.Donate,
    // and same real-world logging convention: failed attempts still get recorded.
    [Authorize]
    [HttpPost("withdraw")]
    public async Task<IActionResult> Withdraw([FromBody] WithdrawFundsRequest req)
    {
        var userId = CallerId;

        // Withdrawing money out requires a verified identity.
        var gate = await _gate.CanTransactAsync(userId);
        if (!gate.Allowed) return StatusCode(403, gate.Reason);

        if (req.Amount <= 0) return BadRequest("Amount must be greater than 0");

        // A reason is required so admins can audit what the funds were for.
        var reason = req.Reason?.Trim();
        if (string.IsNullOrWhiteSpace(reason))
            return BadRequest("Please provide a reason for this withdrawal.");
        if (reason.Length > 255) reason = reason[..255];

        // Per-transaction withdrawal limits.
        if (req.Amount < _limits.MinWithdrawal)
            return BadRequest($"Minimum withdrawal is R {_limits.MinWithdrawal:0.##}.");
        if (req.Amount > _limits.MaxWithdrawal)
            return BadRequest($"Maximum withdrawal is R {_limits.MaxWithdrawal:0.##}.");

        // Rolling 24-hour withdrawal cap (completed withdrawals only).
        var since = DateTime.UtcNow.AddDays(-1);
        var withdrawnLast24h = await _context.Transactions
            .Where(t => t.SenderUserId == userId
                && t.TransactionType == "Withdrawal"
                && t.Status == "Completed"
                && t.Timestamp >= since)
            .SumAsync(t => (decimal?)t.Amount) ?? 0m;
        if (withdrawnLast24h + req.Amount > _limits.MaxWithdrawalPerDay)
        {
            var remaining = _limits.MaxWithdrawalPerDay - withdrawnLast24h;
            if (remaining < 0) remaining = 0;
            return BadRequest($"Daily withdrawal limit reached. You can withdraw up to R {remaining:0.##} more in the next 24 hours.");
        }

        var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null) return NotFound("Wallet not found");

        if (wallet.Balance < req.Amount)
        {
            _context.Transactions.Add(new Transaction
            {
                SenderUserId = userId,
                ReceiverUserId = null,
                Amount = req.Amount,
                TransactionType = "Withdrawal",
                Status = "Failed",
                Timestamp = DateTime.UtcNow,
                Reason = reason
            });
            await _context.SaveChangesAsync();

            return BadRequest("Insufficient balance");
        }

        using var dbTransaction = await _context.Database.BeginTransactionAsync();
        try
        {
            wallet.Balance -= req.Amount;

            var tx = new Transaction
            {
                SenderUserId = userId,
                ReceiverUserId = null,
                Amount = req.Amount,
                TransactionType = "Withdrawal",
                Status = "Completed",
                Timestamp = DateTime.UtcNow,
                Reason = reason
            };

            _context.Transactions.Add(tx);
            await _context.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            return CreatedAtAction(nameof(GetById), new { id = tx.TransactionId }, new
            {
                transactionId = tx.TransactionId,
                senderUserId = tx.SenderUserId,
                receiverUserId = tx.ReceiverUserId,
                amount = tx.Amount,
                transactionType = tx.TransactionType,
                status = tx.Status,
                timestamp = tx.Timestamp,
                reason = tx.Reason
            });
        }
        catch
        {
            await dbTransaction.RollbackAsync();
            return StatusCode(500, "Withdrawal failed due to a server error. No funds were moved.");
        }
    }
}