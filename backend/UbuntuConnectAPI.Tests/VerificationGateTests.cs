using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.Models;
using UbuntuConnectAPI.Services.Verification;
using Xunit;

namespace UbuntuConnectAPI.Tests;

public class VerificationGateTests
{
    private static User AddUser(AppDbContext ctx, bool emailVerified, bool idVerified, bool active = true)
    {
        var u = new User
        {
            UserEmail = $"u{Guid.NewGuid():N}@test.local",
            PasswordHash = "hash",
            UserType = "Individual",
            IsEmailVerified = emailVerified,
            IsVerified = idVerified,
            IsActive = active,
            RegistrationDate = DateTime.UtcNow
        };
        ctx.Users.Add(u);
        ctx.SaveChanges();
        return u;
    }

    [Fact]
    public async Task Allows_fully_verified_user()
    {
        using var ctx = TestDbContextFactory.Create();
        var u = AddUser(ctx, emailVerified: true, idVerified: true);
        var gate = new VerificationGate(ctx);

        var result = await gate.CanTransactAsync(u.UserId);

        Assert.True(result.Allowed);
        Assert.Null(result.Reason);
    }

    [Fact]
    public async Task Blocks_when_email_not_verified()
    {
        using var ctx = TestDbContextFactory.Create();
        var u = AddUser(ctx, emailVerified: false, idVerified: true);
        var gate = new VerificationGate(ctx);

        var result = await gate.CanTransactAsync(u.UserId);

        Assert.False(result.Allowed);
        Assert.Contains("email", result.Reason, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Blocks_when_identity_not_verified()
    {
        using var ctx = TestDbContextFactory.Create();
        var u = AddUser(ctx, emailVerified: true, idVerified: false);
        var gate = new VerificationGate(ctx);

        var result = await gate.CanTransactAsync(u.UserId);

        Assert.False(result.Allowed);
        Assert.Contains("identity", result.Reason, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Blocks_inactive_user()
    {
        using var ctx = TestDbContextFactory.Create();
        var u = AddUser(ctx, emailVerified: true, idVerified: true, active: false);
        var gate = new VerificationGate(ctx);

        var result = await gate.CanTransactAsync(u.UserId);

        Assert.False(result.Allowed);
    }

    [Fact]
    public async Task Blocks_unknown_user()
    {
        using var ctx = TestDbContextFactory.Create();
        var gate = new VerificationGate(ctx);

        var result = await gate.CanTransactAsync(999999);

        Assert.False(result.Allowed);
    }
}
