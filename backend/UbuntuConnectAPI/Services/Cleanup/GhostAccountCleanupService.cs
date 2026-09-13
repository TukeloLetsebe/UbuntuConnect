using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using UbuntuConnectAPI.Data;

namespace UbuntuConnectAPI.Services.Cleanup;

public class GhostAccountCleanupService : IGhostAccountCleanupService
{
    private readonly AppDbContext _context;
    private readonly GhostCleanupOptions _options;
    private readonly ILogger<GhostAccountCleanupService> _logger;

    public GhostAccountCleanupService(
        AppDbContext context,
        IOptions<GhostCleanupOptions> options,
        ILogger<GhostAccountCleanupService> logger)
    {
        _context = context;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<GhostCleanupResult> RunAsync(bool dryRun, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var softCutoff = now.AddDays(-_options.UnverifiedGraceDays);
        var hardCutoff = now.AddDays(-_options.HardDeleteAfterDays);

        var result = new GhostCleanupResult { DryRun = dryRun };

        // ── Soft-delete: unverified, still active, past the grace window ──
        // Never touch Admins, and never touch accounts that have any wallet
        // movement (they aren't ghosts).
        var softCandidates = await _context.Users
            .Where(u => !u.IsEmailVerified
                        && u.IsActive
                        && u.UserType != "Admin"
                        && u.RegistrationDate < softCutoff)
            .ToListAsync(cancellationToken);

        foreach (var u in softCandidates)
        {
            result.SoftDeletedUserIds.Add(u.UserId);
            if (!dryRun)
                u.IsActive = false;
        }
        result.SoftDeleted = softCandidates.Count;

        // ── Hard-delete: unverified, already deactivated, past the hard window,
        // with NO transactions (transactions have no cascade). Cascade removes
        // wallet/profile/subtype/tokens/notifications. ──
        var hardCandidates = await _context.Users
            .Where(u => !u.IsEmailVerified
                        && !u.IsActive
                        && u.UserType != "Admin"
                        && u.RegistrationDate < hardCutoff)
            .ToListAsync(cancellationToken);

        foreach (var u in hardCandidates)
        {
            var hasTransactions = await _context.Transactions
                .AnyAsync(t => t.SenderUserId == u.UserId || t.ReceiverUserId == u.UserId, cancellationToken);
            if (hasTransactions)
                continue;

            result.HardDeletedUserIds.Add(u.UserId);
            if (!dryRun)
                _context.Users.Remove(u);
        }
        result.HardDeleted = result.HardDeletedUserIds.Count;

        if (!dryRun && (result.SoftDeleted > 0 || result.HardDeleted > 0))
            await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Ghost cleanup {Mode}: {Soft} soft-deleted, {Hard} hard-deleted.",
            dryRun ? "DRY-RUN" : "APPLIED", result.SoftDeleted, result.HardDeleted);

        return result;
    }
}
