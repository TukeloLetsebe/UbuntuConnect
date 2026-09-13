using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Processing;

namespace UbuntuConnectAPI.Services.Storage;

/// <summary>
/// Saves uploads to a local folder under the app content root and serves them
/// via a static-files route. Images are resized down and re-encoded as JPEG to
/// save space; documents (PDF) are stored as-is after validation.
/// </summary>
public class LocalFileStorageService : IFileStorageService
{
    private readonly FileStorageOptions _options;
    private readonly string _contentRoot;

    // Allowed extensions per kind.
    private static readonly string[] ImageExtensions = { ".jpg", ".jpeg", ".png", ".webp" };
    private static readonly string[] DocumentExtensions = { ".pdf" };

    public LocalFileStorageService(IOptions<FileStorageOptions> options, IWebHostEnvironment env)
    {
        _options = options.Value;
        _contentRoot = env.ContentRootPath;
    }

    public async Task<StoredFile> SaveAsync(
        Stream content,
        string originalFileName,
        string contentType,
        UploadKind kind,
        CancellationToken cancellationToken = default)
    {
        // Buffer the stream so we can measure size and inspect signature.
        using var buffer = new MemoryStream();
        await content.CopyToAsync(buffer, cancellationToken);
        buffer.Position = 0;

        if (buffer.Length == 0)
            throw new FileValidationException("Uploaded file is empty.");
        if (buffer.Length > _options.MaxUploadBytes)
            throw new FileValidationException(
                $"File exceeds the maximum size of {_options.MaxUploadBytes / (1024 * 1024)} MB.");

        var ext = Path.GetExtension(originalFileName)?.ToLowerInvariant() ?? "";

        var rootFolder = Path.Combine(_contentRoot, _options.LocalRootFolder);
        var subFolder = kind == UploadKind.Image ? "images" : "documents";
        var targetDir = Path.Combine(rootFolder, subFolder);
        Directory.CreateDirectory(targetDir);

        string storedName;
        long storedSize;
        string storedContentType;

        if (kind == UploadKind.Image)
        {
            if (!ImageExtensions.Contains(ext))
                throw new FileValidationException("Unsupported image type. Allowed: jpg, jpeg, png, webp.");

            // Decode (this also validates it is a real image), resize down, re-encode as JPEG.
            buffer.Position = 0;
            using var image = await Image.LoadAsync(buffer, cancellationToken);

            var max = _options.MaxImageDimension;
            if (image.Width > max || image.Height > max)
            {
                image.Mutate(x => x.Resize(new ResizeOptions
                {
                    Mode = ResizeMode.Max,
                    Size = new Size(max, max)
                }));
            }

            storedName = $"{Guid.NewGuid():N}.jpg";
            var fullPath = Path.Combine(targetDir, storedName);
            var encoder = new JpegEncoder { Quality = _options.ImageQuality };
            await image.SaveAsJpegAsync(fullPath, encoder, cancellationToken);

            storedSize = new FileInfo(fullPath).Length;
            storedContentType = "image/jpeg";
        }
        else
        {
            if (!DocumentExtensions.Contains(ext))
                throw new FileValidationException("Unsupported document type. Allowed: pdf.");

            // Verify PDF signature (%PDF) to reject mislabeled files.
            if (!HasPdfSignature(buffer))
                throw new FileValidationException("File does not appear to be a valid PDF.");

            storedName = $"{Guid.NewGuid():N}.pdf";
            var fullPath = Path.Combine(targetDir, storedName);
            buffer.Position = 0;
            await using (var fs = File.Create(fullPath))
                await buffer.CopyToAsync(fs, cancellationToken);

            storedSize = new FileInfo(fullPath).Length;
            storedContentType = "application/pdf";
        }

        var url = $"{_options.PublicPathPrefix}/{subFolder}/{storedName}";
        return new StoredFile
        {
            Url = url,
            FileName = storedName,
            SizeBytes = storedSize,
            ContentType = storedContentType
        };
    }

    public Task DeleteAsync(string url, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(url))
            return Task.CompletedTask;

        // Map the public URL back to a physical path, guarding against traversal.
        if (!url.StartsWith(_options.PublicPathPrefix, StringComparison.OrdinalIgnoreCase))
            return Task.CompletedTask;

        var relative = url.Substring(_options.PublicPathPrefix.Length).TrimStart('/', '\\');
        var rootFolder = Path.GetFullPath(Path.Combine(_contentRoot, _options.LocalRootFolder));
        var fullPath = Path.GetFullPath(Path.Combine(rootFolder, relative));

        if (!fullPath.StartsWith(rootFolder, StringComparison.OrdinalIgnoreCase))
            return Task.CompletedTask; // path traversal attempt — ignore

        if (File.Exists(fullPath))
            File.Delete(fullPath);

        return Task.CompletedTask;
    }

    public string? TryGetLocalPath(string url)
    {
        if (string.IsNullOrWhiteSpace(url)) return null;
        if (!url.StartsWith(_options.PublicPathPrefix, StringComparison.OrdinalIgnoreCase)) return null;

        var relative = url.Substring(_options.PublicPathPrefix.Length).TrimStart('/', '\\');
        var rootFolder = Path.GetFullPath(Path.Combine(_contentRoot, _options.LocalRootFolder));
        var fullPath = Path.GetFullPath(Path.Combine(rootFolder, relative));

        // Guard against path traversal.
        if (!fullPath.StartsWith(rootFolder, StringComparison.OrdinalIgnoreCase)) return null;

        return File.Exists(fullPath) ? fullPath : null;
    }

    private static bool HasPdfSignature(Stream stream)
    {
        stream.Position = 0;
        Span<byte> header = stackalloc byte[5];
        var read = stream.Read(header);
        stream.Position = 0;
        // "%PDF-"
        return read >= 5 && header[0] == 0x25 && header[1] == 0x50 &&
               header[2] == 0x44 && header[3] == 0x46 && header[4] == 0x2D;
    }
}
