using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.Models;
using UbuntuConnectAPI.Services.Notifications;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/comment")]
public class CommentController : BaseApiController
{
    private readonly AppDbContext _context;
    private readonly INotificationService? _notifications;

    public CommentController(AppDbContext context, INotificationService? notifications = null)
    {
        _context = context;
        _notifications = notifications;
    }

    // Get comments for a specific post
    [HttpGet("post/{postId}")]
    public async Task<IActionResult> GetByPost(int postId)
    {
        var post = await _context.Posts.FindAsync(postId);
        if (post == null) return NotFound("Post not found.");

        var comments = await _context.Comments
            .Where(c => c.PostId == postId)
            .OrderByDescending(c => c.Timestamp)
            .Select(c => new
            {
                commentId = c.CommentId,
                postId = c.PostId,
                userId = c.UserId,
                authorName = c.User.Individuals.Any()
                    ? c.User.Individuals.First().FirstName + " " + c.User.Individuals.First().LastName
                    : c.User.Npos.Any()
                        ? c.User.Npos.First().OrganizationName
                        : c.User.Businesses.Any()
                            ? c.User.Businesses.First().ContactPersonName
                            : c.User.UserEmail,
                content = c.Content,
                timestamp = c.Timestamp
            })
            .ToListAsync();

        return Ok(comments);
    }

    // Create a comment on a post
    [Authorize]
    [HttpPost("post/{postId}")]
    public async Task<IActionResult> Create(int postId, [FromBody] CreateCommentRequest req)
    {
        var userId = CallerId;

        // Commenting requires a verified (email-confirmed) account. This keeps
        // throwaway/unconfirmed accounts from posting comments. Enforced here on
        // the server — a hidden UI button alone would not stop a direct API call.
        var author = await _context.Users.FindAsync(userId);
        if (author == null) return NotFound("User not found.");
        if (!author.IsActive) return StatusCode(403, "Your account is not active.");
        if (!author.IsEmailVerified)
            return StatusCode(403, "Please verify your email address before commenting.");

        var post = await _context.Posts.FindAsync(postId);
        if (post == null) return NotFound("Post not found.");
        if (post.ActivityStatus != "Active") return BadRequest("Cannot comment on an inactive post.");

        if (string.IsNullOrWhiteSpace(req.Content))
            return BadRequest("Comment content is required.");

        var comment = new Comment
        {
            PostId = postId,
            UserId = userId,
            Content = req.Content.Trim(),
            Timestamp = DateTime.UtcNow
        };

        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        // Load author info for response
        var user = await _context.Users
            .Include(u => u.Individuals)
            .Include(u => u.Npos)
            .Include(u => u.Businesses)
            .FirstAsync(u => u.UserId == userId);

        var authorName = user.Individuals.Any()
            ? user.Individuals.First().FirstName + " " + user.Individuals.First().LastName
            : user.Npos.Any()
                ? user.Npos.First().OrganizationName
                : user.Businesses.Any()
                    ? user.Businesses.First().ContactPersonName
                    : user.UserEmail;

        // Best-effort: tell the post author about the new comment (skip self-comments).
        if (_notifications != null && post.UserId != userId)
        {
            try
            {
                await _notifications.CreateAsync(
                    post.UserId,
                    "PostComment",
                    $"{authorName} commented on your post \"{post.PostTitle}\".",
                    post.PostId);
            }
            catch { /* notifications are non-critical */ }
        }

        return CreatedAtAction(nameof(GetByPost), new { postId }, new
        {
            commentId = comment.CommentId,
            postId = comment.PostId,
            userId = comment.UserId,
            authorName,
            content = comment.Content,
            timestamp = comment.Timestamp
        });
    }

    // Delete own comment (or post owner can delete comments on their posts)
    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = CallerId;

        var comment = await _context.Comments
            .Include(c => c.Post)
            .FirstOrDefaultAsync(c => c.CommentId == id);

        if (comment == null) return NotFound("Comment not found.");

        // Allow deletion if: comment author OR post owner
        if (comment.UserId != userId && comment.Post.UserId != userId)
            return Forbid();

        _context.Comments.Remove(comment);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

public class CreateCommentRequest
{
    public string Content { get; set; } = null!;
}
