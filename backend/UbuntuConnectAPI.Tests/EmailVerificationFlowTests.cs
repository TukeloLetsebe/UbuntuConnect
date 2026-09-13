using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using UbuntuConnectAPI.Controllers;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Services.Email;
using Xunit;

namespace UbuntuConnectAPI.Tests;

[Collection("EmailOutbox")]
public class EmailVerificationFlowTests
{
    private static AuthController MakeController(AppDbContext ctx)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "UbuntuConnect2026SuperSecretKeyThatIs64CharsLong!!SecureEnough!!",
                ["Jwt:Issuer"] = "UbuntuConnectAPI",
                ["Jwt:Audience"] = "UbuntuConnectFrontend",
                ["Jwt:ExpiryMinutes"] = "60"
            })
            .Build();
        return new AuthController(
            ctx, config,
            new MockEmailService(NullLogger<MockEmailService>.Instance),
            new EmailVerificationTokenService(ctx),
            Options.Create(new EmailOptions { FrontendBaseUrl = "http://localhost:5173" }));
    }

    private static RegisterRequest ValidIndividual(string? email = null) => new()
    {
        UserEmail = email ?? $"user{Guid.NewGuid():N}@test.local",
        Password = "password1",
        UserType = "Individual",
        FirstName = "Test",
        LastName = "User"
    };

    [Fact]
    public async Task Register_creates_user_unverified_and_issues_a_token()
    {
        using var ctx = TestDbContextFactory.Create();
        MockEmailService.Clear();
        var controller = MakeController(ctx);

        var dto = ValidIndividual();
        var result = await controller.Register(dto);

        Assert.IsType<OkObjectResult>(result);
        var user = Assert.Single(ctx.Users);
        Assert.False(user.IsEmailVerified);
        Assert.Single(ctx.EmailVerificationTokens);
        Assert.Contains(MockEmailService.SentMessages, m => m.ToEmail == dto.UserEmail && m.Body.Contains("verify-email?token="));
    }

    [Fact]
    public async Task VerifyEmail_with_valid_token_marks_verified_and_consumes_token()
    {
        using var ctx = TestDbContextFactory.Create();
        var controller = MakeController(ctx);
        await controller.Register(ValidIndividual());
        var token = ctx.EmailVerificationTokens.Single().Token;

        var result = await controller.VerifyEmail(new VerifyEmailRequest { Token = token });

        Assert.IsType<OkObjectResult>(result);
        Assert.True(ctx.Users.Single().IsEmailVerified);
        Assert.NotNull(ctx.EmailVerificationTokens.Single().ConsumedAt);
    }

    [Fact]
    public async Task VerifyEmail_rejects_invalid_token()
    {
        using var ctx = TestDbContextFactory.Create();
        var controller = MakeController(ctx);
        await controller.Register(ValidIndividual());

        var result = await controller.VerifyEmail(new VerifyEmailRequest { Token = "not-a-real-token" });

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.False(ctx.Users.Single().IsEmailVerified);
    }

    [Fact]
    public async Task VerifyEmail_rejects_reused_token()
    {
        using var ctx = TestDbContextFactory.Create();
        var controller = MakeController(ctx);
        await controller.Register(ValidIndividual());
        var token = ctx.EmailVerificationTokens.Single().Token;

        await controller.VerifyEmail(new VerifyEmailRequest { Token = token });
        var second = await controller.VerifyEmail(new VerifyEmailRequest { Token = token });

        Assert.IsType<BadRequestObjectResult>(second);
    }

    [Fact]
    public async Task ResendVerification_issues_a_new_token_for_unverified_user()
    {
        using var ctx = TestDbContextFactory.Create();
        var controller = MakeController(ctx);
        var dto = ValidIndividual();
        await controller.Register(dto);
        var firstToken = ctx.EmailVerificationTokens.Single().Token;
        MockEmailService.Clear();

        var result = await controller.ResendVerification(new ResendVerificationRequest { UserEmail = dto.UserEmail });

        Assert.IsType<OkObjectResult>(result);
        // Old token invalidated, a new unconsumed one exists.
        var tokens = ctx.EmailVerificationTokens.ToList();
        Assert.Contains(tokens, t => t.Token != firstToken && t.ConsumedAt == null);
        Assert.Contains(MockEmailService.SentMessages, m => m.ToEmail == dto.UserEmail);
    }

    [Fact]
    public async Task ResendVerification_is_silent_for_unknown_email()
    {
        using var ctx = TestDbContextFactory.Create();
        var controller = MakeController(ctx);

        var result = await controller.ResendVerification(new ResendVerificationRequest { UserEmail = "nobody@test.local" });

        Assert.IsType<OkObjectResult>(result); // does not reveal existence
    }
}
