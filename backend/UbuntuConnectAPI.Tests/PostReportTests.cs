using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using UbuntuConnectAPI.Controllers;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Models;
using UbuntuConnectAPI.Services.Notifications;
using Xunit;

namespace UbuntuConnectAPI.Tests;

public class PostReportTests
{
    private static User SeedUser(AppDbContext ctx, string type = "Individual")
    {
        var u = new User
        {
            UserEmail = $"u{Guid.NewGuid():N}@test.local",
            PasswordHash = "hash",
            UserType = type,
            IsActive = true,
            RegistrationDate = DateTime.UtcNow
        };
        ctx.Users.Add(u);
        ctx.SaveChanges();
        return u;
    }

    private static Post SeedPost(AppDbContext ctx, int authorUserId)
    {
        var p = new Post
        {
            UserId = authorUserId,
            PostTitle = "Test Post",
            Content = "content",
            ActivityStatus = "Active",
            Timestamp = DateTime.UtcNow
        };
        ctx.Posts.Add(p);
        ctx.SaveChanges();
        return p;
    }

    private static PostReportController ControllerAs(AppDbContext ctx, int userId, string role = "Individual")
    {
        var controller = new PostReportController(ctx, new NotificationService(ctx));
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

    [Fact]
    public async Task User_can_report_a_post()
    {
        using var ctx = TestDbContextFactory.Create();
        var author = SeedUser(ctx, "NPO");
        var reporter = SeedUser(ctx);
        var post = SeedPost(ctx, author.UserId);

        var controller = ControllerAs(ctx, reporter.UserId);
        var result = await controller.Report(post.PostId, new ReportPostRequest { Reason = "Spam" });

        Assert.IsType<OkObjectResult>(result);
        Assert.Single(ctx.PostReports);
    }

    [Fact]
    public async Task Cannot_report_same_post_twice()
    {
        using var ctx = TestDbContextFactory.Create();
        var author = SeedUser(ctx, "NPO");
        var reporter = SeedUser(ctx);
        var post = SeedPost(ctx, author.UserId);
        var controller = ControllerAs(ctx, reporter.UserId);

        await controller.Report(post.PostId, new ReportPostRequest { Reason = "Spam" });
        var second = await controller.Report(post.PostId, new ReportPostRequest { Reason = "Spam again" });

        Assert.IsType<BadRequestObjectResult>(second);
        Assert.Single(ctx.PostReports);
    }

    [Fact]
    public async Task Cannot_report_own_post()
    {
        using var ctx = TestDbContextFactory.Create();
        var author = SeedUser(ctx, "NPO");
        var post = SeedPost(ctx, author.UserId);
        var controller = ControllerAs(ctx, author.UserId, "NPO");

        var result = await controller.Report(post.PostId, new ReportPostRequest { Reason = "self" });

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Empty(ctx.PostReports);
    }

    [Fact]
    public async Task Report_requires_a_reason()
    {
        using var ctx = TestDbContextFactory.Create();
        var author = SeedUser(ctx, "NPO");
        var reporter = SeedUser(ctx);
        var post = SeedPost(ctx, author.UserId);
        var controller = ControllerAs(ctx, reporter.UserId);

        var result = await controller.Report(post.PostId, new ReportPostRequest { Reason = "  " });

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Admin_dismiss_marks_report_dismissed()
    {
        using var ctx = TestDbContextFactory.Create();
        var author = SeedUser(ctx, "NPO");
        var reporter = SeedUser(ctx);
        var admin = SeedUser(ctx, "Admin");
        var post = SeedPost(ctx, author.UserId);
        await ControllerAs(ctx, reporter.UserId).Report(post.PostId, new ReportPostRequest { Reason = "Spam" });
        var reportId = ctx.PostReports.Single().ReportId;

        var adminController = ControllerAs(ctx, admin.UserId, "Admin");
        var result = await adminController.Dismiss(reportId);

        Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Dismissed", ctx.PostReports.Single().Status);
        Assert.Equal("Active", ctx.Posts.Single().ActivityStatus); // post untouched
    }

    [Fact]
    public async Task Admin_remove_post_soft_deletes_and_notifies_author()
    {
        using var ctx = TestDbContextFactory.Create();
        var author = SeedUser(ctx, "NPO");
        var reporter = SeedUser(ctx);
        var admin = SeedUser(ctx, "Admin");
        var post = SeedPost(ctx, author.UserId);
        await ControllerAs(ctx, reporter.UserId).Report(post.PostId, new ReportPostRequest { Reason = "Abuse" });
        var reportId = ctx.PostReports.Single().ReportId;

        var adminController = ControllerAs(ctx, admin.UserId, "Admin");
        var result = await adminController.RemovePost(reportId);

        Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Deleted", ctx.Posts.Single().ActivityStatus);
        Assert.Equal("Reviewed", ctx.PostReports.Single().Status);
        // Author got a notification.
        Assert.Contains(ctx.Notifications, n => n.UserId == author.UserId && n.Type == "PostRemoved");
    }
}
