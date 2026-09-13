using UbuntuConnectAPI.Models;

namespace UbuntuConnectAPI.Services.Email;

/// <summary>
/// Issues and validates single-use, time-limited tokens (e.g. email
/// verification). Persists them to the EmailVerificationTokens table.
/// </summary>
public interface IEmailVerificationTokenService
{
    /// <summary>
    /// Creates and persists a new token for the user, returning it.
    /// Any existing unconsumed tokens of the same purpose are invalidated.
    /// </summary>
    Task<EmailVerificationToken> IssueAsync(
        int userId,
        string purpose = "EmailVerification",
        TimeSpan? lifetime = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Validates a token string for a purpose. Returns the token entity if it
    /// exists, is unconsumed, and is not expired; otherwise null.
    /// </summary>
    Task<EmailVerificationToken?> ValidateAsync(
        string token,
        string purpose = "EmailVerification",
        CancellationToken cancellationToken = default);

    /// <summary>Marks a token as consumed so it cannot be reused.</summary>
    Task ConsumeAsync(EmailVerificationToken token, CancellationToken cancellationToken = default);
}
