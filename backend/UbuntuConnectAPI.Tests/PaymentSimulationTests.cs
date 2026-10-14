using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using UbuntuConnectAPI.Controllers;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.DTOs.Requests;
using UbuntuConnectAPI.Models;
using UbuntuConnectAPI.Services.FaceVerification;
using UbuntuConnectAPI.Services.Payments;
using UbuntuConnectAPI.Services.Verification;
using Xunit;

namespace UbuntuConnectAPI.Tests;

public class PaymentSimulationTests
{
    private static readonly PaymentSimulationService Sim = new();

    // Well-known Luhn-valid test PAN (Visa test number).
    private const string ValidCard = "4111 1111 1111 1111";

    // The gateway is a simulation but still validates card SHAPE (no real issuer
    // check): a Luhn-valid, 13–19 digit, non-expired card with a 3–4 digit CVV
    // is approved; anything malformed is declined with a specific reason.
    [Fact]
    public void Wellformed_card_is_approved()
    {
        var r = Sim.Charge(ValidCard, "12/40", "123");
        Assert.True(r.Approved);
    }

    [Theory]
    [InlineData("1", "12/40", "123")]                     // too short / not Luhn
    [InlineData("1234 5678 9012", "99/99", "1")]          // bad expiry + short CVV
    [InlineData("", "", "")]                               // empty
    [InlineData("4111 1111 1111 1111", "01/20", "123")]   // expired
    [InlineData("4111 1111 1111 1112", "12/40", "123")]   // fails Luhn
    public void Malformed_card_is_declined_with_reason(string card, string expiry, string cvv)
    {
        var r = Sim.Charge(card, expiry, cvv);
        Assert.False(r.Approved);
        Assert.False(string.IsNullOrWhiteSpace(r.DeclineReason));
    }

    // ── Individual top-up with card + limits ──────────────────

    private static (AppDbContext ctx, User user) SetupVerifiedIndividual(decimal balance = 0)
    {
        var ctx = TestDbContextFactory.Create();
        var user = new User
        {
            UserEmail = $"i{Guid.NewGuid():N}@test.local",
            PasswordHash = "hash",
            UserType = "Individual",
            IsEmailVerified = true,
            IsVerified = true,
            IsActive = true,
            RegistrationDate = DateTime.UtcNow
        };
        ctx.Users.Add(user);
        ctx.SaveChanges();
        ctx.Individuals.Add(new Individual { UserId = user.UserId, FirstName = "T", LastName = "U" });
        ctx.Wallets.Add(new Wallet { UserId = user.UserId, Balance = balance });
        ctx.SaveChanges();
        return (ctx, user);
    }

    private static IndividualController IndividualController(AppDbContext ctx, int userId, WalletLimitsOptions? limits = null)
    {
        var controller = new IndividualController(
            ctx,
            new VerificationGate(ctx),
            new NoOpFaceVerificationService(),
            new PaymentSimulationService(),
            Options.Create(limits ?? new WalletLimitsOptions()));
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

    [Fact]
    public async Task TopUp_with_valid_card_credits_wallet()
    {
        var (ctx, user) = SetupVerifiedIndividual();
        using (ctx)
        {
            var controller = IndividualController(ctx, user.UserId);
            var result = await controller.TopUp(new TopUpRequest
            {
                Amount = 500,
                CardNumber = ValidCard,
                CardExpiry = "12/40",
                CardCvv = "123"
            });
            Assert.IsType<OkObjectResult>(result);
            Assert.Equal(500, ctx.Wallets.Single(w => w.UserId == user.UserId).Balance);
        }
    }

    [Fact]
    public async Task TopUp_with_malformed_card_is_rejected()
    {
        // A junk card ("1234 5678 9012", bad expiry, 1-digit CVV) must be declined
        // and the wallet must NOT be credited.
        var (ctx, user) = SetupVerifiedIndividual();
        using (ctx)
        {
            var controller = IndividualController(ctx, user.UserId);
            var result = await controller.TopUp(new TopUpRequest
            {
                Amount = 500,
                CardNumber = "1234 5678 9012",
                CardExpiry = "99/99",
                CardCvv = "1"
            });
            Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal(0, ctx.Wallets.Single(w => w.UserId == user.UserId).Balance);
        }
    }

    [Fact]
    public async Task TopUp_above_max_limit_is_rejected()
    {
        var (ctx, user) = SetupVerifiedIndividual();
        using (ctx)
        {
            var controller = IndividualController(ctx, user.UserId, new WalletLimitsOptions { MaxTopUp = 1000 });
            var result = await controller.TopUp(new TopUpRequest { Amount = 5000 });
            Assert.IsType<BadRequestObjectResult>(result);
            Assert.Equal(0, ctx.Wallets.Single(w => w.UserId == user.UserId).Balance);
        }
    }

    [Fact]
    public async Task TopUp_below_min_limit_is_rejected()
    {
        var (ctx, user) = SetupVerifiedIndividual();
        using (ctx)
        {
            var controller = IndividualController(ctx, user.UserId, new WalletLimitsOptions { MinTopUp = 10 });
            var result = await controller.TopUp(new TopUpRequest { Amount = 5 });
            Assert.IsType<BadRequestObjectResult>(result);
        }
    }

    // ── Withdrawal limits ─────────────────────────────────────

    private static TransactionController TransactionController(AppDbContext ctx, int userId, WalletLimitsOptions limits)
    {
        var controller = new TransactionController(ctx, new VerificationGate(ctx), Options.Create(limits));
        var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) }, "test");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
        return controller;
    }

    private static User AddUserWithWallet(AppDbContext ctx, decimal balance)
    {
        var user = new User
        {
            UserEmail = $"u{Guid.NewGuid():N}@test.local",
            PasswordHash = "hash",
            UserType = "NPO",
            IsEmailVerified = true,
            IsVerified = true,
            IsActive = true,
            RegistrationDate = DateTime.UtcNow
        };
        ctx.Users.Add(user);
        ctx.SaveChanges();
        ctx.Wallets.Add(new Wallet { UserId = user.UserId, Balance = balance });
        ctx.SaveChanges();
        return user;
    }

    [Fact]
    public async Task Withdrawal_within_limits_succeeds()
    {
        using var ctx = TestDbContextFactory.Create();
        var user = AddUserWithWallet(ctx, 10000);
        var controller = TransactionController(ctx, user.UserId, new WalletLimitsOptions());
        var result = await controller.Withdraw(new WithdrawFundsRequest { UserId = user.UserId, Amount = 1000 });
        Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(9000, ctx.Wallets.Single(w => w.UserId == user.UserId).Balance);
    }

    [Fact]
    public async Task Withdrawal_above_per_transaction_max_is_rejected()
    {
        using var ctx = TestDbContextFactory.Create();
        var user = AddUserWithWallet(ctx, 100000);
        var controller = TransactionController(ctx, user.UserId, new WalletLimitsOptions { MaxWithdrawal = 5000 });
        var result = await controller.Withdraw(new WithdrawFundsRequest { UserId = user.UserId, Amount = 6000 });
        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(100000, ctx.Wallets.Single(w => w.UserId == user.UserId).Balance);
    }

    [Fact]
    public async Task Withdrawal_below_per_transaction_min_is_rejected()
    {
        using var ctx = TestDbContextFactory.Create();
        var user = AddUserWithWallet(ctx, 100000);
        var controller = TransactionController(ctx, user.UserId, new WalletLimitsOptions { MinWithdrawal = 50 });
        var result = await controller.Withdraw(new WithdrawFundsRequest { UserId = user.UserId, Amount = 10 });
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Withdrawal_exceeding_daily_cap_is_rejected()
    {
        using var ctx = TestDbContextFactory.Create();
        var user = AddUserWithWallet(ctx, 100000);
        // Pre-existing completed withdrawal today.
        ctx.Transactions.Add(new Transaction
        {
            SenderUserId = user.UserId,
            ReceiverUserId = null,
            Amount = 8000,
            TransactionType = "Withdrawal",
            Status = "Completed",
            Timestamp = DateTime.UtcNow.AddHours(-2)
        });
        ctx.SaveChanges();

        var controller = TransactionController(ctx, user.UserId,
            new WalletLimitsOptions { MaxWithdrawal = 20000, MaxWithdrawalPerDay = 10000 });
        // 8000 already withdrawn; 3000 more would exceed the 10000 daily cap.
        var result = await controller.Withdraw(new WithdrawFundsRequest { UserId = user.UserId, Amount = 3000 });
        Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(100000, ctx.Wallets.Single(w => w.UserId == user.UserId).Balance);
    }
}
