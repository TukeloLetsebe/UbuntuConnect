using System;

namespace UbuntuConnectAPI.Models;

public partial class PostReport
{
    public int ReportId { get; set; }

    public int PostId { get; set; }

    public int ReporterUserId { get; set; }

    public string Reason { get; set; } = null!;

    /// <summary>Pending | Reviewed | Dismissed.</summary>
    public string Status { get; set; } = "Pending";

    public int? ReviewedByUserId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? ReviewedAt { get; set; }

    public virtual Post Post { get; set; } = null!;
}
