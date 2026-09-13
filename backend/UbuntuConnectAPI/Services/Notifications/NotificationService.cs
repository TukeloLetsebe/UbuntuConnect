using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.Models;

namespace UbuntuConnectAPI.Services.Notifications;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;

    public NotificationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Notification> CreateAsync(
        int userId,
        string type,
        string message,
        int? relatedEntityId = null,
        CancellationToken cancellationToken = default)
    {
        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            Message = message,
            RelatedEntityId = relatedEntityId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync(cancellationToken);

        return notification;
    }
}
