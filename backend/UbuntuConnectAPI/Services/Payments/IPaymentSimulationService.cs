namespace UbuntuConnectAPI.Services.Payments;

/// <summary>
/// Simulated card payment gateway. Validates card shape (13–16 digits + expiry)
/// and, for any correctly-shaped card, always approves — there is no real charge.
/// Kept behind an interface so a real gateway could replace it later.
/// </summary>
public interface IPaymentSimulationService
{
    /// <summary>
    /// Validates the supplied card details and returns an approval decision.
    /// </summary>
    /// <param name="cardNumber">Card number (spaces/dashes allowed).</param>
    /// <param name="expiry">Expiry in MM/YY or MM/YYYY.</param>
    /// <param name="cvv">3–4 digit CVV.</param>
    PaymentSimulationResult Charge(string? cardNumber, string? expiry, string? cvv);
}
