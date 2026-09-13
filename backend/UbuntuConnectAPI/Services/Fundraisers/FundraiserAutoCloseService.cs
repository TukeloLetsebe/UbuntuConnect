using Microsoft.EntityFrameworkCore;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.Services.Notifications;

namespace UbuntuConnectAPI.Services.Fundraisers;

/// <summary>
/// Scoped implementation that closes expired or fully-funded Active fundraisers.
/// </summary>
public class FundraiserAutoCloseService : IFundraiserAutoCloseService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notifications;
    private readonly ILogger<FundraiserAutoCloseService> _logger;

    public FundraiserAutoCloseService(
        AppDbContext context,
        INotificationService notifications,
        ILogger<FundraiserAutoCloseService> logger)
    {
        _context = context;
        _notifications = notifications;
        _logger = logger;
    }

    public async Task<int> RunAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        // Only Active fundraisers can auto-close.
        var candidates = await _context.Projects
            .Include(p => p.Npo)
            .Where(p => p.ProjectStatus == "Active")
            .Where(p =>
                (p.EndDate != null && p.EndDate <= now) ||
                (p.TargetAmount > 0 && p.RaisedAmount >= p.TargetAmount))
            .ToListAsync(cancellationToken);

        if (candidates.Count == 0) return 0;

        foreach (var project in candidates)
        {
            project.ProjectStatus = "Completed";
        }

        await _context.SaveChangesAsync(cancellationToken);

        foreach (var project in candidates)
        {
            var targetMet = project.TargetAmount > 0 && project.RaisedAmount >= project.TargetAmount;
            var reason = targetMet ? "reached its goal" : "reached its deadline";
            try
            {
                await _notifications.CreateAsync(
                    project.Npo.UserId,
                    "FundraiserCompleted",
                    $"Your fundraiser \"{project.ProjectName}\" {reason} and has been marked completed.",
                    project.ProjectId,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to notify NPO {NpoUserId} about closed fundraiser {ProjectId}.",
                    project.Npo.UserId, project.ProjectId);
            }
        }

        _logger.LogInformation("Auto-closed {Count} fundraiser(s).", candidates.Count);
        return candidates.Count;
    }
}
