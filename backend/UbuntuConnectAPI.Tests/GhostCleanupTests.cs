using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.Models;
using UbuntuConnectAPI.Services.Cleanup;
using Xunit;

namespace UbuntuConnectAPI.Tests;

public class GhostCleanupTests
{
    private static readonly GhostCleanupOptions Opts = new()
    {
        UnverifiedGraceDays = 7,
        HardDeleteAfterDays = 30
    };

    private static GhostAccountCleanupService MakeService(AppDbContext ctx) =>
        new(ctx, Options.Create(Opts), NullLogger<GhostAccountCleanupService>.Instance);

    private static User AddUser(AppDbContext ctx, string type, bool emailVerified, bool active, int ageDays)
    {
        var u = new User
        {
            UserEmail = $"u{Guid.NewGuid():N}@test.local",
            PasswordHash = "hash",
            UserType = type,
            IsEmailVerified = emailVerified,
            IsActive = active,
            IsVerified = false,
            RegistrationDate = DateTime.UtcNow.AddDays(-ageDays)
        };
        ctx.Users.Add(u);
        ctx.SaveChanges();
        return u;
    }

    [Fact]
    public async Task DryRun_reports_candidates_but_changes_nothing()
    {
        using var ctx = TestDbContextFactory.Create();
        var ghost = AddUser(ctx, "Individual", emailVerified: false, active: true, ageDays: 10);

        var result = await MakeService(ctx).RunAsync(dryRun: true);

        Assert.True(result.DryRun);
        Assert.Equal(1, result.SoftDeleted);
        Assert.Contains(ghost.UserId, result.SoftDeletedUserIds);
        Assert.True(ctx.Users.Single().IsActive); // unchanged
    }

    [Fact]
    public async Task Soft_deletes_old_unverified_active_accounts()
    {
        using var ctx = TestDbContextFactory.Create();
        var ghost = AddUser(ctx, "Individual", emailVerified: false, active: true, ageDays: 10);

        var result = await MakeService(ctx).RunAsync(dryRun: false);

        Assert.Equal(1, result.SoftDeleted);
        Assert.False(ctx.Users.Single(u => u.UserId == ghost.UserId).IsActive);
    }

    [Fact]
    public async Task Leaves_verified_fresh_and_admin_accounts_alone()
    {
        using var ctx = TestDbContextFactory.Create();
        AddUser(ctx, "Individual", emailVerified: true, active: true, ageDays: 100);  // verified
        AddUser(ctx, "Individual", emailVerified: false, active: true, ageDays: 2);   // too fresh
        AddUser(ctx, "Admin", emailVerified: false, active: true, ageDays: 100);      // admin exempt

        var result = await MakeService(ctx).RunAsync(dryRun: false);

        Assert.Equal(0, result.SoftDeleted);
        Assert.Equal(0, result.HardDeleted);
        Assert.All(ctx.Users.ToList(), u => Assert.True(u.IsActive));
    }

    [Fact]
    public async Task Hard_deletes_long_softdeleted_ghosts_without_transactions()
    {
        using var ctx = TestDbContextFactory.Create();
        var ghost = AddUser(ctx, "Individual", emailVerified: false, active: false, ageDays: 40);

        var result = await MakeService(ctx).RunAsync(dryRun: false);

        Assert.Equal(1, result.HardDeleted);
        Assert.Empty(ctx.Users);
    }

    [Fact]
    public async Task Does_not_hard_delete_ghost_with_transactions()
    {
        using var ctx = TestDbContextFactory.Create();
        var ghost = AddUser(ctx, "Individual", emailVerified: false, active: false, ageDays: 40);
        ctx.Transactions.Add(new Transaction
        {
            ReceiverUserId = ghost.UserId,
            Amount = 10,
            TransactionType = "TopUp",
            Status = "Completed",
            Timestamp = DateTime.UtcNow
        });
        ctx.SaveChanges();

        var result = await MakeService(ctx).RunAsync(dryRun: false);

        Assert.Equal(0, result.HardDeleted);
        Assert.Single(ctx.Users);
    }
}
