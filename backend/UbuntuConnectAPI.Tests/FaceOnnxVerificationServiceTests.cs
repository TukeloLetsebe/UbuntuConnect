using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using UbuntuConnectAPI.Services.FaceVerification;
using UbuntuConnectAPI.Services.Storage;
using Xunit;

namespace UbuntuConnectAPI.Tests;

public class FaceOnnxVerificationServiceTests
{
    // Storage stub that maps a "url" straight to a local file path.
    private sealed class DirectPathStorage : IFileStorageService
    {
        public Task<StoredFile> SaveAsync(Stream c, string f, string ct, UploadKind k, CancellationToken t = default)
            => throw new NotSupportedException();
        public Task DeleteAsync(string url, CancellationToken t = default) => Task.CompletedTask;
        public string? TryGetLocalPath(string url) => File.Exists(url) ? url : null;
    }

    // Minimal IServiceProvider whose scope resolves our storage stub.
    private sealed class StubProvider : IServiceProvider, IServiceScopeFactory, IServiceScope
    {
        private readonly IFileStorageService _storage = new DirectPathStorage();
        public object? GetService(Type t)
        {
            if (t == typeof(IFileStorageService)) return _storage;
            if (t == typeof(IServiceScopeFactory)) return this;
            return null;
        }
        public IServiceScope CreateScope() => this;
        public IServiceProvider ServiceProvider => this;
        public void Dispose() { }
    }

    private static string PlainImage(string name)
        => Path.Combine(Path.GetTempPath(), "uc_faces", name);

    [Fact]
    public void Disabled_service_reports_not_enabled()
    {
        var svc = new FaceOnnxVerificationService(
            Options.Create(new FaceVerificationOptions { Enabled = false }),
            new StubProvider(),
            NullLogger<FaceOnnxVerificationService>.Instance);

        Assert.False(svc.IsEnabled);
    }

    [Fact]
    public async Task Disabled_service_returns_not_available()
    {
        var svc = new FaceOnnxVerificationService(
            Options.Create(new FaceVerificationOptions { Enabled = false }),
            new StubProvider(),
            NullLogger<FaceOnnxVerificationService>.Instance);

        var result = await svc.CompareAsync("a", "b");

        Assert.False(result.Available);
        Assert.False(result.Matched);
    }

    [Fact]
    public async Task Enabled_engine_handles_faceless_images_without_false_match()
    {
        // Skip gracefully if the test fixtures aren't present.
        var p1 = PlainImage("plain1.jpg");
        var p2 = PlainImage("plain2.jpg");
        if (!File.Exists(p1) || !File.Exists(p2))
            return;

        using var svc = new FaceOnnxVerificationService(
            Options.Create(new FaceVerificationOptions { Enabled = true, MatchThreshold = 0.62 }),
            new StubProvider(),
            NullLogger<FaceOnnxVerificationService>.Instance);

        var result = await svc.CompareAsync(p1, p2);

        // Whatever happens, it must NOT be a false positive match. Either the
        // models loaded and found no face (NoMatch), or the engine couldn't
        // initialise in this host (NotAvailable). Never Matched=true here.
        Assert.False(result.Matched);

        // Surface which path was taken so we can confirm models actually load
        // (Available=true means the ONNX runtime + models ran end-to-end).
        Console.WriteLine($"[FACE ENGINE] Available={result.Available} Matched={result.Matched} Score={result.Score} Msg={result.Message}");
    }
}
