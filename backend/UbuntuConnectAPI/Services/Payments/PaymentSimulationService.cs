using System.Globalization;

namespace UbuntuConnectAPI.Services.Payments;

/// <summary>
/// Mock card gateway for demos. It never contacts a real issuer and never moves
/// real money, but it DOES validate that the entered card is well-formed so junk
/// like "1" is rejected: Luhn-valid 13–19 digit number, a non-expired MM/YY
/// expiry, and a 3–4 digit CVV. Any structurally valid card is approved.
/// Each failure returns a specific, user-facing decline reason.
/// </summary>
public class PaymentSimulationService : IPaymentSimulationService
{
    public PaymentSimulationResult Charge(string? cardNumber, string? expiry, string? cvv)
    {
        // ── Card number: digits only, 13–19 long, Luhn-valid ──
        var digits = new string((cardNumber ?? "").Where(char.IsDigit).ToArray());
        if (digits.Length == 0)
            return PaymentSimulationResult.Decline("Please enter a card number.");
        if (digits.Length < 13 || digits.Length > 19)
            return PaymentSimulationResult.Decline("Card number must be between 13 and 19 digits.");
        if (!PassesLuhn(digits))
            return PaymentSimulationResult.Decline("That card number is invalid. Please check the digits and try again.");

        // ── Expiry: parseable MM/YY (or MM/YYYY) and not in the past ──
        if (string.IsNullOrWhiteSpace(expiry))
            return PaymentSimulationResult.Decline("Please enter the card's expiry date (MM/YY).");
        if (!TryParseExpiry(expiry, out var endExclusiveUtc))
            return PaymentSimulationResult.Decline("The expiry date is not valid. Use MM/YY, e.g. 09/28.");
        if (endExclusiveUtc <= DateTime.UtcNow)
            return PaymentSimulationResult.Decline("This card has expired. Please use a card with a future expiry date.");

        // ── CVV: 3–4 digits ──
        var cvvDigits = new string((cvv ?? "").Where(char.IsDigit).ToArray());
        if (cvvDigits.Length is < 3 or > 4)
            return PaymentSimulationResult.Decline("The CVV must be the 3 or 4 digit code on your card.");

        // Well-formed — approve (no real charge).
        return PaymentSimulationResult.Approve();
    }

    /// <summary>Standard Luhn checksum.</summary>
    public static bool PassesLuhn(string digits)
    {
        var sum = 0;
        var alternate = false;
        for (var i = digits.Length - 1; i >= 0; i--)
        {
            var n = digits[i] - '0';
            if (alternate)
            {
                n *= 2;
                if (n > 9) n -= 9;
            }
            sum += n;
            alternate = !alternate;
        }
        return sum % 10 == 0;
    }

    /// <summary>
    /// Parses MM/YY or MM/YYYY and returns the first instant AFTER the card is
    /// valid (start of the month following the expiry month), so a card is valid
    /// through the end of its printed month.
    /// </summary>
    public static bool TryParseExpiry(string? expiry, out DateTime endExclusiveUtc)
    {
        endExclusiveUtc = default;
        if (string.IsNullOrWhiteSpace(expiry)) return false;

        var parts = expiry.Trim().Split('/', '-');
        if (parts.Length != 2) return false;

        if (!int.TryParse(parts[0], NumberStyles.None, CultureInfo.InvariantCulture, out var month))
            return false;
        if (month is < 1 or > 12) return false;

        var yearRaw = parts[1].Trim();
        if (!int.TryParse(yearRaw, NumberStyles.None, CultureInfo.InvariantCulture, out var year))
            return false;
        if (yearRaw.Length <= 2) year += 2000;
        if (year is < 2000 or > 2100) return false;

        // Card is valid through the last day of `month`; expire at start of next month.
        var nextMonth = month == 12 ? 1 : month + 1;
        var nextMonthYear = month == 12 ? year + 1 : year;
        endExclusiveUtc = new DateTime(nextMonthYear, nextMonth, 1, 0, 0, 0, DateTimeKind.Utc);
        return true;
    }
}
