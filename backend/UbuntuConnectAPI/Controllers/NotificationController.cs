using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/notification")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly AppDbContext _context;

    public NotificationController(AppDbContext context)
    {
        _context = context;
    }

    private int CallerId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    /// <summary>Returns the caller's notifications, newest first.</summary>
    [HttpGet]
    public async Task<IActionResult> GetMine([FromQuery] bool unreadOnly = false)
    {
        var query = _context.Notifications.Where(n => n.UserId == CallerId);
        if (unreadOnly)
            query = query.Where(n => !n.IsRead);

        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new
            {
                n.NotificationId,
                n.Type,
                n.Message,
                n.RelatedEntityId,
                n.IsRead,
                n.CreatedAt
            })
            .ToListAsync();

        return Ok(items);
    }

    /// <summary>Returns the caller's unread notification count.</summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var count = await _context.Notifications
            .CountAsync(n => n.UserId == CallerId && !n.IsRead);
        return Ok(new { count });
    }

    /// <summary>Marks a single notification as read (must belong to the caller).</summary>
    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var notification = await _context.Notifications.FirstOrDefaultAsync(n => n.NotificationId == id);
        if (notification == null)
            return NotFound("Notification not found.");
        if (notification.UserId != CallerId)
            return Forbid();

        if (!notification.IsRead)
        {
            notification.IsRead = true;
            await _context.SaveChangesAsync();
        }

        return Ok(new { notification.NotificationId, notification.IsRead });
    }

    /// <summary>Marks all of the caller's notifications as read.</summary>
    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        var unread = await _context.Notifications
            .Where(n => n.UserId == CallerId && !n.IsRead)
            .ToListAsync();

        foreach (var n in unread)
            n.IsRead = true;

        await _context.SaveChangesAsync();
        return Ok(new { updated = unread.Count });
    }
}
