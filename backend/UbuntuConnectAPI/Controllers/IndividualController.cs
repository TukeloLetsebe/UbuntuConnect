using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.Models;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/individual")]
public class IndividualController : ControllerBase
{
    private readonly AppDbContext _context;

    public IndividualController(AppDbContext context)
    {
        _context = context;
    }

    //DISCOVER NPOs
    [HttpGet("discover-NPOs")]
    public async Task<IActionResult> DiscoverNpos()
    {
        var npos = await _context.Npos
            .Include(n => n.User)   // pulls in Users data (Location, IsVerified)
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

    //FOLLOW AN NPO
    [Authorize]
    [HttpPost("follow/{npoId}")]
    public async Task<IActionResult> FollowNpo(int npoId)
    {
        //Get the logged in user ID from the token generated
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        //Check the NPO actually exists
        var npoExists = await _context.Npos.AnyAsync(n => n.NpoId == npoId);
        if (!npoExists)
            return NotFound("NPO not found.");

        //Check they aren't already following this NPO
        var alreadyFollowing = await _context.Follows
            .AnyAsync(f => f.UserId == userId && f.NpoId == npoId);

        if (alreadyFollowing)
            return BadRequest("You already follow this NPO.");

        //Create the Follow row
        var follow = new Follow
        {
            UserId = userId,
            NpoId = npoId,
            FollowDate = DateTime.UtcNow
        };

        _context.Follows.Add(follow);
        await _context.SaveChangesAsync();

        return Ok(new { message = "You are now following this NPO." });
    }

    //UNFOLLOW AN NPO
    [Authorize]
    [HttpDelete("unfollow/{npoId}")]
    public async Task<IActionResult> UnfollowNpo(int npoId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

        var follow = await _context.Follows
            .FirstOrDefaultAsync(f => f.UserId == userId && f.NpoId == npoId);

        if (follow == null)
            return BadRequest("You are not following this NPO.");

        _context.Follows.Remove(follow);
        await _context.SaveChangesAsync();

        return Ok(new { message = "You have unfollowed this NPO." });
    }

    //FOLLOWER COUNT FOR AN NPO, just count num of rows with that matching id
    [HttpGet("npo/{npoId}/followers-count")]
    public async Task<IActionResult> GetFollowerCount(int npoId)
    {
        var npoExists = await _context.Npos.AnyAsync(n => n.NpoId == npoId);
        if (!npoExists)
            return NotFound("NPO not found.");

        var count = await _context.Follows.CountAsync(f => f.NpoId == npoId);

        return Ok(new { npoId = npoId, followerCount = count });
    }
}