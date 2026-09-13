using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using UbuntuConnectAPI.Controllers;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Services.Admin;
using UbuntuConnectAPI.Services.Email;
using Xunit;

namespace UbuntuConnectAPI.Tests;

public class AdminSeedingTests
{
    private static AuthController MakeAuthController(AppDbContext ctx)
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "UbuntuConnect2026SuperSecretKeyThatIs64CharsLong!!SecureEnough!!",
            ["Jwt:Issuer"] = "UbuntuConnectAPI",
            ["Jwt:Audience"] = "UbuntuConnectFrontend",
            ["Jwt:ExpiryMinutes"] = "60"
        }).Build();
        return new AuthController(
            ctx, config,
            new MockEmailService(NullLogger<MockEmailService>.Instance),
            new EmailVerificationTokenService(ctx),
            Options.Create(new EmailOptions()));
    }

    [Fact]
    public async Task Register_rejects_Admin_user_type()
    {
        using var ctx = TestDbContextFactory.Create();
        var controller = MakeAuthController(ctx);

        var result = await controller.Register(new RegisterRequest
        {
            UserEmail = "sneaky@test.local",
            Password = "password1",
            UserType = "Admin"
        });

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Empty(ctx.Users);
    }

    // Builds a seeder whose scope resolves the SAME in-memory context instance.
    private static AdminSeeder MakeSeeder(AppDbContext ctx, AdminSeedOptions opts)
    {
        var provider = new SingleContextProvider(ctx);
        return new AdminSeeder(provider, Options.Create(opts), NullLogger<AdminSeeder>.Instance);
    }

    [Fact]
    public async Task Seeder_does_nothing_when_disabled()
    {
        using var ctx = TestDbContextFactory.Create();
        var seeder = MakeSeeder(ctx, new AdminSeedOptions { Enabled = false, Email = "a@b.com", Password = "password1" });

        await seeder.StartAsync(default);

        Assert.Empty(ctx.Users);
    }

    [Fact]
    public async Task Seeder_creates_admin_when_enabled()
    {
        using var ctx = TestDbContextFactory.Create();
        var seeder = MakeSeeder(ctx, new AdminSeedOptions { Enabled = true, Email = "admin@ubuntu.local", Password = "password1" });

        await seeder.StartAsync(default);

        var admin = Assert.Single(ctx.Users);
        Assert.Equal("Admin", admin.UserType);
        Assert.True(admin.IsVerified);
        Assert.True(admin.IsEmailVerified);
        Assert.Single(ctx.Wallets);
        Assert.Single(ctx.Profiles);
    }

    [Fact]
    public async Task Seeder_is_idempotent()
    {
        using var ctx = TestDbContextFactory.Create();
        var opts = new AdminSeedOptions { Enabled = true, Email = "admin@ubuntu.local", Password = "password1" };

        await MakeSeeder(ctx, opts).StartAsync(default);
        await MakeSeeder(ctx, opts).StartAsync(default);

        Assert.Single(ctx.Users); // not duplicated
    }

    [Fact]
    public async Task Seeder_skips_when_credentials_invalid()
    {
        using var ctx = TestDbContextFactory.Create();
        var seeder = MakeSeeder(ctx, new AdminSeedOptions { Enabled = true, Email = "bad", Password = "weak" });

        await seeder.StartAsync(default);

        Assert.Empty(ctx.Users);
    }

    // Minimal IServiceProvider that returns the given AppDbContext for any scope.
    private sealed class SingleContextProvider : IServiceProvider, IServiceScopeFactory, IServiceScope
    {
        private readonly AppDbContext _ctx;
        public SingleContextProvider(AppDbContext ctx) => _ctx = ctx;

        public object? GetService(Type serviceType)
        {
            if (serviceType == typeof(AppDbContext)) return _ctx;
            if (serviceType == typeof(IServiceScopeFactory)) return this;
            return null;
        }

        public IServiceScope CreateScope() => this;
        public IServiceProvider ServiceProvider => this;
        public void Dispose() { /* context disposed by the test */ }
    }
}
