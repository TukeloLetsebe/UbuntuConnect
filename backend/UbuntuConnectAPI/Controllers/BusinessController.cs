using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Models;
using UbuntuConnectAPI.Services.Payments;
using UbuntuConnectAPI.Services.Users;
using Microsoft.Extensions.Options;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/business")]
public class BusinessController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly IPaymentSimulationService? _payments;
    private readonly WalletLimitsOptions _limits;
    // Optional so direct-construction (tests) keeps working; falls back when null.
    private readonly IUserNameResolver? _names;

    public BusinessController(
        AppDbContext context,
        IPaymentSimulationService? payments = null,
        IOptions<WalletLimitsOptions>? limits = null,
        IUserNameResolver? names = null)
    {
        _context = context;
        _payments = payments;
        _limits = limits?.Value ?? new WalletLimitsOptions();
        _names = names;
    }

    // ── GET MY PROFILE ─────────────────────────────────────────
    [Authorize(Roles = "Business")]
    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = CallerId;

        var profile = await _context.Businesses
            .Include(b => b.User)
                .ThenInclude(u => u.Profile)
            .Where(b => b.UserId == userId)
            .Select(b => new
            {
                businessId = b.BusinessId,
                userId = b.UserId,
                businessRegNum = b.BusinessRegNum,
                industry = b.Industry,
                contactPersonName = b.ContactPersonName,
                contactPersonTitle = b.ContactPersonTitle,
                businessEmail = b.BusinessEmail,
                csrGoal = b.CsrGoal,
                email = b.User.UserEmail,
                contact = b.User.UserContact,
                location = b.User.Location,
                bio = b.User.Profile != null ? b.User.Profile.Bio : null,
                profileImage = b.User.Profile != null ? b.User.Profile.ProfileImage : null,
                backgroundImage = b.User.Profile != null ? b.User.Profile.BackgroundImage : null
            })
            .FirstOrDefaultAsync();

        if (profile == null) return NotFound("Business profile not found.");
        return Ok(profile);
    }

    // ── UPDATE MY PROFILE ──────────────────────────────────────
    // Ownership is implicit: a Business can only edit the profile linked to
    // its own JWT. Bio + images live on the linked Profile entity.
    [Authorize(Roles = "Business")]
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateBusinessRequest req)
    {
        var userId = CallerId;

        var business = await _context.Businesses.FirstOrDefaultAsync(b => b.UserId == userId);
        if (business == null) return NotFound("Business profile not found.");

        if (req.Industry != null) business.Industry = req.Industry;
        if (req.ContactPersonName != null) business.ContactPersonName = req.ContactPersonName;
        if (req.ContactPersonTitle != null) business.ContactPersonTitle = req.ContactPersonTitle;
        if (req.CsrGoal != null) business.CsrGoal = req.CsrGoal;

        if (req.Bio != null || req.ProfileImage != null || req.BackgroundImage != null)
        {
            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
            if (profile != null)
            {
                if (req.Bio != null) profile.Bio = req.Bio;
                if (req.ProfileImage != null) profile.ProfileImage = req.ProfileImage;
                if (req.BackgroundImage != null) profile.BackgroundImage = req.BackgroundImage;
            }
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // ── CHANGE PASSWORD ────────────────────────────────────────
    [Authorize(Roles = "Business")]
    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userId = CallerId;

        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
        if (user == null) return NotFound("User not found.");

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            return BadRequest("Current password is incorrect.");
        if (dto.NewPassword.Length < 8)
            return BadRequest("New password must be at least 8 characters long.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Password changed successfully." });
    }

    // ── DEACTIVATE MY ACCOUNT ──────────────────────────────────
    [Authorize(Roles = "Business")]
    [HttpPut("deactivate")]
    public async Task<IActionResult> DeactivateAccount([FromBody] DeactivateAccountDto dto)
    {
        var userId = CallerId;

        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
        if (user == null) return NotFound("User not found.");

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return BadRequest("Incorrect password. Account not deactivated.");

        user.IsActive = false;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Your account has been deactivated." });
    }

    // ── DISCOVER NPOs ──────────────────────────────────────────
    [HttpGet("discover-npos")]
    public async Task<IActionResult> DiscoverNpos()
    {
        var npos = await _context.Npos
            .Include(n => n.User)
                .ThenInclude(u => u.Profile)
            .Select(n => new
            {
                npoId = n.NpoId,
                organizationName = n.OrganizationName,
                focusArea = n.NpofocusArea,
                mission = n.Npomission,
                location = n.User.Location,
                isVerified = n.User.IsVerified,
                profileImage = n.User.Profile != null ? n.User.Profile.ProfileImage : null
            })
            .ToListAsync();

        return Ok(npos);
    }

    // ── FOLLOW NPO ─────────────────────────────────────────────
    [Authorize(Roles = "Business")]
    [HttpPost("follow/{npoId}")]
    public async Task<IActionResult> FollowNpo(int npoId)
    {
        var userId = CallerId;

        var npoExists = await _context.Npos.AnyAsync(n => n.NpoId == npoId);
        if (!npoExists) return NotFound("NPO not found.");

        var alreadyFollowing = await _context.Follows
            .AnyAsync(f => f.UserId == userId && f.NpoId == npoId);
        if (alreadyFollowing) return BadRequest("You already follow this NPO.");

        _context.Follows.Add(new Follow { UserId = userId, NpoId = npoId, FollowDate = DateTime.UtcNow });
        await _context.SaveChangesAsync();
        return Ok(new { message = "Now following this NPO." });
    }

    // ── UNFOLLOW NPO ───────────────────────────────────────────
    [Authorize(Roles = "Business")]
    [HttpDelete("unfollow/{npoId}")]
    public async Task<IActionResult> UnfollowNpo(int npoId)
    {
        var userId = CallerId;

        var follow = await _context.Follows.FirstOrDefaultAsync(f => f.UserId == userId && f.NpoId == npoId);
        if (follow == null) return BadRequest("You are not following this NPO.");

        _context.Follows.Remove(follow);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Unfollowed." });
    }

    // ── GET MY FOLLOWS ─────────────────────────────────────────
    [Authorize(Roles = "Business")]
    [HttpGet("my-follows")]
    public async Task<IActionResult> GetMyFollows()
    {
        var userId = CallerId;

        var follows = await _context.Follows
            .Where(f => f.UserId == userId)
            .Select(f => new
            {
                npoId = f.NpoId,
                organizationName = f.Npo.OrganizationName,
                focusArea = f.Npo.NpofocusArea,
                mission = f.Npo.Npomission,
                location = f.Npo.User.Location,
                isVerified = f.Npo.User.IsVerified,
                profileImage = f.Npo.User.Profile != null ? f.Npo.User.Profile.ProfileImage : null,
                followDate = f.FollowDate
            })
            .OrderByDescending(f => f.followDate)
            .ToListAsync();

        return Ok(follows);
    }

    // ── DONATE TO NPO ──────────────────────────────────────────
    [Authorize(Roles = "Business")]
    [HttpPost("donate/{npoId}")]
    public async Task<IActionResult> Donate(int npoId, [FromBody] DonateDto dto)
    {
        var userId = CallerId;

        if (dto.Amount <= 0) return BadRequest("Amount must be greater than zero.");

        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.NpoId == npoId);
        if (npo == null) return NotFound("NPO not found.");

        var senderWallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);
        if (senderWallet == null) return BadRequest("You do not have a wallet.");
        if (senderWallet.Balance < dto.Amount) return BadRequest("Insufficient wallet balance.");

        var receiverWallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == npo.UserId);
        if (receiverWallet == null) return BadRequest("NPO wallet not found.");

        using var dbTx = await _context.Database.BeginTransactionAsync();
        try
        {
            senderWallet.Balance -= dto.Amount;
            receiverWallet.Balance += dto.Amount;

            var transaction = new Transaction
            {
                SenderUserId = userId,
                ReceiverUserId = npo.UserId,
                Amount = dto.Amount,
                TransactionType = "Donation",
                Status = "Completed",
                Timestamp = DateTime.UtcNow
            };
            _context.Transactions.Add(transaction);

            await _context.SaveChangesAsync();
            await dbTx.CommitAsync();

            return Ok(new { message = "Donation successful.", transactionId = transaction.TransactionId, newBalance = senderWallet.Balance });
        }
        catch
        {
            await dbTx.RollbackAsync();
            return StatusCode(500, "Donation failed.");
        }
    }

    // ── TOP UP WALLET ──────────────────────────────────────────
    [Authorize(Roles = "Business")]
    [HttpPost("topup")]
    public async Task<IActionResult> TopUp([FromBody] TopUpRequest dto)
    {
        var userId = CallerId;

        if (dto.Amount <= 0) return BadRequest("Amount must be greater than zero.");

        // Per-transaction top-up limits.
        if (dto.Amount < _limits.MinTopUp)
            return BadRequest($"Minimum top-up is R {_limits.MinTopUp:0.##}.");
        if (dto.Amount > _limits.MaxTopUp)
            return BadRequest($"Maximum top-up is R {_limits.MaxTopUp:0.##}.");

        // Simulated card charge. A well-formed card is always required
        // (Luhn + non-expired expiry + CVV); no real issuer check.
        if (_payments != null)
        {
            var charge = _payments.Charge(dto.CardNumber, dto.CardExpiry, dto.CardCvv);
            if (!charge.Approved)
                return BadRequest(charge.DeclineReason ?? "Card was declined.");
        }

        var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null) return BadRequest("No wallet found.");

        using var dbTx = await _context.Database.BeginTransactionAsync();
        try
        {
            wallet.Balance += dto.Amount;
            _context.Transactions.Add(new Transaction
            {
                SenderUserId = null,
                ReceiverUserId = userId,
                Amount = dto.Amount,
                TransactionType = "TopUp",
                Status = "Completed",
                Timestamp = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            await dbTx.CommitAsync();

            return Ok(new { message = "Wallet topped up.", newBalance = wallet.Balance });
        }
        catch
        {
            await dbTx.RollbackAsync();
            return StatusCode(500, "Top-up failed.");
        }
    }

    // ── MY DONATIONS ───────────────────────────────────────────
    [Authorize(Roles = "Business")]
    [HttpGet("my-donations")]
    public async Task<IActionResult> GetMyDonations()
    {
        var userId = CallerId;

        var donations = await _context.Transactions
            .Where(t => t.SenderUserId == userId && t.TransactionType == "Donation")
            .OrderByDescending(t => t.Timestamp)
            .Select(t => new
            {
                transactionId = t.TransactionId,
                amount = t.Amount,
                status = t.Status,
                timestamp = t.Timestamp,
                receiverUserId = t.ReceiverUserId
            })
            .ToListAsync();

        var totalDonated = donations.Where(d => d.status == "Completed").Sum(d => d.amount);

        return Ok(new { totalDonated, count = donations.Count, donations });
    }

    // ── FULL TRANSACTION HISTORY ───────────────────────────────
    // Every money movement for this business (top-ups in, donations out,
    // campaign contributions out) with a resolved counterparty NAME + summary.
    [Authorize(Roles = "Business")]
    [HttpGet("transactions")]
    public async Task<IActionResult> GetMyTransactions()
    {
        var userId = CallerId;

        var rows = await _context.Transactions
            .Where(t => t.SenderUserId == userId || t.ReceiverUserId == userId)
            .OrderByDescending(t => t.Timestamp)
            .Select(t => new
            {
                t.TransactionId,
                t.SenderUserId,
                t.ReceiverUserId,
                t.Amount,
                t.TransactionType,
                t.Status,
                t.Timestamp
            })
            .ToListAsync();

        var otherIds = rows
            .Select(r => r.SenderUserId == userId ? r.ReceiverUserId : r.SenderUserId)
            .Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();

        var resolver = _names ?? new UserNameResolver(_context);
        var names = await resolver.ResolveAsync(otherIds);

        var transactions = rows.Select(r =>
        {
            var isIncoming = r.ReceiverUserId == userId;
            var otherId = isIncoming ? r.SenderUserId : r.ReceiverUserId;
            string counterparty = r.TransactionType switch
            {
                "TopUp" => "Wallet top-up (card)",
                "Withdrawal" => "Bank withdrawal",
                _ => otherId.HasValue && names.TryGetValue(otherId.Value, out var n) ? n : "UbuntuConnect"
            };
            return new
            {
                transactionId = r.TransactionId,
                type = r.TransactionType,
                direction = isIncoming ? "in" : "out",
                amount = r.Amount,
                status = r.Status,
                timestamp = r.Timestamp,
                counterpartyName = counterparty
            };
        }).ToList();

        bool Completed(string s) => s == "Completed";
        var totalToppedUp = rows.Where(r => r.TransactionType == "TopUp" && Completed(r.Status)).Sum(r => r.Amount);
        var totalDonated = rows.Where(r => (r.TransactionType == "Donation" || r.TransactionType == "CampaignContribution") && r.SenderUserId == userId && Completed(r.Status)).Sum(r => r.Amount);

        return Ok(new
        {
            summary = new { totalToppedUp, totalDonated, count = transactions.Count },
            transactions
        });
    }

    // ── MY CAMPAIGNS ───────────────────────────────────────────
    [Authorize(Roles = "Business")]
    [HttpGet("my-campaigns")]
    public async Task<IActionResult> GetMyCampaigns()
    {
        var userId = CallerId;

        var business = await _context.Businesses.FirstOrDefaultAsync(b => b.UserId == userId);
        if (business == null) return BadRequest("No Business profile linked.");

        var campaigns = await _context.PartnershipCampaigns
            .Where(c => c.BusinessId == business.BusinessId)
            .OrderByDescending(c => c.CampaignId)
            .Select(c => new
            {
                campaignId = c.CampaignId,
                title = c.Title,
                description = c.Description,
                category = c.Category,
                requirements = c.Requirements,
                budgetPerPartner = c.BudgetPerPartner,
                startDate = c.StartDate,
                endDate = c.EndDate,
                applicantCount = c.CampaignApplications.Count()
            })
            .ToListAsync();

        return Ok(campaigns);
    }

    // ── COMMUNITY UPDATES ──────────────────────────────────────
    [HttpGet("community-updates")]
    public async Task<IActionResult> GetCommunityUpdates()
    {
        var posts = await _context.Posts
            .Include(p => p.User).ThenInclude(u => u.Npos)
            .Where(p => p.ActivityStatus == "Active")
            .OrderByDescending(p => p.Timestamp)
            .Select(p => new
            {
                postId = p.PostId,
                authorName = p.User.Npos.Any()
                    ? p.User.Npos.First().OrganizationName
                    : p.User.UserEmail,
                authorNpoId = p.User.Npos.Any()
                    ? (int?)p.User.Npos.First().NpoId
                    : null,
                postTitle = p.PostTitle,
                content = p.Content,
                mediaUrl = p.MediaUrl,
                likeCount = p.LikeCount,
                timestamp = p.Timestamp
            })
            .ToListAsync();

        return Ok(posts);
    }

    // ── CSR IMPACT ─────────────────────────────────────────────
    [Authorize(Roles = "Business")]
    [HttpGet("my-impact")]
    public async Task<IActionResult> GetMyImpact()
    {
        var userId = CallerId;

        var totalDonated = await _context.Transactions
            .Where(t => t.SenderUserId == userId && t.TransactionType == "Donation" && t.Status == "Completed")
            .SumAsync(t => t.Amount);

        var nposSupported = await _context.Transactions
            .Where(t => t.SenderUserId == userId && t.TransactionType == "Donation" && t.Status == "Completed")
            .Select(t => t.ReceiverUserId)
            .Distinct()
            .CountAsync();

        var nposFollowing = await _context.Follows
            .Where(f => f.UserId == userId)
            .CountAsync();

        var business = await _context.Businesses.FirstOrDefaultAsync(b => b.UserId == userId);
        var activeCampaigns = 0;
        if (business != null)
        {
            activeCampaigns = await _context.PartnershipCampaigns
                .Where(c => c.BusinessId == business.BusinessId)
                .CountAsync();
        }

        return Ok(new
        {
            totalDonated,
            nposSupported,
            nposFollowing,
            activeCampaigns
        });
    }
}
