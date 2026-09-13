using Microsoft.Extensions.Logging.Abstractions;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.Models;
using UbuntuConnectAPI.Services.Fundraisers;
using UbuntuConnectAPI.Services.Notifications;
using Xunit;

namespace UbuntuConnectAPI.Tests;

public class FundraiserAutoCloseTests
{
    private static FundraiserAutoCloseService MakeService(AppDbContext ctx) =>
        new(ctx, new NotificationService(ctx), NullLogger<FundraiserAutoCloseService>.Instance);

    private static Npo AddNpo(AppDbContext ctx)
    {
        var user = new User
        {
            UserEmail = $"npo{Guid.NewGuid():N}@test.local",
            PasswordHash = "hash",
            UserType = "NPO",
            IsEmailVerified = true,
            IsVerified = true,
            IsActive = true,
            RegistrationDate = DateTime.UtcNow
        };
        ctx.Users.Add(user);
        ctx.SaveChanges();
        var npo = new Npo { UserId = user.UserId, NporegNum = "123-456-NPO", OrganizationName = "Org" };
        ctx.Npos.Add(npo);
        ctx.SaveChanges();
        return npo;
    }

    private static Project AddProject(AppDbContext ctx, Npo npo, string status,
        decimal target, decimal raised, DateTime? endDate)
    {
        var p = new Project
        {
            NpoId = npo.NpoId,
            ProjectName = "Campaign",
            ProjectStatus = status,
            TargetAmount = target,
            RaisedAmount = raised,
            ProjectProgress = target > 0 ? Math.Min(100, raised / target * 100) : 0,
            EndDate = endDate
        };
        ctx.Projects.Add(p);
        ctx.SaveChanges();
        return p;
    }

    [Fact]
    public async Task Closes_fundraiser_past_its_end_date()
    {
        using var ctx = TestDbContextFactory.Create();
        var npo = AddNpo(ctx);
        var p = AddProject(ctx, npo, "Active", target: 1000, raised: 100,
            endDate: DateTime.UtcNow.AddDays(-1));

        var closed = await MakeService(ctx).RunAsync();

        Assert.Equal(1, closed);
        Assert.Equal("Completed", ctx.Projects.Single().ProjectStatus);
        Assert.Single(ctx.Notifications.Where(n => n.UserId == npo.UserId));
    }

    [Fact]
    public async Task Closes_fundraiser_that_met_its_target()
    {
        using var ctx = TestDbContextFactory.Create();
        var npo = AddNpo(ctx);
        AddProject(ctx, npo, "Active", target: 1000, raised: 1000, endDate: null);

        var closed = await MakeService(ctx).RunAsync();

        Assert.Equal(1, closed);
        Assert.Equal("Completed", ctx.Projects.Single().ProjectStatus);
    }

    [Fact]
    public async Task Leaves_active_fundraiser_with_future_deadline_and_unmet_target_open()
    {
        using var ctx = TestDbContextFactory.Create();
        var npo = AddNpo(ctx);
        AddProject(ctx, npo, "Active", target: 1000, raised: 100,
            endDate: DateTime.UtcNow.AddDays(30));

        var closed = await MakeService(ctx).RunAsync();

        Assert.Equal(0, closed);
        Assert.Equal("Active", ctx.Projects.Single().ProjectStatus);
        Assert.Empty(ctx.Notifications);
    }

    [Fact]
    public async Task Ignores_non_active_fundraisers()
    {
        using var ctx = TestDbContextFactory.Create();
        var npo = AddNpo(ctx);
        AddProject(ctx, npo, "Planning", target: 1000, raised: 1000,
            endDate: DateTime.UtcNow.AddDays(-5));

        var closed = await MakeService(ctx).RunAsync();

        Assert.Equal(0, closed);
        Assert.Equal("Planning", ctx.Projects.Single().ProjectStatus);
    }

    [Fact]
    public async Task Donation_reaching_target_auto_completes_and_notifies()
    {
        using var ctx = TestDbContextFactory.Create();
        var npo = AddNpo(ctx);
        var project = AddProject(ctx, npo, "Active", target: 500, raised: 400, endDate: null);

        // Donor with enough balance to finish the goal.
        var donorUser = new User
        {
            UserEmail = $"d{Guid.NewGuid():N}@test.local",
            PasswordHash = "hash",
            UserType = "Individual",
            IsEmailVerified = true,
            IsVerified = true,
            IsActive = true,
            RegistrationDate = DateTime.UtcNow
        };
        ctx.Users.Add(donorUser);
        ctx.SaveChanges();
        ctx.Wallets.Add(new Wallet { UserId = donorUser.UserId, Balance = 500 });
        ctx.Wallets.Add(new Wallet { UserId = npo.UserId, Balance = 0 });
        ctx.SaveChanges();

        var controller = new UbuntuConnectAPI.Controllers.NPOController(
            ctx,
            new UbuntuConnectAPI.Services.Verification.VerificationGate(ctx),
            new NotificationService(ctx));
        var identity = new System.Security.Claims.ClaimsIdentity(
            new[] { new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, donorUser.UserId.ToString()) }, "test");
        controller.ControllerContext = new Microsoft.AspNetCore.Mvc.ControllerContext
        {
            HttpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext
            {
                User = new System.Security.Claims.ClaimsPrincipal(identity)
            }
        };

        var result = await controller.DonateToProject(project.ProjectId,
            new UbuntuConnectAPI.DTOs.Requests.TopUpRequest { Amount = 100 });

        Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(result);
        var updated = ctx.Projects.Single();
        Assert.Equal(500, updated.RaisedAmount);
        Assert.Equal("Completed", updated.ProjectStatus);
        Assert.Single(ctx.Notifications.Where(n => n.UserId == npo.UserId && n.Type == "FundraiserCompleted"));
    }
}
