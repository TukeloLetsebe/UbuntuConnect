namespace UbuntuConnectAPI.Services.Email;

/// <summary>
/// A simple transport-agnostic email payload. The concrete
/// <see cref="IEmailService"/> implementation decides how it is delivered
/// (console/log in dev, SMTP/provider in production).
/// </summary>
public class EmailMessage
{
    public string ToEmail { get; set; } = null!;

    public string Subject { get; set; } = null!;

    public string Body { get; set; } = null!;
}
