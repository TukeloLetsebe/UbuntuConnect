using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.Models;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/comment")]
public class CommentController : ControllerBase
{
    private readonly AppDbContext _context;

    public CommentController(AppDbContext context)
    {
        _context = context;
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
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

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
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = int.Parse(userIdClaim!);

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
