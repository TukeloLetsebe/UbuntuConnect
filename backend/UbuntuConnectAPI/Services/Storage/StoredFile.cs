namespace UbuntuConnectAPI.Services.Storage;

/// <summary>Result of a successful save: the public URL and stored metadata.</summary>
public class StoredFile
{
    public string Url { get; set; } = null!;

    public string FileName { get; set; } = null!;

    public long SizeBytes { get; set; }

    public string ContentType { get; set; } = null!;
}

/// <summary>The kind of asset being uploaded — drives allowed content types.</summary>
public enum UploadKind
{
    Image,
    Document
}
