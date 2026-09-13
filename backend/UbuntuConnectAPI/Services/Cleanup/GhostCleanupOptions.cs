namespace UbuntuConnectAPI.Services.Cleanup;

/// <summary>
/// Bound from the "GhostCleanup" section. Controls the periodic job that
/// removes "ghost" accounts: users who never verified their email within a
/// grace window. Soft-delete (deactivate) first, then hard-delete after a
/// further window, so the action is reversible for a period.
/// </summary>
public class GhostCleanupOptions
{
    public const string SectionName = "GhostCleanup";

    /// <summary>Master switch for the periodic background job.</summary>
    public bool Enabled { get; set; } = false;

    /// <summary>When true, the job logs what it WOULD do but changes nothing.</summary>
    public bool DryRun { get; set; } = true;

    /// <summary>How often the background job runs.</summary>
    public double IntervalHours { get; set; } = 24;

    /// <summary>Unverified accounts older than this are soft-deleted (deactivated).</summary>
    public int UnverifiedGraceDays { get; set; } = 7;

    /// <summary>Soft-deleted ghost accounts older than this are hard-deleted.</summary>
    public int HardDeleteAfterDays { get; set; } = 30;
}
