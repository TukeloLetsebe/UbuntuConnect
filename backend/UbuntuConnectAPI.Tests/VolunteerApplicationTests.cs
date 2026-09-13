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
public class VolunteerApplicationTests
{
    private static User AddUser(AppDbContext ctx, string type, string email)
    {
        var u = new User
        {
            UserEmail = email,
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

    // Creates an NPO with one opportunity and one pending application, returns the app.
    private static (VolunteerApplication app, User npoUser, User applicant) Seed(AppDbContext ctx)
    {
        var npoUser = AddUser(ctx, "NPO", $"npo{Guid.NewGuid():N}@test.local");
        var npo = new Npo { UserId = npoUser.UserId, NporegNum = "123-456-NPO", OrganizationName = "Helping Hands" };
        ctx.Npos.Add(npo);
        ctx.SaveChanges();

        var opp = new VolunteerOpportunity { NpoId = npo.NpoId, RoleTitle = "Youth Mentor", NumOfPositions = 2 };
        ctx.VolunteerOpportunities.Add(opp);
        ctx.SaveChanges();

        var applicant = AddUser(ctx, "Individual", $"vol{Guid.NewGuid():N}@test.local");
        var app = new VolunteerApplication
        {
            UserId = applicant.UserId,
            OpportunityId = opp.OpportunityId,
            FirstName = "Thabo",
            LastName = "M",
            Email = applicant.UserEmail,
            Status = "Pending",
            ApplicationDate = DateTime.UtcNow
        };
        ctx.VolunteerApplications.Add(app);
        ctx.SaveChanges();
        return (app, npoUser, applicant);
    }

    private static VolunteerApplicationController Controller(AppDbContext ctx, int npoUserId)
    {
        var controller = new VolunteerApplicationController(
            ctx,
            new NotificationService(ctx),
            new MockEmailService(NullLogger<MockEmailService>.Instance));
        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, npoUserId.ToString()),
            new Claim(ClaimTypes.Role, "NPO")
        }, "test");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
        return controller;
    }

    [Fact]
    public async Task Accept_sets_status_notifies_and_emails_applicant()
    {
        using var ctx = TestDbContextFactory.Create();
        MockEmailService.Clear();
        var (app, npoUser, applicant) = Seed(ctx);

        var result = await Controller(ctx, npoUser.UserId).Accept(app.ApplicationId);

        Assert.IsType<NoContentResult>(result);
        Assert.Equal("Accepted", ctx.VolunteerApplications.Single().Status);
        Assert.Single(ctx.Notifications.Where(n => n.UserId == applicant.UserId && n.Type == "VolunteerAccepted"));
        Assert.Contains(MockEmailService.SentMessages, m => m.ToEmail == applicant.UserEmail);
    }

    [Fact]
    public async Task Reject_sets_status_notifies_and_emails_applicant()
    {
        using var ctx = TestDbContextFactory.Create();
        MockEmailService.Clear();
        var (app, npoUser, applicant) = Seed(ctx);

        var result = await Controller(ctx, npoUser.UserId).Reject(app.ApplicationId);

        Assert.IsType<NoContentResult>(result);
        Assert.Equal("Rejected", ctx.VolunteerApplications.Single().Status);
        Assert.Single(ctx.Notifications.Where(n => n.UserId == applicant.UserId && n.Type == "VolunteerRejected"));
        Assert.Contains(MockEmailService.SentMessages, m => m.ToEmail == applicant.UserEmail);
    }

    [Fact]
    public async Task Accept_by_other_npo_is_forbidden_and_status_unchanged()
    {
        using var ctx = TestDbContextFactory.Create();
        var (app, _, _) = Seed(ctx);
        var otherNpoUser = AddUser(ctx, "NPO", $"other{Guid.NewGuid():N}@test.local");
        ctx.Npos.Add(new Npo { UserId = otherNpoUser.UserId, NporegNum = "999-999-NPO", OrganizationName = "Other" });
        ctx.SaveChanges();

        var result = await Controller(ctx, otherNpoUser.UserId).Accept(app.ApplicationId);

        Assert.IsType<ForbidResult>(result);
        Assert.Equal("Pending", ctx.VolunteerApplications.Single().Status);
    }
}
