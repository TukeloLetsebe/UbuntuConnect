using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using UbuntuConnectAPI.Controllers;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.Models;
using UbuntuConnectAPI.Services.Verification;
using Xunit;

namespace UbuntuConnectAPI.Tests;

public class NpoPublicProfileTests
{
    private static User AddUser(AppDbContext ctx, string type, bool verified, string? contact = null)
    {
        var u = new User
        {
            UserEmail = $"u{Guid.NewGuid():N}@test.local",
            UserContact = contact,
            PasswordHash = "hash",
            UserType = type,
            IsEmailVerified = verified,
            IsVerified = verified,
            IsActive = true,
            RegistrationDate = DateTime.UtcNow
        };
        ctx.Users.Add(u);
        ctx.SaveChanges();
        return u;
    }

    private static Npo AddNpo(AppDbContext ctx, out User npoUser)
    {
        npoUser = AddUser(ctx, "NPO", verified: true, contact: "0821234567");
        var npo = new Npo
        {
            UserId = npoUser.UserId,
            NporegNum = "123-456-NPO",
            OrganizationName = "Helping Hands",
            NpofocusArea = "Education",
            Npomission = "Educate all"
        };
        ctx.Npos.Add(npo);
        ctx.SaveChanges();
        return npo;
    }

    private static NPOController Controller(AppDbContext ctx, int? callerUserId)
    {
        var controller = new NPOController(ctx, new VerificationGate(ctx));
        var httpContext = new DefaultHttpContext();
        if (callerUserId.HasValue)
        {
            var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, callerUserId.Value.ToString()) }, "test");
            httpContext.User = new ClaimsPrincipal(identity);
        }
        controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        return controller;
    }

    // Reads a property from the anonymous response object.
    private static object? Prop(object obj, string name) =>
        obj.GetType().GetProperty(name)!.GetValue(obj);

    [Fact]
    public async Task Anonymous_viewer_does_not_see_contact()
    {
        using var ctx = TestDbContextFactory.Create();
        var npo = AddNpo(ctx, out _);

        var result = await Controller(ctx, null).GetPublicProfile(npo.NpoId);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.False((bool)Prop(ok.Value!, "contactVisible")!);
        Assert.Null(Prop(ok.Value!, "email"));
        Assert.Null(Prop(ok.Value!, "phone"));
    }

    [Fact]
    public async Task Unverified_viewer_does_not_see_contact()
    {
        using var ctx = TestDbContextFactory.Create();
        var npo = AddNpo(ctx, out _);
        var viewer = AddUser(ctx, "Individual", verified: false);

        var result = await Controller(ctx, viewer.UserId).GetPublicProfile(npo.NpoId);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.False((bool)Prop(ok.Value!, "contactVisible")!);
        Assert.Null(Prop(ok.Value!, "email"));
    }

    [Fact]
    public async Task Verified_viewer_sees_contact()
    {
        using var ctx = TestDbContextFactory.Create();
        var npo = AddNpo(ctx, out _);
        var viewer = AddUser(ctx, "Individual", verified: true);

        var result = await Controller(ctx, viewer.UserId).GetPublicProfile(npo.NpoId);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.True((bool)Prop(ok.Value!, "contactVisible")!);
        Assert.NotNull(Prop(ok.Value!, "email"));
        Assert.Equal("0821234567", Prop(ok.Value!, "phone"));
    }

    [Fact]
    public async Task Owner_sees_own_contact()
    {
        using var ctx = TestDbContextFactory.Create();
        var npo = AddNpo(ctx, out var npoUser);

        var result = await Controller(ctx, npoUser.UserId).GetPublicProfile(npo.NpoId);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.True((bool)Prop(ok.Value!, "contactVisible")!);
    }

    [Fact]
    public async Task Unknown_npo_returns_not_found()
    {
        using var ctx = TestDbContextFactory.Create();
        var result = await Controller(ctx, null).GetPublicProfile(999);
        Assert.IsType<NotFoundResult>(result);
    }
}
