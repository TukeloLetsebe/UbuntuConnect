namespace UbuntuConnectAPI.Services.Storage;

/// <summary>
/// Bound from the "FileStorage" section of appsettings. Controls where uploads
/// land and the limits/processing applied. Local now; a future Azure Blob
/// implementation would read its own settings but keep the same interface.
/// </summary>
public class FileStorageOptions
{
    public const string SectionName = "FileStorage";

    /// <summary>"Local" (default) — future: "AzureBlob".</summary>
    public string Provider { get; set; } = "Local";

    /// <summary>Physical root folder for the Local provider (relative to content root).</summary>
    public string LocalRootFolder { get; set; } = "uploads";

    /// <summary>URL path prefix the files are served under.</summary>
    public string PublicPathPrefix { get; set; } = "/uploads";

    /// <summary>Max upload size in bytes (default 8 MB).</summary>
    public long MaxUploadBytes { get; set; } = 8 * 1024 * 1024;

    /// <summary>Longest edge (px) an image is resized down to; larger images are scaled to fit.</summary>
    public int MaxImageDimension { get; set; } = 1600;

    /// <summary>JPEG/WebP re-encode quality (1-100).</summary>
    public int ImageQuality { get; set; } = 80;
}
