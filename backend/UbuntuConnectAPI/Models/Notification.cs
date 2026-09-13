using System;

namespace UbuntuConnectAPI.Models;

public partial class Notification
{
    public int NotificationId { get; set; }

    public int UserId { get; set; }

    /// <summary>Category, e.g. "VerificationApproved", "VolunteerAccepted", "PostRemoved".</summary>
    public string Type { get; set; } = null!;

    public string Message { get; set; } = null!;

    /// <summary>Optional id of the related subject (application, post, etc.).</summary>
    public int? RelatedEntityId { get; set; }

    public bool IsRead { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
