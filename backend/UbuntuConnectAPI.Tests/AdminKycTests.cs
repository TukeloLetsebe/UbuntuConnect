using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using UbuntuConnectAPI.Controllers;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.Models;
using UbuntuConnectAPI.Services.Email;
using UbuntuConnectAPI.Services.Notifications;
using Xunit;

namespace UbuntuConnectAPI.Tests;

[Collection("EmailOutbox")]
public class AdminKycTests
{
    private static (User user, Individual indiv) SeedPendingKyc(AppDbContext ctx)
    {
        var u = new User
        {
            UserEmail = $"i{Guid.NewGuid():N}@test.local",
            PasswordHash = "hash",
            UserType = "Individual",
            IsEmailVerified = true,
            IsVerified = false,
            IsActive = true,
            RegistrationDate = DateTime.UtcNow
        };
        ctx.Users.Add(u);
        ctx.SaveChanges();
        var i = new Individual
        {
            UserId = u.UserId,
            FirstName = "Test",
            LastName = "User",
            KycStatus = "Pending",
            KycRoute = "Admin",
            IdNumber = "9001015800089",
            IdDocumentUrl = "/uploads/images/id.jpg",
            SelfieUrl = "/uploads/images/selfie.jpg",
            SubmittedDate = DateTime.UtcNow
        };
        ctx.Individuals.Add(i);
        ctx.SaveChanges();
        return (u, i);
    }

    private static AdminKycController Controller(AppDbContext ctx, int adminId)
    {
        var controller = new AdminKycController(
            ctx,
            new NotificationService(ctx),
            new MockEmailService(NullLogger<MockEmailService>.Instance));
        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, adminId.ToString()),
            new Claim(ClaimTypes.Role, "Admin")
        }, "test");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
        return controller;
    }

    [Fact]
    public async Task Approve_verifies_user_and_notifies()
    {
        using var ctx = TestDbContextFactory.Create();
        var (user, indiv) = SeedPendingKyc(ctx);
        MockEmailService.Clear();
        var controller = Controller(ctx, adminId: 999);

        var result = await controller.Approve(indiv.IndividualId);

        Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Approved", ctx.Individuals.Single().KycStatus);
        Assert.True(ctx.Users.Single(u => u.UserId == user.UserId).IsVerified);
        Assert.Contains(ctx.Notifications, n => n.UserId == user.UserId && n.Type == "KycApproved");
        Assert.Contains(MockEmailService.SentMessages, m => m.ToEmail == user.UserEmail);
    }

    [Fact]
    public async Task Reject_keeps_user_unverified_and_notifies()
    {
        using var ctx = TestDbContextFactory.Create();
        var (user, indiv) = SeedPendingKyc(ctx);
        MockEmailService.Clear();
        var controller = Controller(ctx, adminId: 999);

        var result = await controller.Reject(indiv.IndividualId, new RejectKycRequest { Reason = "Blurry ID" });

        Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Rejected", ctx.Individuals.Single().KycStatus);
        Assert.False(ctx.Users.Single(u => u.UserId == user.UserId).IsVerified);
        Assert.Contains(ctx.Notifications, n => n.UserId == user.UserId && n.Type == "KycRejected");
        Assert.Contains(MockEmailService.SentMessages, m => m.ToEmail == user.UserEmail);
    }

    [Fact]
    public async Task Cannot_approve_non_pending_submission()
    {
        using var ctx = TestDbContextFactory.Create();
        var (_, indiv) = SeedPendingKyc(ctx);
        indiv.KycStatus = "Approved";
        ctx.SaveChanges();
        var controller = Controller(ctx, adminId: 999);

        var result = await controller.Approve(indiv.IndividualId);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task GetSubmissions_returns_pending_by_default()
    {
        using var ctx = TestDbContextFactory.Create();
        SeedPendingKyc(ctx);
        var controller = Controller(ctx, adminId: 999);

        var result = await controller.GetSubmissions() as OkObjectResult;

        Assert.NotNull(result);
        var items = Assert.IsAssignableFrom<System.Collections.IEnumerable>(result!.Value).Cast<object>().ToList();
        Assert.Single(items);
    }
}
