using Microsoft.Extensions.Options;

namespace UbuntuConnectAPI.Services.Fundraisers;

/// <summary>
/// Periodic runner for fundraiser auto-close. Runs on a configurable interval
/// while enabled. Resolves a scoped worker per pass (BackgroundService is a
/// singleton; the DbContext is scoped).
/// </summary>
public class FundraiserAutoCloseBackgroundService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly FundraiserAutoCloseOptions _options;
    private readonly ILogger<FundraiserAutoCloseBackgroundService> _logger;

    public FundraiserAutoCloseBackgroundService(
        IServiceProvider services,
        IOptions<FundraiserAutoCloseOptions> options,
        ILogger<FundraiserAutoCloseBackgroundService> logger)
    {
        _services = services;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled)
        {
            _logger.LogInformation("Fundraiser auto-close job is disabled.");
            return;
        }

        var interval = TimeSpan.FromMinutes(_options.IntervalMinutes <= 0 ? 60 : _options.IntervalMinutes);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var worker = scope.ServiceProvider.GetRequiredService<IFundraiserAutoCloseService>();
                await worker.RunAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fundraiser auto-close pass failed.");
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
