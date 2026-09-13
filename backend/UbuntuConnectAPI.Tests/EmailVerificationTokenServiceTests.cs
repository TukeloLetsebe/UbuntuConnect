using Microsoft.EntityFrameworkCore;
using UbuntuConnectAPI.Models;
using UbuntuConnectAPI.Services.Email;
using Xunit;

namespace UbuntuConnectAPI.Tests;

public class EmailVerificationTokenServiceTests
{
    private static User SeedUser(UbuntuConnectAPI.Data.AppDbContext ctx)
    {
        var user = new User
        {
            UserEmail = $"user{Guid.NewGuid():N}@test.local",
            PasswordHash = "hash",
            UserType = "Individual",
            IsActive = true,
            IsVerified = false,
            RegistrationDate = DateTime.UtcNow
        };
        ctx.Users.Add(user);
        ctx.SaveChanges();
        return user;
    }

    [Fact]
    public async Task IssueAsync_generates_stores_and_returns_a_token()
    {
        using var ctx = TestDbContextFactory.Create();
        var user = SeedUser(ctx);
        var svc = new EmailVerificationTokenService(ctx);

        var token = await svc.IssueAsync(user.UserId);

        Assert.False(string.IsNullOrWhiteSpace(token.Token));
        Assert.Equal("EmailVerification", token.Purpose);
        Assert.Null(token.ConsumedAt);
        Assert.True(token.ExpiresAt > DateTime.UtcNow);

        var stored = await ctx.EmailVerificationTokens.SingleAsync();
        Assert.Equal(token.Token, stored.Token);
        Assert.Equal(user.UserId, stored.UserId);
    }

    [Fact]
    public async Task ValidateAsync_returns_token_for_valid_unconsumed_token()
    {
        using var ctx = TestDbContextFactory.Create();
        var user = SeedUser(ctx);
        var svc = new EmailVerificationTokenService(ctx);
        var issued = await svc.IssueAsync(user.UserId);

        var validated = await svc.ValidateAsync(issued.Token);

        Assert.NotNull(validated);
        Assert.Equal(issued.TokenId, validated!.TokenId);
    }

    [Fact]
    public async Task ValidateAsync_rejects_consumed_token()
    {
        using var ctx = TestDbContextFactory.Create();
        var user = SeedUser(ctx);
        var svc = new EmailVerificationTokenService(ctx);
        var issued = await svc.IssueAsync(user.UserId);

        await svc.ConsumeAsync(issued);
        var validated = await svc.ValidateAsync(issued.Token);

        Assert.Null(validated);
    }

    [Fact]
    public async Task ValidateAsync_rejects_expired_token()
    {
        using var ctx = TestDbContextFactory.Create();
        var user = SeedUser(ctx);
        var svc = new EmailVerificationTokenService(ctx);

        // Issue with a negative lifetime so it is already expired.
        var issued = await svc.IssueAsync(user.UserId, lifetime: TimeSpan.FromMinutes(-1));

        var validated = await svc.ValidateAsync(issued.Token);

        Assert.Null(validated);
    }

    [Fact]
    public async Task IssueAsync_invalidates_previous_unconsumed_tokens()
    {
        using var ctx = TestDbContextFactory.Create();
        var user = SeedUser(ctx);
        var svc = new EmailVerificationTokenService(ctx);

        var first = await svc.IssueAsync(user.UserId);
        var second = await svc.IssueAsync(user.UserId);

        // Old token no longer validates; new one does (resend behaviour).
        Assert.Null(await svc.ValidateAsync(first.Token));
        Assert.NotNull(await svc.ValidateAsync(second.Token));
    }

    [Fact]
    public async Task ValidateAsync_rejects_unknown_or_empty_token()
    {
        using var ctx = TestDbContextFactory.Create();
        var svc = new EmailVerificationTokenService(ctx);

        Assert.Null(await svc.ValidateAsync("does-not-exist"));
        Assert.Null(await svc.ValidateAsync(""));
    }
}
