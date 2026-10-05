using System.Globalization;

namespace UbuntuConnectAPI.Services.Payments;

/// <summary>
/// Mock card gateway. This is a pure simulation for demos — it performs NO card
/// validation and always approves, regardless of the (random) numbers entered.
/// No funds are actually charged; the caller credits the wallet on approval.
/// The Luhn/expiry helpers below are retained for reference/tests but are no
/// longer used to gate a charge.
/// </summary>
public class PaymentSimulationService : IPaymentSimulationService
{
    public PaymentSimulationResult Charge(string? cardNumber, string? expiry, string? cvv)
    {
        // Simulation only — accept any input and always approve.
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
