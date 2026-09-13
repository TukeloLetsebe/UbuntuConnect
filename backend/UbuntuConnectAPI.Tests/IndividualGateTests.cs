using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using UbuntuConnectAPI.Controllers;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Models;
using UbuntuConnectAPI.Services.Verification;
using UbuntuConnectAPI.Services.FaceVerification;
using Xunit;

namespace UbuntuConnectAPI.Tests;

public class IndividualGateTests
{
    private static User AddIndividual(AppDbContext ctx, bool emailVerified, bool idVerified)
    {
        var u = new User
        {
            UserEmail = $"i{Guid.NewGuid():N}@test.local",
            PasswordHash = "hash",
            UserType = "Individual",
            IsEmailVerified = emailVerified,
            IsVerified = idVerified,
            IsActive = true,
            RegistrationDate = DateTime.UtcNow
        };
        ctx.Users.Add(u);
        ctx.SaveChanges();
        ctx.Wallets.Add(new Wallet { UserId = u.UserId, Balance = 1000 });
        ctx.SaveChanges();
        return u;
    }

    private static Npo AddNpoWithWallet(AppDbContext ctx)
    {
        var npoUser = new User
        {
            UserEmail = $"npo{Guid.NewGuid():N}@test.local",
            PasswordHash = "hash",
            UserType = "NPO",
            IsEmailVerified = true,
            IsVerified = true,
            IsActive = true,
            RegistrationDate = DateTime.UtcNow
        };
        ctx.Users.Add(npoUser);
        ctx.SaveChanges();
        ctx.Wallets.Add(new Wallet { UserId = npoUser.UserId, Balance = 0 });
        var npo = new Npo { UserId = npoUser.UserId, NporegNum = "123-456-NPO", OrganizationName = "Org" };
        ctx.Npos.Add(npo);
        ctx.SaveChanges();
        return npo;
    }

    private static IndividualController ControllerAs(AppDbContext ctx, int userId)
    {
        var controller = new IndividualController(ctx, new VerificationGate(ctx), new NoOpFaceVerificationService());
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) }, "test");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
        return controller;
    }

    [Fact]
    public async Task Donate_blocked_for_unverified_individual()
    {
        using var ctx = TestDbContextFactory.Create();
        var indiv = AddIndividual(ctx, emailVerified: true, idVerified: false); // not KYC verified
        var npo = AddNpoWithWallet(ctx);
        var controller = ControllerAs(ctx, indiv.UserId);

        var result = await controller.Donate(npo.NpoId, new DonateDto { Amount = 100 });

        var obj = Assert.IsType<ObjectResult>(result);
        Assert.Equal(403, obj.StatusCode);
        // No transaction recorded.
        Assert.Empty(ctx.Transactions);
    }

    [Fact]
    public async Task Donate_allowed_for_fully_verified_individual()
    {
        using var ctx = TestDbContextFactory.Create();
        var indiv = AddIndividual(ctx, emailVerified: true, idVerified: true);
        var npo = AddNpoWithWallet(ctx);
        var controller = ControllerAs(ctx, indiv.UserId);

        var result = await controller.Donate(npo.NpoId, new DonateDto { Amount = 100 });

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task TopUp_blocked_for_unverified_individual()
    {
        using var ctx = TestDbContextFactory.Create();
        var indiv = AddIndividual(ctx, emailVerified: false, idVerified: false);
        var controller = ControllerAs(ctx, indiv.UserId);

        var result = await controller.TopUp(new TopUpRequest { Amount = 50 });

        var obj = Assert.IsType<ObjectResult>(result);
        Assert.Equal(403, obj.StatusCode);
    }
}
