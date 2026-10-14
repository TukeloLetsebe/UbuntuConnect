namespace UbuntuConnectAPI.Services.Users;

/// <summary>
/// Resolves user ids to a human-readable display name — the individual's full
/// name, else the NPO's organisation name, else the business's contact person,
/// else the account email. Used to replace raw user ids in admin/transaction
/// views with real names.
/// </summary>
public interface IUserNameResolver
{
    /// <summary>
    /// Returns a map of userId → display name for the given ids. Ids with no
    /// matching user are simply absent from the result.
    /// </summary>
    Task<Dictionary<int, string>> ResolveAsync(IEnumerable<int> userIds, CancellationToken cancellationToken = default);
}
