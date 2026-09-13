namespace UbuntuConnectAPI.Services.Cleanup;

/// <summary>Outcome of a cleanup pass (or a dry-run preview).</summary>
public class GhostCleanupResult
{
    public int SoftDeleted { get; set; }
    public int HardDeleted { get; set; }
    public bool DryRun { get; set; }
    public List<int> SoftDeletedUserIds { get; set; } = new();
    public List<int> HardDeletedUserIds { get; set; } = new();
}

/// <summary>
/// Identifies and removes "ghost" accounts (never-verified emails past a grace
/// window). Split out from the background runner so the selection + action
/// logic is unit-testable and can also be triggered on demand by an admin.
/// </summary>
public interface IGhostAccountCleanupService
{
    /// <summary>
    /// Runs one cleanup pass. When <paramref name="dryRun"/> is true, reports
    /// what would happen without modifying any data.
    /// </summary>
    Task<GhostCleanupResult> RunAsync(bool dryRun, CancellationToken cancellationToken = default);
}
