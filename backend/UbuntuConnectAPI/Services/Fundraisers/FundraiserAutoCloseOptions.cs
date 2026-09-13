namespace UbuntuConnectAPI.Services.Fundraisers;

/// <summary>
/// Bound from the "FundraiserAutoClose" section. Controls the periodic job that
/// marks Active fundraisers (Projects) Completed once their EndDate has passed
/// or their RaisedAmount has reached the TargetAmount, then notifies the owning NPO.
/// </summary>
public class FundraiserAutoCloseOptions
{
    public const string SectionName = "FundraiserAutoClose";

    /// <summary>Master switch for the periodic background job. Off by default.</summary>
    public bool Enabled { get; set; } = false;

    /// <summary>How often the background job runs.</summary>
    public double IntervalMinutes { get; set; } = 60;
}
