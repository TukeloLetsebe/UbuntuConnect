namespace UbuntuConnectAPI.Services.Payments;

/// <summary>
/// Outcome of a simulated card charge. This is a mock gateway: a card of the
/// right shape (13–16 digits + non-expired expiry + 3–4 digit CVV) is always approved.
/// </summary>
public record PaymentSimulationResult(bool Approved, string? DeclineReason)
{
    public static PaymentSimulationResult Approve() => new(true, null);
    public static PaymentSimulationResult Decline(string reason) => new(false, reason);
}
