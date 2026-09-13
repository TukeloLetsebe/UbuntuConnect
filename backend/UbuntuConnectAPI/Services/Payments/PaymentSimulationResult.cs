namespace UbuntuConnectAPI.Services.Payments;

/// <summary>
/// Outcome of a simulated card charge. This is a mock gateway: a card that
/// passes validation (Luhn + non-expired) is always approved.
/// </summary>
public record PaymentSimulationResult(bool Approved, string? DeclineReason)
{
    public static PaymentSimulationResult Approve() => new(true, null);
    public static PaymentSimulationResult Decline(string reason) => new(false, reason);
}
