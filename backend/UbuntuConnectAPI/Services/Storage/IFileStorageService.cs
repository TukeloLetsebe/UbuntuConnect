namespace UbuntuConnectAPI.Services.Storage;

/// <summary>
/// Abstracts where uploaded files live. Local disk now; Azure Blob (or S3)
/// later — callers only ever see a returned public URL.
/// </summary>
public interface IFileStorageService
{
    /// <summary>
    /// Validates, (for images) resizes/compresses, and persists an uploaded
    /// stream. Throws <see cref="FileValidationException"/> for disallowed
    /// type/size. Returns the public URL + metadata.
    /// </summary>
    Task<StoredFile> SaveAsync(
        Stream content,
        string originalFileName,
        string contentType,
        UploadKind kind,
        CancellationToken cancellationToken = default);

    /// <summary>Deletes a previously stored file by its public URL. No-op if missing.</summary>
    Task DeleteAsync(string url, CancellationToken cancellationToken = default);

    /// <summary>
    /// Resolves a public URL to a physical file path on disk if this provider
    /// stores files locally and the file exists. Returns null otherwise
    /// (e.g. remote/cloud storage). Used by the face engine to read images.
    /// </summary>
    string? TryGetLocalPath(string url);
}

/// <summary>Thrown when an upload fails validation (bad type or too large).</summary>
public class FileValidationException : Exception
{
    public FileValidationException(string message) : base(message) { }
}
