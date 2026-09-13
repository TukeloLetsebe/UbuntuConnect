namespace UbuntuConnectAPI.Services.Fundraisers;

/// <summary>
/// Closes timed/target-met fundraisers. Extracted from the background runner so
/// it can be unit-tested against an in-memory context.
/// </summary>
public interface IFundraiserAutoCloseService
{
    /// <summary>
    /// Marks every Active fundraiser whose EndDate has passed OR whose
    /// RaisedAmount &gt;= TargetAmount as Completed, notifies the owning NPO,
    /// and returns the number of fundraisers closed.
    /// </summary>
    Task<int> RunAsync(CancellationToken cancellationToken = default);
}
