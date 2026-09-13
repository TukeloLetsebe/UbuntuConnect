using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using UbuntuConnectAPI.Controllers;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Models;
using Xunit;

namespace UbuntuConnectAPI.Tests;

public class PartnershipAndDocsTests
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

    private static Npo AddNpo(AppDbContext ctx, out User npoUser)
    {
        npoUser = AddUser(ctx, "NPO");
        var npo = new Npo { UserId = npoUser.UserId, NporegNum = "123-456-NPO", OrganizationName = "Org" };
        ctx.Npos.Add(npo);
        ctx.SaveChanges();
        return npo;
    }

    private static PartnershipCampaign AddCampaign(AppDbContext ctx)
    {
        var bizUser = AddUser(ctx, "Business");
        var biz = new Business { UserId = bizUser.UserId, BusinessRegNum = "2026/123456/07" };
        ctx.Businesses.Add(biz);
        ctx.SaveChanges();
        var campaign = new PartnershipCampaign
        {
            BusinessId = biz.BusinessId,
            Title = "Green Drive",
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow)
        };
        ctx.PartnershipCampaigns.Add(campaign);
        ctx.SaveChanges();
        return campaign;
    }

    private static T WithClaims<T>(T controller, int userId, string role) where T : ControllerBase
    {
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
    public async Task Apply_without_reason_is_rejected()
    {
        using var ctx = TestDbContextFactory.Create();
        var npo = AddNpo(ctx, out var npoUser);
        var campaign = AddCampaign(ctx);
        var controller = WithClaims(new CampaignApplicationController(ctx), npoUser.UserId, "NPO");

        var result = await controller.Apply(campaign.CampaignId, new CampaignApplicationDto { Motivation = "   " });

        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Empty(ctx.CampaignApplications);
    }

    [Fact]
    public async Task Apply_with_reason_succeeds()
    {
        using var ctx = TestDbContextFactory.Create();
        var npo = AddNpo(ctx, out var npoUser);
        var campaign = AddCampaign(ctx);
        var controller = WithClaims(new CampaignApplicationController(ctx), npoUser.UserId, "NPO");

        var result = await controller.Apply(campaign.CampaignId, new CampaignApplicationDto { Motivation = "We align on sustainability." });

        Assert.IsType<OkObjectResult>(result);
        Assert.Single(ctx.CampaignApplications);
        Assert.Equal("We align on sustainability.", ctx.CampaignApplications.Single().Motivation);
    }

    [Fact]
    public async Task Business_can_view_npo_documents()
    {
        using var ctx = TestDbContextFactory.Create();
        var npo = AddNpo(ctx, out _);
        ctx.Verifications.Add(new Verification
        {
            NpoId = npo.NpoId,
            Npocertificate = "/uploads/documents/cert.pdf",
            NpotaxCertificate = "/uploads/documents/tax.pdf",
            Status = "Pending",
            SubmittedDate = DateTime.UtcNow
        });
        ctx.SaveChanges();
        var bizUser = AddUser(ctx, "Business");
        var controller = WithClaims(new VerificationController(ctx), bizUser.UserId, "Business");

        var result = await controller.GetNpoDocuments(npo.NpoId);

        var ok = Assert.IsType<OkObjectResult>(result);
        var val = ok.Value!;
        Assert.True((bool)val.GetType().GetProperty("hasDocuments")!.GetValue(val)!);
        Assert.Equal("/uploads/documents/cert.pdf", val.GetType().GetProperty("npoCertificate")!.GetValue(val));
    }

    [Fact]
    public async Task Npo_documents_returns_empty_when_none_submitted()
    {
        using var ctx = TestDbContextFactory.Create();
        var npo = AddNpo(ctx, out _);
        var bizUser = AddUser(ctx, "Business");
        var controller = WithClaims(new VerificationController(ctx), bizUser.UserId, "Business");

        var result = await controller.GetNpoDocuments(npo.NpoId);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.False((bool)ok.Value!.GetType().GetProperty("hasDocuments")!.GetValue(ok.Value!)!);
    }
}
