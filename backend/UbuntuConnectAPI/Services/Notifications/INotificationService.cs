using UbuntuConnectAPI.Models;

namespace UbuntuConnectAPI.Services.Notifications;

/// <summary>
/// Creates in-app notifications for users. Called by feature code (verification
/// review, volunteer accept/reject, post moderation, etc.). Persists to the
/// Notifications table so users see them in their notification bell.
/// </summary>
public interface INotificationService
{
    Task<Notification> CreateAsync(
        int userId,
        string type,
        string message,
        int? relatedEntityId = null,
        CancellationToken cancellationToken = default);
}
