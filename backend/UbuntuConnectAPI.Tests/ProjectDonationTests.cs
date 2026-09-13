using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using UbuntuConnectAPI.Controllers;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Models;
using UbuntuConnectAPI.Services.Verification;
using Xunit;

namespace UbuntuConnectAPI.Tests;

public class ProjectDonationTests
{
    private static User AddUser(AppDbContext ctx, string type, bool verified, decimal balance)
    {
        var u = new User
        {
            UserEmail = $"u{Guid.NewGuid():N}@test.local",
            PasswordHash = "hash",
            UserType = type,
            IsEmailVerified = verified,
            IsVerified = verified,
            IsActive = true,
            RegistrationDate = DateTime.UtcNow
        };
        ctx.Users.Add(u);
        ctx.SaveChanges();
        ctx.Wallets.Add(new Wallet { UserId = u.UserId, Balance = balance });
        ctx.SaveChanges();
        return u;
    }

    private static Project AddActiveFundraiser(AppDbContext ctx, out Npo npo, decimal target = 1000, decimal raised = 0)
    {
        var npoUser = AddUser(ctx, "NPO", verified: true, balance: 0);
        npo = new Npo { UserId = npoUser.UserId, NporegNum = "123-456-NPO", OrganizationName = "Org" };
        ctx.Npos.Add(npo);
        ctx.SaveChanges();
        var project = new Project
        {
            NpoId = npo.NpoId,
            ProjectName = "Build a Library",
            ProjectStatus = "Active",
            TargetAmount = target,
            RaisedAmount = raised,
            ProjectProgress = 0
        };
        ctx.Projects.Add(project);
        ctx.SaveChanges();
        return project;
    }

    private static NPOController Controller(AppDbContext ctx, int userId)
    {
        var controller = new NPOController(ctx, new VerificationGate(ctx));
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) }, "test");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
        return controller;
    }

    [Fact]
    public async Task Donation_increments_raised_amount_and_progress_atomically()
    {
        using var ctx = TestDbContextFactory.Create();
        var project = AddActiveFundraiser(ctx, out var npo, target: 1000, raised: 200);
        var donor = AddUser(ctx, "Individual", verified: true, balance: 500);
        var controller = Controller(ctx, donor.UserId);

        var result = await controller.DonateToProject(project.ProjectId, new TopUpRequest { Amount = 300 });

        Assert.IsType<OkObjectResult>(result);
        var updated = ctx.Projects.Single();
        Assert.Equal(500, updated.RaisedAmount);          // 200 + 300
        Assert.Equal(50, updated.ProjectProgress);        // 500/1000 = 50%
        // Funds moved donor -> NPO wallet.
        Assert.Equal(200, ctx.Wallets.Single(w => w.UserId == donor.UserId).Balance);
        Assert.Equal(300, ctx.Wallets.Single(w => w.UserId == npo.UserId).Balance);
        Assert.Single(ctx.Transactions);
    }

    [Fact]
    public async Task Donation_progress_caps_at_100()
    {
        using var ctx = TestDbContextFactory.Create();
        var project = AddActiveFundraiser(ctx, out _, target: 100, raised: 0);
        var donor = AddUser(ctx, "Individual", verified: true, balance: 500);
        var controller = Controller(ctx, donor.UserId);

        await controller.DonateToProject(project.ProjectId, new TopUpRequest { Amount = 250 });

        Assert.Equal(100, ctx.Projects.Single().ProjectProgress);
    }

    [Fact]
    public async Task Donation_blocked_for_unverified_user()
    {
        using var ctx = TestDbContextFactory.Create();
        var project = AddActiveFundraiser(ctx, out _);
        var donor = AddUser(ctx, "Individual", verified: false, balance: 500); // not verified
        var controller = Controller(ctx, donor.UserId);

        var result = await controller.DonateToProject(project.ProjectId, new TopUpRequest { Amount = 100 });

        var obj = Assert.IsType<ObjectResult>(result);
        Assert.Equal(403, obj.StatusCode);
        Assert.Empty(ctx.Transactions);
        Assert.Equal(0, ctx.Projects.Single().RaisedAmount);
    }

    [Fact]
    public async Task Donation_rejected_when_insufficient_balance()
    {
        using var ctx = TestDbContextFactory.Create();
        var project = AddActiveFundraiser(ctx, out _);
        var donor = AddUser(ctx, "Individual", verified: true, balance: 50);
        var controller = Controller(ctx, donor.UserId);

        var result = await controller.DonateToProject(project.ProjectId, new TopUpRequest { Amount = 100 });

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(0, ctx.Projects.Single().RaisedAmount);
    }
}
