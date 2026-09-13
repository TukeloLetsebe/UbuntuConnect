using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using UbuntuConnectAPI.Controllers;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.Models;
using UbuntuConnectAPI.Services.Notifications;
using Xunit;

namespace UbuntuConnectAPI.Tests;

public class NotificationTests
{
    private static User SeedUser(AppDbContext ctx, string type = "Individual")
    {
        var user = new User
        {
            UserEmail = $"user{Guid.NewGuid():N}@test.local",
            PasswordHash = "hash",
            UserType = type,
            IsActive = true,
            RegistrationDate = DateTime.UtcNow
        };
        ctx.Users.Add(user);
        ctx.SaveChanges();
        return user;
    }

    private static NotificationController ControllerAs(AppDbContext ctx, int userId)
    {
        var controller = new NotificationController(ctx);
        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        }, "test");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
        return controller;
    }

    [Fact]
    public async Task CreateAsync_persists_an_unread_notification()
    {
        using var ctx = TestDbContextFactory.Create();
        var user = SeedUser(ctx);
        var svc = new NotificationService(ctx);

        var n = await svc.CreateAsync(user.UserId, "VolunteerAccepted", "You were accepted!", relatedEntityId: 42);

        Assert.False(n.IsRead);
        Assert.Equal("VolunteerAccepted", n.Type);
        Assert.Equal(42, n.RelatedEntityId);
        Assert.Single(ctx.Notifications);
    }

    [Fact]
    public async Task GetMine_returns_only_callers_notifications_newest_first()
    {
        using var ctx = TestDbContextFactory.Create();
        var me = SeedUser(ctx);
        var other = SeedUser(ctx);
        var svc = new NotificationService(ctx);

        await svc.CreateAsync(me.UserId, "A", "first");
        await Task.Delay(5);
        await svc.CreateAsync(me.UserId, "B", "second");
        await svc.CreateAsync(other.UserId, "C", "not mine");

        var controller = ControllerAs(ctx, me.UserId);
        var result = await controller.GetMine() as OkObjectResult;

        Assert.NotNull(result);
        var items = Assert.IsAssignableFrom<System.Collections.IEnumerable>(result!.Value).Cast<object>().ToList();
        Assert.Equal(2, items.Count);
    }

    [Fact]
    public async Task GetUnreadCount_counts_only_unread_for_caller()
    {
        using var ctx = TestDbContextFactory.Create();
        var me = SeedUser(ctx);
        var svc = new NotificationService(ctx);
        var a = await svc.CreateAsync(me.UserId, "A", "one");
        await svc.CreateAsync(me.UserId, "B", "two");

        // Mark one read directly.
        a.IsRead = true;
        ctx.SaveChanges();

        var controller = ControllerAs(ctx, me.UserId);
        var result = await controller.GetUnreadCount() as OkObjectResult;

        Assert.NotNull(result);
        var count = (int)result!.Value!.GetType().GetProperty("count")!.GetValue(result.Value)!;
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task MarkRead_flips_unread_to_read()
    {
        using var ctx = TestDbContextFactory.Create();
        var me = SeedUser(ctx);
        var svc = new NotificationService(ctx);
        var n = await svc.CreateAsync(me.UserId, "A", "one");

        var controller = ControllerAs(ctx, me.UserId);
        var result = await controller.MarkRead(n.NotificationId);

        Assert.IsType<OkObjectResult>(result);
        Assert.True(ctx.Notifications.Single().IsRead);
    }

    [Fact]
    public async Task MarkRead_forbids_marking_another_users_notification()
    {
        using var ctx = TestDbContextFactory.Create();
        var owner = SeedUser(ctx);
        var attacker = SeedUser(ctx);
        var svc = new NotificationService(ctx);
        var n = await svc.CreateAsync(owner.UserId, "A", "one");

        var controller = ControllerAs(ctx, attacker.UserId);
        var result = await controller.MarkRead(n.NotificationId);

        Assert.IsType<ForbidResult>(result);
        Assert.False(ctx.Notifications.Single().IsRead);
    }

    [Fact]
    public async Task MarkAllRead_marks_every_unread_for_caller()
    {
        using var ctx = TestDbContextFactory.Create();
        var me = SeedUser(ctx);
        var svc = new NotificationService(ctx);
        await svc.CreateAsync(me.UserId, "A", "one");
        await svc.CreateAsync(me.UserId, "B", "two");

        var controller = ControllerAs(ctx, me.UserId);
        await controller.MarkAllRead();

        Assert.All(ctx.Notifications.ToList(), n => Assert.True(n.IsRead));
    }
}
