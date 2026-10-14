using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Models;
using UbuntuConnectAPI.Services.Notifications;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/postreport")]
public class PostReportController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notifications;

    public PostReportController(AppDbContext context, INotificationService notifications)
    {
        _context = context;
        _notifications = notifications;
    }

    private int CallerId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    // ── USER: report a post ────────────────────────────────────
    [Authorize]
    [HttpPost("post/{postId}")]
    public async Task<IActionResult> Report(int postId, [FromBody] ReportPostRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Reason))
            return BadRequest("A reason is required to report a post.");

        var post = await _context.Posts.FirstOrDefaultAsync(p => p.PostId == postId);
        if (post == null || post.ActivityStatus == "Deleted")
            return NotFound("Post not found.");

        // Can't report your own post.
        if (post.UserId == CallerId)
            return BadRequest("You cannot report your own post.");

        var alreadyReported = await _context.PostReports
            .AnyAsync(r => r.PostId == postId && r.ReporterUserId == CallerId);
        if (alreadyReported)
            return BadRequest("You have already reported this post.");

        _context.PostReports.Add(new PostReport
        {
            PostId = postId,
            ReporterUserId = CallerId,
            Reason = req.Reason.Trim(),
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();

        return Ok(new { message = "Thank you. This post has been reported for review." });
    }

    // ── ADMIN: list reported posts ─────────────────────────────
    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetReports([FromQuery] string? status = "Pending")
    {
        var query = _context.PostReports.AsQueryable();
        if (!string.IsNullOrWhiteSpace(status) && status != "All")
            query = query.Where(r => r.Status == status);

        var reports = await query
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.ReportId,
                r.PostId,
                r.ReporterUserId,
                // Reporter's display name so admins see who reported, not "user #12".
                reporterName = _context.Users.Where(u => u.UserId == r.ReporterUserId)
                    .Select(u => u.Individuals.Select(i => i.FirstName + " " + i.LastName).FirstOrDefault()
                        ?? u.Npos.Select(n => n.OrganizationName).FirstOrDefault()
                        ?? u.Businesses.Select(b => b.ContactPersonName).FirstOrDefault()
                        ?? u.UserEmail).FirstOrDefault(),
                r.Reason,
                r.Status,
                r.CreatedAt,
                r.ReviewedAt,
                post = new
                {
                    r.Post.PostId,
                    r.Post.PostTitle,
                    r.Post.Content,
                    r.Post.MediaUrl,
                    r.Post.ActivityStatus,
                    authorUserId = r.Post.UserId,
                    // Author's display name for the same reason.
                    authorName = _context.Users.Where(u => u.UserId == r.Post.UserId)
                        .Select(u => u.Individuals.Select(i => i.FirstName + " " + i.LastName).FirstOrDefault()
                            ?? u.Npos.Select(n => n.OrganizationName).FirstOrDefault()
                            ?? u.Businesses.Select(b => b.ContactPersonName).FirstOrDefault()
                            ?? u.UserEmail).FirstOrDefault()
                }
            })
            .ToListAsync();

        return Ok(reports);
    }

    // ── ADMIN: dismiss a report (post is fine) ─────────────────
    [Authorize(Roles = "Admin")]
    [HttpPut("{reportId}/dismiss")]
    public async Task<IActionResult> Dismiss(int reportId)
    {
        var report = await _context.PostReports.FirstOrDefaultAsync(r => r.ReportId == reportId);
        if (report == null) return NotFound("Report not found.");

        report.Status = "Dismissed";
        report.ReviewedByUserId = CallerId;
        report.ReviewedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Report dismissed." });
    }

    // ── ADMIN: remove the post (soft-delete) + notify author ───
    [Authorize(Roles = "Admin")]
    [HttpPut("{reportId}/remove-post")]
    public async Task<IActionResult> RemovePost(int reportId)
    {
        var report = await _context.PostReports
            .Include(r => r.Post)
            .FirstOrDefaultAsync(r => r.ReportId == reportId);
        if (report == null) return NotFound("Report not found.");

        var post = report.Post;
        post.ActivityStatus = "Deleted";

        // Mark this and any other pending reports for the same post as reviewed.
        var relatedReports = await _context.PostReports
            .Where(r => r.PostId == post.PostId && r.Status == "Pending")
            .ToListAsync();
        foreach (var r in relatedReports)
        {
            r.Status = "Reviewed";
            r.ReviewedByUserId = CallerId;
            r.ReviewedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Notify the post author that their post was removed.
        await _notifications.CreateAsync(
            post.UserId,
            "PostRemoved",
            $"Your post \"{post.PostTitle}\" was removed by an administrator for violating community guidelines.",
            post.PostId);

        return Ok(new { message = "Post removed and author notified." });
    }
}
