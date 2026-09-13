using Microsoft.Extensions.Options;

namespace UbuntuConnectAPI.Services.Cleanup;

/// <summary>
/// Periodic runner for ghost-account cleanup. Runs on a configurable interval
/// while enabled, honouring the DryRun flag. Resolves a scoped cleanup service
/// per pass (BackgroundService is a singleton; the DbContext is scoped).
/// </summary>
public class GhostCleanupBackgroundService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly GhostCleanupOptions _options;
    private readonly ILogger<GhostCleanupBackgroundService> _logger;

    public GhostCleanupBackgroundService(
        IServiceProvider services,
        IOptions<GhostCleanupOptions> options,
        ILogger<GhostCleanupBackgroundService> logger)
    {
        _services = services;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("Ghost cleanup job is disabled.");
            return;
        }

        var interval = TimeSpan.FromHours(_options.IntervalHours <= 0 ? 24 : _options.IntervalHours);

        // Run once shortly after startup, then on the configured interval.
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var cleanup = scope.ServiceProvider.GetRequiredService<IGhostAccountCleanupService>();
                await cleanup.RunAsync(_options.DryRun, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ghost cleanup pass failed.");
            }

            try
            {
                await Task.Delay(interval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
