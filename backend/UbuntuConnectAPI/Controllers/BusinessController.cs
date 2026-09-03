using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Models;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/business")]
public class BusinessController : ControllerBase
{
    private readonly AppDbContext _context;

    public BusinessController(AppDbContext context)
    {
        _context = context;
    }

    // ── GET MY PROFILE ─────────────────────────────────────────
    [Authorize(Roles = "Business")]
    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var profile = await _context.Businesses
            .Include(b => b.User)
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
                location = b.User.Location
            })
            .FirstOrDefaultAsync();

        if (profile == null) return NotFound("Business profile not found.");
        return Ok(profile);
    }

    // ── DISCOVER NPOs ──────────────────────────────────────────
    [HttpGet("discover-npos")]
    public async Task<IActionResult> DiscoverNpos()
    {
        var npos = await _context.Npos
            .Include(n => n.User)
            .Select(n => new
            {
                npoId = n.NpoId,
                organizationName = n.OrganizationName,
                focusArea = n.NpofocusArea,
                mission = n.Npomission,
                location = n.User.Location,
                isVerified = n.User.IsVerified
            })
            .ToListAsync();

        return Ok(npos);
    }

    // ── FOLLOW NPO ─────────────────────────────────────────────
    [Authorize(Roles = "Business")]
    [HttpPost("follow/{npoId}")]
    public async Task<IActionResult> FollowNpo(int npoId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

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
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

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
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var follows = await _context.Follows
            .Where(f => f.UserId == userId)
            .Select(f => new
            {
                npoId = f.NpoId,
                organizationName = f.Npo.OrganizationName,
                focusArea = f.Npo.NpofocusArea,
                mission = f.Npo.Npomission,
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
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

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
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        if (dto.Amount <= 0) return BadRequest("Amount must be greater than zero.");

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
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

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

    // ── MY CAMPAIGNS ───────────────────────────────────────────
    [Authorize(Roles = "Business")]
    [HttpGet("my-campaigns")]
    public async Task<IActionResult> GetMyCampaigns()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

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
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

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
