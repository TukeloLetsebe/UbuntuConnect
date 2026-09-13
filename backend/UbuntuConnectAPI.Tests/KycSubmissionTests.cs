using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using UbuntuConnectAPI.Controllers;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Models;
using UbuntuConnectAPI.Services.FaceVerification;
using UbuntuConnectAPI.Services.Verification;
using Xunit;

namespace UbuntuConnectAPI.Tests;

public class KycSubmissionTests
{
    // Fake face service to exercise the auto-approve path.
    private sealed class FakeFaceService : IFaceVerificationService
    {
        private readonly FaceMatchResult _result;
        public FakeFaceService(FaceMatchResult result) => _result = result;
        public bool IsEnabled => true;
        public Task<FaceMatchResult> CompareAsync(string a, string b, CancellationToken ct = default) => Task.FromResult(_result);
    }

    private static (User user, Individual indiv) SeedIndividual(AppDbContext ctx, bool emailVerified = true)
    {
        var u = new User
        {
            UserEmail = $"i{Guid.NewGuid():N}@test.local",
            PasswordHash = "hash",
            UserType = "Individual",
            IsEmailVerified = emailVerified,
            IsVerified = false,
            IsActive = true,
            RegistrationDate = DateTime.UtcNow
        };
        ctx.Users.Add(u);
        ctx.SaveChanges();
        var i = new Individual { UserId = u.UserId, FirstName = "Test", LastName = "User", KycStatus = "NotSubmitted" };
        ctx.Individuals.Add(i);
        ctx.SaveChanges();
        return (u, i);
    }

    private static IndividualController Controller(AppDbContext ctx, int userId, IFaceVerificationService? face = null)
    {
        var controller = new IndividualController(ctx, new VerificationGate(ctx), face ?? new NoOpFaceVerificationService());
        var identity = new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, "Individual")
        }, "test");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
        return controller;
    }

    private static SubmitKycRequest ValidReq(string route = "Admin") => new()
    {
        IdNumber = "9001015800089",
        IdDocumentUrl = "/uploads/images/id.jpg",
        SelfieUrl = "/uploads/images/selfie.jpg",
        Route = route
    };

    [Fact]
    public async Task Admin_route_submission_sets_pending()
    {
        using var ctx = TestDbContextFactory.Create();
        var (u, _) = SeedIndividual(ctx);
        var controller = Controller(ctx, u.UserId);

        var result = await controller.SubmitKyc(ValidReq("Admin"));

        Assert.IsType<OkObjectResult>(result);
        var indiv = ctx.Individuals.Single();
        Assert.Equal("Pending", indiv.KycStatus);
        Assert.Equal("Admin", indiv.KycRoute);
        Assert.False(ctx.Users.Single().IsVerified); // not verified until admin approves
    }

    [Fact]
    public async Task Missing_fields_rejected()
    {
        using var ctx = TestDbContextFactory.Create();
        var (u, _) = SeedIndividual(ctx);
        var controller = Controller(ctx, u.UserId);

        var req = ValidReq();
        req.SelfieUrl = "";
        var result = await controller.SubmitKyc(req);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Cannot_resubmit_while_pending()
    {
        using var ctx = TestDbContextFactory.Create();
        var (u, _) = SeedIndividual(ctx);
        var controller = Controller(ctx, u.UserId);

        await controller.SubmitKyc(ValidReq("Admin"));
        var second = await controller.SubmitKyc(ValidReq("Admin"));

        Assert.IsType<BadRequestObjectResult>(second);
    }

    [Fact]
    public async Task FaceScan_falls_back_to_pending_when_engine_disabled()
    {
        using var ctx = TestDbContextFactory.Create();
        var (u, _) = SeedIndividual(ctx);
        var controller = Controller(ctx, u.UserId); // NoOp face service (disabled)

        var result = await controller.SubmitKyc(ValidReq("FaceScan"));

        Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Pending", ctx.Individuals.Single().KycStatus);
        Assert.False(ctx.Users.Single().IsVerified);
    }

    [Fact]
    public async Task FaceScan_auto_approves_on_strong_match()
    {
        using var ctx = TestDbContextFactory.Create();
        var (u, _) = SeedIndividual(ctx);
        var face = new FakeFaceService(FaceMatchResult.Match(0.91));
        var controller = Controller(ctx, u.UserId, face);

        var result = await controller.SubmitKyc(ValidReq("FaceScan"));

        Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Approved", ctx.Individuals.Single().KycStatus);
        Assert.True(ctx.Users.Single().IsVerified); // fully verified now
    }

    [Fact]
    public async Task FaceScan_low_score_stays_pending()
    {
        using var ctx = TestDbContextFactory.Create();
        var (u, _) = SeedIndividual(ctx);
        var face = new FakeFaceService(FaceMatchResult.NoMatch(0.20, "faces do not match"));
        var controller = Controller(ctx, u.UserId, face);

        var result = await controller.SubmitKyc(ValidReq("FaceScan"));

        Assert.IsType<OkObjectResult>(result);
        Assert.Equal("Pending", ctx.Individuals.Single().KycStatus);
        Assert.False(ctx.Users.Single().IsVerified);
    }
}
