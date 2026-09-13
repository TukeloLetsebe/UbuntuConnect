namespace UbuntuConnectAPI.Services.Payments;

/// <summary>
/// Bound from the "WalletLimits" section. Server-side guard rails for wallet
/// operations: per-transaction top-up/withdrawal min/max and a rolling 24h
/// withdrawal cap.
/// </summary>
public class WalletLimitsOptions
{
    public const string SectionName = "WalletLimits";

    /// <summary>Minimum amount for a single top-up.</summary>
    public decimal MinTopUp { get; set; } = 10m;

    /// <summary>Maximum amount for a single top-up.</summary>
    public decimal MaxTopUp { get; set; } = 50000m;

    /// <summary>Minimum amount for a single withdrawal.</summary>
    public decimal MinWithdrawal { get; set; } = 50m;

    /// <summary>Maximum amount for a single withdrawal.</summary>
    public decimal MaxWithdrawal { get; set; } = 20000m;

    /// <summary>Maximum total withdrawals allowed within a rolling 24-hour window.</summary>
    public decimal MaxWithdrawalPerDay { get; set; } = 50000m;
}
