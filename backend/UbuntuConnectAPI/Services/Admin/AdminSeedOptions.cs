namespace UbuntuConnectAPI.Services.Admin;

/// <summary>
/// Bound from the "AdminSeed" section of configuration. Admin accounts can
/// only be created this way (server-side, from config) — never through the
/// public registration endpoint. In production these values should come from
/// environment variables / user-secrets, not committed appsettings.
/// </summary>
public class AdminSeedOptions
{
    public const string SectionName = "AdminSeed";

    /// <summary>When false, no admin is seeded (default for safety).</summary>
    public bool Enabled { get; set; } = false;

    public string Email { get; set; } = "";

    public string Password { get; set; } = "";
}
