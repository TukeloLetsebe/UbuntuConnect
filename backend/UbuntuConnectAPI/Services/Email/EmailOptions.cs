namespace UbuntuConnectAPI.Services.Email;

/// <summary>
/// Bound from the "Email" section of appsettings. In dev the Mock provider
/// is used; SMTP settings are placeholders for the future real provider.
/// </summary>
public class EmailOptions
{
    public const string SectionName = "Email";

    /// <summary>"Mock" (default, dev) or "Smtp" (future real delivery).</summary>
    public string Provider { get; set; } = "Mock";

    public string FromAddress { get; set; } = "no-reply@ubuntuconnect.local";

    public string FromName { get; set; } = "UbuntuConnect";

    /// <summary>Base URL the frontend serves on, used to build verification links.</summary>
    public string FrontendBaseUrl { get; set; } = "http://localhost:5173";

    public SmtpOptions Smtp { get; set; } = new();
}

public class SmtpOptions
{
    public string Host { get; set; } = "";
    public int Port { get; set; } = 587;
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public bool UseSsl { get; set; } = true;
}
