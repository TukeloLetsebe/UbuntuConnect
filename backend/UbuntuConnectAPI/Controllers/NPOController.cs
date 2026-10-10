using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Services.Verification;
using UbuntuConnectAPI.Services.Notifications;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/npo")]
public class NPOController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IVerificationGate _gate;
    private readonly INotificationService? _notifications;

    public NPOController(AppDbContext context, IVerificationGate gate, INotificationService? notifications = null)
    {
        _context = context;
        _gate = gate;
        _notifications = notifications;
    }

    // Public — anyone can browse NPOs (same as IndividualController.DiscoverNpos)
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _context.Npos
            .Include(n => n.User)
                .ThenInclude(u => u.Profile)
            .Select(n => new
            {
                npoId = n.NpoId,
                userId = n.UserId,
                nporegNum = n.NporegNum,
                organizationName = n.OrganizationName,
                npofocusArea = n.NpofocusArea,
                npomission = n.Npomission,
                location = n.User.Location,
                isVerified = n.User.IsVerified,
                profileImage = n.User.Profile != null ? n.User.Profile.ProfileImage : null
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
                npomission = n.Npomission,
                location = n.User.Location
            })
            .FirstOrDefaultAsync();

        if (npo == null) return NotFound();
        return Ok(npo);
    }

    // Facebook-style public NPO profile: org details, cover/avatar, mission,
    // stats, recent posts, active fundraisers and open volunteer opportunities.
    // Contact info (email/phone) is hidden unless the viewer is fully verified
    // (or is the NPO itself). Endpoint is public — anonymous viewers see the
    // profile but never the contact details.
    [HttpGet("{id}/public")]
    public async Task<IActionResult> GetPublicProfile(int id)
    {
        var npo = await _context.Npos
            .Include(n => n.User)
                .ThenInclude(u => u.Profile)
            .FirstOrDefaultAsync(n => n.NpoId == id);
        if (npo == null) return NotFound();

        // Determine whether the viewer may see contact details.
        var contactVisible = false;
        var callerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(callerIdClaim, out var callerId))
        {
            if (callerId == npo.UserId)
            {
                contactVisible = true; // owner always sees their own contact
            }
            else
            {
                var caller = await _context.Users
                    .FirstOrDefaultAsync(u => u.UserId == callerId);
                contactVisible = caller is { IsActive: true, IsEmailVerified: true, IsVerified: true };
            }
        }

        var followerCount = await _context.Follows.CountAsync(f => f.NpoId == npo.NpoId);

        var posts = await _context.Posts
            .Where(p => p.UserId == npo.UserId && p.ActivityStatus != "Deleted")
            .OrderByDescending(p => p.Timestamp)
            .Take(20)
            .Select(p => new
            {
                postId = p.PostId,
                postTitle = p.PostTitle,
                content = p.Content,
                mediaUrl = p.MediaUrl,
                likeCount = p.LikeCount,
                timestamp = p.Timestamp
            })
            .ToListAsync();

        var fundraisers = await _context.Projects
            .Where(p => p.NpoId == npo.NpoId && p.ProjectStatus == "Active")
            .OrderByDescending(p => p.ProjectId)
            .Select(p => new
            {
                projectId = p.ProjectId,
                projectName = p.ProjectName,
                projectDesc = p.ProjectDesc,
                projectProgress = p.ProjectProgress,
                targetAmount = p.TargetAmount,
                raisedAmount = p.RaisedAmount,
                images = p.Images,
                endDate = p.EndDate
            })
            .ToListAsync();

        var opportunities = await _context.VolunteerOpportunities
            .Where(o => o.NpoId == npo.NpoId)
            .OrderByDescending(o => o.OpportunityId)
            .Select(o => new
            {
                opportunityId = o.OpportunityId,
                roleTitle = o.RoleTitle,
                category = o.Category,
                numOfPositions = o.NumOfPositions,
                description = o.Description
            })
            .ToListAsync();

        return Ok(new
        {
            npoId = npo.NpoId,
            userId = npo.UserId,
            organizationName = npo.OrganizationName,
            npofocusArea = npo.NpofocusArea,
            npomission = npo.Npomission,
            nporegNum = npo.NporegNum,
            isVerified = npo.User.IsVerified,
            bio = npo.User.Profile != null ? npo.User.Profile.Bio : null,
            profileImage = npo.User.Profile != null ? npo.User.Profile.ProfileImage : null,
            backgroundImage = npo.User.Profile != null ? npo.User.Profile.BackgroundImage : null,
            location = npo.User.Location,
            followerCount,
            // Contact block — null when the viewer isn't allowed to see it.
            contactVisible,
            email = contactVisible ? npo.User.UserEmail : null,
            phone = contactVisible ? npo.User.UserContact : null,
            posts,
            fundraisers,
            opportunities
        });
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

        // Bio + images live on the linked Profile (created at registration).
        if (req.Bio != null || req.ProfileImage != null || req.BackgroundImage != null)
        {
            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == npo.UserId);
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

    // NOTE: NPO wallet Top-Up has been removed by design.
    // NPOs receive funds through donations and campaign funding, not self top-up.
    // Only Individuals and Businesses can top up their wallets.

    // NOTE: Delete endpoint removed. Deleting an NPO would cascade-delete
    // volunteer opportunities, applications, follows, etc. Same reasoning as
    // your soft-delete approach for Users — this should go through the
    // deactivate-account pattern instead, not a hard delete. Add later if needed.

    // ── FOLLOW ANOTHER NPO ────────────────────────────────────
    [Authorize(Roles = "NPO")]
    [HttpPost("follow/{npoId}")]
    public async Task<IActionResult> FollowNpo(int npoId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var npoExists = await _context.Npos.AnyAsync(n => n.NpoId == npoId);
        if (!npoExists) return NotFound("NPO not found.");

        // Prevent self-follow
        var myNpo = await _context.Npos.FirstOrDefaultAsync(n => n.UserId == userId);
        if (myNpo != null && myNpo.NpoId == npoId)
            return BadRequest("You cannot follow yourself.");

        var alreadyFollowing = await _context.Follows
            .AnyAsync(f => f.UserId == userId && f.NpoId == npoId);
        if (alreadyFollowing) return BadRequest("You already follow this NPO.");

        _context.Follows.Add(new Models.Follow { UserId = userId, NpoId = npoId, FollowDate = DateTime.UtcNow });
        await _context.SaveChangesAsync();
        return Ok(new { message = "Now following this NPO." });
    }

    // ── UNFOLLOW AN NPO ───────────────────────────────────────
    [Authorize(Roles = "NPO")]
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

    // ── GET MY FOLLOWED NPOs ──────────────────────────────────
    [Authorize(Roles = "NPO")]
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
                npofocusArea = f.Npo.NpofocusArea,
                npomission = f.Npo.Npomission,
                followDate = f.FollowDate
            })
            .ToListAsync();

        return Ok(follows);
    }

    // ── GET MY FOLLOWERS (who follows this NPO) ───────────────
    [Authorize(Roles = "NPO")]
    [HttpGet("my-followers")]
    public async Task<IActionResult> GetMyFollowers()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var npo = await _context.Npos.FirstOrDefaultAsync(n => n.UserId == userId);
        if (npo == null) return BadRequest("No NPO profile linked.");

        var followers = await _context.Follows
            .Where(f => f.NpoId == npo.NpoId)
            .Select(f => new
            {
                userId = f.UserId,
                email = f.User.UserEmail,
                name = f.User.Individuals.Any()
                    ? f.User.Individuals.First().FirstName + " " + f.User.Individuals.First().LastName
                    : f.User.Npos.Any()
                        ? f.User.Npos.First().OrganizationName
                        : f.User.UserEmail,
                userType = f.User.UserType,
                followDate = f.FollowDate
            })
            .OrderByDescending(f => f.followDate)
            .ToListAsync();

        return Ok(followers);
    }

    // ── GET MY DONORS (people who donated to this NPO) ────────
    [Authorize(Roles = "NPO")]
    [HttpGet("my-donors")]
    public async Task<IActionResult> GetMyDonors()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        // Include both direct/fundraiser donations AND campaign contributions —
        // all incoming completed funds count toward this NPO's supporters.
        var donors = await _context.Transactions
            .Where(t => t.ReceiverUserId == userId
                        && (t.TransactionType == "Donation" || t.TransactionType == "CampaignContribution")
                        && t.Status == "Completed")
            .GroupBy(t => t.SenderUserId)
            .Select(g => new
            {
                userId = g.Key,
                totalDonated = g.Sum(t => t.Amount),
                donationCount = g.Count(),
                lastDonation = g.Max(t => t.Timestamp)
            })
            .OrderByDescending(d => d.totalDonated)
            .ToListAsync();

        // Enrich with names
        var userIds = donors.Select(d => d.userId).Where(id => id.HasValue).Select(id => id!.Value).ToList();
        var users = await _context.Users
            .Where(u => userIds.Contains(u.UserId))
            .Select(u => new
            {
                userId = u.UserId,
                name = u.Individuals.Any()
                    ? u.Individuals.First().FirstName + " " + u.Individuals.First().LastName
                    : u.Npos.Any()
                        ? u.Npos.First().OrganizationName
                        : u.UserEmail,
                userType = u.UserType
            })
            .ToListAsync();

        var result = donors.Select(d => new
        {
            d.userId,
            name = users.FirstOrDefault(u => u.userId == d.userId)?.name ?? "Anonymous",
            userType = users.FirstOrDefault(u => u.userId == d.userId)?.userType ?? "Unknown",
            d.totalDonated,
            d.donationCount,
            d.lastDonation
        });

        return Ok(result);
    }

    // ── DONATE TO A PROJECT/FUNDRAISER ────────────────────────
    [Authorize]
    [HttpPost("project/{projectId}/donate")]
    public async Task<IActionResult> DonateToProject(int projectId, [FromBody] TopUpRequest dto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        // Verification gate — anti-fraud/AML: only fully verified users may donate.
        var gate = await _gate.CanTransactAsync(userId);
        if (!gate.Allowed) return StatusCode(403, gate.Reason);

        if (dto.Amount <= 0) return BadRequest("Amount must be greater than zero.");

        var project = await _context.Projects.Include(p => p.Npo).FirstOrDefaultAsync(p => p.ProjectId == projectId);
        if (project == null) return NotFound("Project not found.");

        // Prevent donating to your own project
        if (project.Npo.UserId == userId)
            return BadRequest("You cannot donate to your own fundraiser.");

        // Only allow donations to active fundraisers
        if (project.ProjectStatus != "Active")
            return BadRequest("This fundraiser is not currently accepting donations.");

        var senderWallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);
        if (senderWallet == null) return BadRequest("You don't have a wallet set up yet.");
        if (senderWallet.Balance < dto.Amount) return BadRequest("Insufficient wallet balance. Please top up your wallet.");

        var receiverWallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == project.Npo.UserId);
        if (receiverWallet == null) return BadRequest("The NPO's wallet is not set up. Donation cannot be processed.");

        using var dbTx = await _context.Database.BeginTransactionAsync();
        try
        {
            senderWallet.Balance -= dto.Amount;
            receiverWallet.Balance += dto.Amount;

            // Update project raised amount
            project.RaisedAmount += dto.Amount;
            if (project.TargetAmount > 0)
                project.ProjectProgress = Math.Min(100, (project.RaisedAmount / project.TargetAmount) * 100);

            // Auto-close the fundraiser inline when the target is reached.
            var targetReached = project.TargetAmount > 0 && project.RaisedAmount >= project.TargetAmount;
            if (targetReached && project.ProjectStatus == "Active")
                project.ProjectStatus = "Completed";

            var transaction = new Models.Transaction
            {
                SenderUserId = userId,
                ReceiverUserId = project.Npo.UserId,
                Amount = dto.Amount,
                TransactionType = "Donation",
                Status = "Completed",
                Timestamp = DateTime.UtcNow
            };
            _context.Transactions.Add(transaction);

            await _context.SaveChangesAsync();
            await dbTx.CommitAsync();

            // Best-effort notification to the NPO owner when the fundraiser just reached its goal.
            if (targetReached && _notifications != null)
            {
                try
                {
                    await _notifications.CreateAsync(
                        project.Npo.UserId,
                        "FundraiserCompleted",
                        $"Your fundraiser \"{project.ProjectName}\" reached its goal and has been marked completed.",
                        project.ProjectId);
                }
                catch { /* notifications are non-critical */ }
            }

            return Ok(new
            {
                message = "Donation to project successful.",
                transactionId = transaction.TransactionId,
                newBalance = senderWallet.Balance,
                projectRaisedAmount = project.RaisedAmount,
                projectProgress = project.ProjectProgress,
                projectStatus = project.ProjectStatus
            });
        }
        catch
        {
            await dbTx.RollbackAsync();
            return StatusCode(500, "Donation failed.");
        }
    }
}