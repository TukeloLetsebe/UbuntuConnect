using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using UbuntuConnectAPI.Controllers;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.Models;
using Xunit;

namespace UbuntuConnectAPI.Tests;

public class ReportSummaryTests
{
    private static User AddUser(AppDbContext ctx, string type)
    {
        var u = new User
        {
            UserEmail = $"u{Guid.NewGuid():N}@test.local",
            PasswordHash = "hash",
            UserType = type,
            IsEmailVerified = true,
            IsVerified = true,
            IsActive = true,
            RegistrationDate = DateTime.UtcNow
        };
        ctx.Users.Add(u);
        ctx.SaveChanges();
        return u;
    }

    private static ReportController Controller(AppDbContext ctx, int userId, string role)
    {
        var controller = new ReportController(ctx);
        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        }, "test");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
        return controller;
    }

    private static object? Prop(object obj, string name) => obj.GetType().GetProperty(name)!.GetValue(obj);

    [Fact]
    public async Task Npo_summary_totals_completed_incoming_donations()
    {
        using var ctx = TestDbContextFactory.Create();
        var npoUser = AddUser(ctx, "NPO");
        ctx.Npos.Add(new Npo { UserId = npoUser.UserId, NporegNum = "123-456-NPO", OrganizationName = "Org" });
        ctx.SaveChanges();
        var donor = AddUser(ctx, "Individual");
        ctx.Transactions.Add(new Transaction { SenderUserId = donor.UserId, ReceiverUserId = npoUser.UserId, Amount = 300, TransactionType = "Donation", Status = "Completed", Timestamp = DateTime.UtcNow });
        ctx.Transactions.Add(new Transaction { SenderUserId = donor.UserId, ReceiverUserId = npoUser.UserId, Amount = 100, TransactionType = "Donation", Status = "Failed", Timestamp = DateTime.UtcNow });
        ctx.SaveChanges();

        var result = await Controller(ctx, npoUser.UserId, "NPO").NpoSummary();

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(300m, (decimal)Prop(ok.Value!, "totalReceived")!);
        Assert.Equal(1, (int)Prop(ok.Value!, "donationCount")!);
    }

    [Fact]
    public async Task Business_summary_totals_completed_outgoing()
    {
        using var ctx = TestDbContextFactory.Create();
        var bizUser = AddUser(ctx, "Business");
        ctx.Businesses.Add(new Business { UserId = bizUser.UserId, BusinessRegNum = "2026/123456/07" });
        ctx.SaveChanges();
        var npoUser = AddUser(ctx, "NPO");
        ctx.Transactions.Add(new Transaction { SenderUserId = bizUser.UserId, ReceiverUserId = npoUser.UserId, Amount = 500, TransactionType = "CampaignContribution", Status = "Completed", Timestamp = DateTime.UtcNow });
        ctx.SaveChanges();

        var result = await Controller(ctx, bizUser.UserId, "Business").BusinessSummary();

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(500m, (decimal)Prop(ok.Value!, "totalDonated")!);
        Assert.Equal(1, (int)Prop(ok.Value!, "nposSupported")!);
    }

    [Fact]
    public async Task Admin_summary_reports_platform_totals()
    {
        using var ctx = TestDbContextFactory.Create();
        var admin = AddUser(ctx, "Admin");
        AddUser(ctx, "Individual");
        var npoUser = AddUser(ctx, "NPO");
        ctx.Npos.Add(new Npo { UserId = npoUser.UserId, NporegNum = "123-456-NPO", OrganizationName = "Org" });
        ctx.SaveChanges();
        ctx.Projects.Add(new Project { NpoId = ctx.Npos.Single().NpoId, ProjectName = "P", ProjectStatus = "Active", TargetAmount = 1000, RaisedAmount = 100 });
        ctx.Transactions.Add(new Transaction { SenderUserId = null, ReceiverUserId = npoUser.UserId, Amount = 250, TransactionType = "Donation", Status = "Completed", Timestamp = DateTime.UtcNow });
        ctx.SaveChanges();

        var result = await Controller(ctx, admin.UserId, "Admin").AdminSummary();

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(3, (int)Prop(ok.Value!, "totalUsers")!);
        Assert.Equal(1, (int)Prop(ok.Value!, "activeFundraisers")!);
        Assert.Equal(250m, (decimal)Prop(ok.Value!, "totalDonated")!);
    }
}
