using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.PixelFormats;
using UbuntuConnectAPI.Services.Storage;
using Xunit;

namespace UbuntuConnectAPI.Tests;

public class LocalFileStorageServiceTests : IDisposable
{
    private readonly string _tempRoot;
    private readonly FileStorageOptions _options;
    private readonly LocalFileStorageService _service;

    public LocalFileStorageServiceTests()
    {
        _tempRoot = Path.Combine(Path.GetTempPath(), "uc-tests-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_tempRoot);

        _options = new FileStorageOptions
        {
            LocalRootFolder = "uploads",
            PublicPathPrefix = "/uploads",
            MaxUploadBytes = 2 * 1024 * 1024,
            MaxImageDimension = 200,
            ImageQuality = 75
        };

        var env = new FakeWebHostEnvironment { ContentRootPath = _tempRoot };
        _service = new LocalFileStorageService(Options.Create(_options), env);
    }

    private static MemoryStream MakePng(int width, int height)
    {
        using var image = new Image<Rgba32>(width, height);
        var ms = new MemoryStream();
        image.Save(ms, new PngEncoder());
        ms.Position = 0;
        return ms;
    }

    private string PhysicalPathFor(string url)
    {
        var relative = url.Substring(_options.PublicPathPrefix.Length).TrimStart('/');
        return Path.Combine(_tempRoot, _options.LocalRootFolder, relative);
    }

    [Fact]
    public async Task SaveAsync_stores_image_returns_url_and_reencodes_as_jpeg()
    {
        using var png = MakePng(50, 50);

        var stored = await _service.SaveAsync(png, "photo.png", "image/png", UploadKind.Image);

        Assert.StartsWith("/uploads/images/", stored.Url);
        Assert.EndsWith(".jpg", stored.Url);
        Assert.Equal("image/jpeg", stored.ContentType);

        var path = PhysicalPathFor(stored.Url);
        Assert.True(File.Exists(path));

        // Confirm the stored file is actually a JPEG.
        using var reloaded = await Image.LoadAsync(path);
        var format = await Image.DetectFormatAsync(path);
        Assert.Equal("JPEG", format.Name);
    }

    [Fact]
    public async Task SaveAsync_resizes_images_larger_than_max_dimension()
    {
        using var png = MakePng(800, 400); // wider than MaxImageDimension (200)

        var stored = await _service.SaveAsync(png, "big.png", "image/png", UploadKind.Image);

        var path = PhysicalPathFor(stored.Url);
        using var reloaded = await Image.LoadAsync(path);
        Assert.True(reloaded.Width <= _options.MaxImageDimension);
        Assert.True(reloaded.Height <= _options.MaxImageDimension);
        // Aspect ratio preserved: 800x400 -> 200x100
        Assert.Equal(200, reloaded.Width);
        Assert.Equal(100, reloaded.Height);
    }

    [Fact]
    public async Task SaveAsync_rejects_unsupported_image_extension()
    {
        using var png = MakePng(10, 10);

        await Assert.ThrowsAsync<FileValidationException>(() =>
            _service.SaveAsync(png, "photo.gif", "image/gif", UploadKind.Image));
    }

    [Fact]
    public async Task SaveAsync_rejects_oversized_file()
    {
        var big = new MemoryStream(new byte[_options.MaxUploadBytes + 1]);

        await Assert.ThrowsAsync<FileValidationException>(() =>
            _service.SaveAsync(big, "photo.png", "image/png", UploadKind.Image));
    }

    [Fact]
    public async Task SaveAsync_rejects_empty_file()
    {
        using var empty = new MemoryStream();

        await Assert.ThrowsAsync<FileValidationException>(() =>
            _service.SaveAsync(empty, "photo.png", "image/png", UploadKind.Image));
    }

    [Fact]
    public async Task SaveAsync_stores_valid_pdf_document()
    {
        // Minimal valid-ish PDF: starts with %PDF- signature.
        var bytes = System.Text.Encoding.ASCII.GetBytes("%PDF-1.4\n%EOF\n");
        using var pdf = new MemoryStream(bytes);

        var stored = await _service.SaveAsync(pdf, "doc.pdf", "application/pdf", UploadKind.Document);

        Assert.StartsWith("/uploads/documents/", stored.Url);
        Assert.EndsWith(".pdf", stored.Url);
        Assert.Equal("application/pdf", stored.ContentType);
        Assert.True(File.Exists(PhysicalPathFor(stored.Url)));
    }

    [Fact]
    public async Task SaveAsync_rejects_document_without_pdf_signature()
    {
        var bytes = System.Text.Encoding.ASCII.GetBytes("this is not a pdf");
        using var fake = new MemoryStream(bytes);

        await Assert.ThrowsAsync<FileValidationException>(() =>
            _service.SaveAsync(fake, "doc.pdf", "application/pdf", UploadKind.Document));
    }

    [Fact]
    public async Task DeleteAsync_removes_stored_file()
    {
        using var png = MakePng(10, 10);
        var stored = await _service.SaveAsync(png, "photo.png", "image/png", UploadKind.Image);
        var path = PhysicalPathFor(stored.Url);
        Assert.True(File.Exists(path));

        await _service.DeleteAsync(stored.Url);

        Assert.False(File.Exists(path));
    }

    public void Dispose()
    {
        try { Directory.Delete(_tempRoot, recursive: true); } catch { /* best effort */ }
    }

    private sealed class FakeWebHostEnvironment : IWebHostEnvironment
    {
        public string WebRootPath { get; set; } = "";
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string ApplicationName { get; set; } = "UbuntuConnectAPI.Tests";
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
        public string ContentRootPath { get; set; } = "";
        public string EnvironmentName { get; set; } = "Development";
    }
}
