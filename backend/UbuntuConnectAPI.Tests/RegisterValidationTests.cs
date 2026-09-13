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

public class RegisterValidationTests
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
        var emailService = new MockEmailService(NullLogger<MockEmailService>.Instance);
        var tokenService = new EmailVerificationTokenService(ctx);
        var emailOptions = Options.Create(new EmailOptions());
        return new AuthController(ctx, config, emailService, tokenService, emailOptions);
    }

    private static RegisterRequest ValidIndividual() => new()
    {
        UserEmail = $"user{Guid.NewGuid():N}@test.local",
        Password = "password1",
        UserType = "Individual",
        FirstName = "Test",
        LastName = "User"
    };

    [Fact]
    public async Task Register_rejects_weak_password()
    {
        using var ctx = TestDbContextFactory.Create();
        var controller = MakeController(ctx);
        var dto = ValidIndividual();
        dto.Password = "weak"; // < 8, no digit

        var result = await controller.Register(dto);

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Empty(ctx.Users);
    }

    [Fact]
    public async Task Register_rejects_password_without_digit()
    {
        using var ctx = TestDbContextFactory.Create();
        var controller = MakeController(ctx);
        var dto = ValidIndividual();
        dto.Password = "onlyletters";

        var result = await controller.Register(dto);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Register_rejects_invalid_email()
    {
        using var ctx = TestDbContextFactory.Create();
        var controller = MakeController(ctx);
        var dto = ValidIndividual();
        dto.UserEmail = "not-an-email";

        var result = await controller.Register(dto);

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Empty(ctx.Users);
    }

    [Fact]
    public async Task Register_accepts_valid_strong_password_and_email()
    {
        using var ctx = TestDbContextFactory.Create();
        var controller = MakeController(ctx);
        var dto = ValidIndividual();

        var result = await controller.Register(dto);

        Assert.IsType<OkObjectResult>(result);
        Assert.Single(ctx.Users);
    }

    [Fact]
    public async Task Register_rejects_invalid_phone_when_provided()
    {
        using var ctx = TestDbContextFactory.Create();
        var controller = MakeController(ctx);
        var dto = ValidIndividual();
        dto.UserContact = "12345"; // invalid

        var result = await controller.Register(dto);

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Empty(ctx.Users);
    }

    [Fact]
    public async Task Register_rejects_npo_with_bad_registration_number()
    {
        using var ctx = TestDbContextFactory.Create();
        var controller = MakeController(ctx);

        var result = await controller.Register(new RegisterRequest
        {
            UserEmail = $"npo{Guid.NewGuid():N}@test.local",
            Password = "password1",
            UserType = "NPO",
            OrganizationName = "Test Org",
            NpoRegNum = "not-valid"
        });

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Empty(ctx.Users);
    }

    [Fact]
    public async Task Register_accepts_npo_with_valid_registration_number()
    {
        using var ctx = TestDbContextFactory.Create();
        var controller = MakeController(ctx);

        var result = await controller.Register(new RegisterRequest
        {
            UserEmail = $"npo{Guid.NewGuid():N}@test.local",
            Password = "password1",
            UserType = "NPO",
            OrganizationName = "Test Org",
            NpoRegNum = "123-456-NPO"
        });

        Assert.IsType<OkObjectResult>(result);
        Assert.Single(ctx.Users);
    }

    [Fact]
    public async Task Register_rejects_business_with_bad_cipc_number()
    {
        using var ctx = TestDbContextFactory.Create();
        var controller = MakeController(ctx);

        var result = await controller.Register(new RegisterRequest
        {
            UserEmail = $"biz{Guid.NewGuid():N}@test.local",
            Password = "password1",
            UserType = "Business",
            BusinessRegNum = "12345"
        });

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Empty(ctx.Users);
    }

    [Fact]
    public async Task Register_accepts_business_with_valid_cipc_number()
    {
        using var ctx = TestDbContextFactory.Create();
        var controller = MakeController(ctx);

        var result = await controller.Register(new RegisterRequest
        {
            UserEmail = $"biz{Guid.NewGuid():N}@test.local",
            Password = "password1",
            UserType = "Business",
            BusinessRegNum = "2026/123456/07"
        });

        Assert.IsType<OkObjectResult>(result);
        Assert.Single(ctx.Users);
    }
}
