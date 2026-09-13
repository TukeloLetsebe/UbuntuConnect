namespace UbuntuConnectAPI.Services.Verification;

/// <summary>Result of a verification-gate check.</summary>
public record GateResult(bool Allowed, string? Reason)
{
    public static GateResult Ok() => new(true, null);
    public static GateResult Deny(string reason) => new(false, reason);
}

/// <summary>
/// Central anti-fraud/AML gate. Determines whether a user may perform
/// state-changing money/commitment actions (donate, top up, volunteer apply).
/// A user must have verified their email (Stage 1) AND been identity-verified
/// by an admin (Stage 2, IsVerified) before transacting.
/// </summary>
public interface IVerificationGate
{
    Task<GateResult> CanTransactAsync(int userId, CancellationToken cancellationToken = default);
}
