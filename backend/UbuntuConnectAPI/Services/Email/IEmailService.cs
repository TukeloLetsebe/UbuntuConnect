namespace UbuntuConnectAPI.Services.Email;

/// <summary>
/// Transport-agnostic email sender. Swapped by configuration:
/// a mock/dev implementation now, a real SMTP/provider later —
/// callers never change.
/// </summary>
public interface IEmailService
{
    Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default);
}
