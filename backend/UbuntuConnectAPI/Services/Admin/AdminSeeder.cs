using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.Models;
using UbuntuConnectAPI.Validation;

namespace UbuntuConnectAPI.Services.Admin;

/// <summary>
/// Startup hosted service that seeds a single Admin account from configuration
/// when enabled. This is the ONLY way an Admin is created — the public
/// registration endpoint rejects UserType "Admin". Idempotent: if the admin
/// email already exists, it does nothing.
/// </summary>
public class AdminSeeder : IHostedService
{
    private readonly IServiceProvider _services;
    private readonly AdminSeedOptions _options;
    private readonly ILogger<AdminSeeder> _logger;

    public AdminSeeder(
        IServiceProvider services,
        IOptions<AdminSeedOptions> options,
        ILogger<AdminSeeder> logger)
    {
        _services = services;
        _options = options.Value;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        if (!_options.Enabled)
            return;

        if (!ValidationPatterns.IsValidEmail(_options.Email) ||
            !ValidationPatterns.IsStrongPassword(_options.Password))
        {
            _logger.LogWarning("AdminSeed is enabled but Email/Password are missing or invalid. Skipping admin seeding.");
            return;
        }

        using var scope = _services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var exists = await context.Users.AnyAsync(u => u.UserEmail == _options.Email, cancellationToken);
        if (exists)
        {
            _logger.LogInformation("AdminSeed: admin account already exists — no action taken.");
            return;
        }

        await using var tx = await context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var user = new User
            {
                UserEmail = _options.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(_options.Password),
                UserType = "Admin",
                IsVerified = true,
                IsEmailVerified = true,
                IsActive = true
            };
            context.Users.Add(user);
            await context.SaveChangesAsync(cancellationToken);

            context.Wallets.Add(new Wallet { UserId = user.UserId, Balance = 0 });
            context.Profiles.Add(new Profile
            {
                UserId = user.UserId,
                ProfileName = "Administrator",
                Following = 0,
                Followers = 0
            });
            await context.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            _logger.LogInformation("AdminSeed: created admin account {Email}.", _options.Email);
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync(cancellationToken);
            _logger.LogError(ex, "AdminSeed: failed to create admin account. No data was saved.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
