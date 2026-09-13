using FaceONNX;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using UbuntuConnectAPI.Services.Storage;

namespace UbuntuConnectAPI.Services.FaceVerification;

/// <summary>
/// Local, free face-match engine backed by FaceONNX (ONNX Runtime). Detects a
/// face in the ID photo and the selfie, computes embeddings, and compares them
/// by cosine similarity. Runs fully offline — no third-party API, no cost.
/// Registered only when config "FaceVerification:Enabled" is true; otherwise
/// the no-op service is used and the face-scan route falls back to admin review.
///
/// Registered as a singleton: the ONNX models are loaded once and reused. All
/// engine calls are serialised with a lock because the detectors are stateful.
/// </summary>
public sealed class FaceOnnxVerificationService : IFaceVerificationService, IDisposable
{
    private readonly FaceVerificationOptions _options;
    private readonly IServiceProvider _services;
    private readonly ILogger<FaceOnnxVerificationService> _logger;

    private readonly object _lock = new();
    private FaceDetector? _detector;
    private Face68LandmarksExtractor? _landmarks;
    private FaceEmbedder? _embedder;
    private bool _initFailed;

    public FaceOnnxVerificationService(
        IOptions<FaceVerificationOptions> options,
        IServiceProvider services,
        ILogger<FaceOnnxVerificationService> logger)
    {
        _options = options.Value;
        _services = services;
        _logger = logger;
    }

    public bool IsEnabled => _options.Enabled && !_initFailed;

    private bool EnsureModels()
    {
        if (_initFailed) return false;
        if (_detector != null) return true;
        try
        {
            _detector = new FaceDetector();
            _landmarks = new Face68LandmarksExtractor();
            _embedder = new FaceEmbedder();
            return true;
        }
        catch (Exception ex)
        {
            _initFailed = true;
            _logger.LogError(ex, "Failed to initialise FaceONNX models. Falling back to admin review.");
            return false;
        }
    }

    public async Task<FaceMatchResult> CompareAsync(string idImageUrl, string selfieImageUrl, CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled)
            return FaceMatchResult.NotAvailable("Automated face verification is disabled.");

        // Resolve the stored URLs to local files via the storage service.
        string? idPath, selfiePath;
        using (var scope = _services.CreateScope())
        {
            var storage = scope.ServiceProvider.GetRequiredService<IFileStorageService>();
            idPath = storage.TryGetLocalPath(idImageUrl);
            selfiePath = storage.TryGetLocalPath(selfieImageUrl);
        }

        if (idPath == null || selfiePath == null)
            return FaceMatchResult.NotAvailable("Could not read the uploaded images for face verification.");

        try
        {
            var idEmbedding = await GetEmbeddingAsync(idPath, cancellationToken);
            var selfieEmbedding = await GetEmbeddingAsync(selfiePath, cancellationToken);

            if (idEmbedding == null)
                return FaceMatchResult.NoMatch(0, "No face was detected in the ID document.");
            if (selfieEmbedding == null)
                return FaceMatchResult.NoMatch(0, "No face was detected in the selfie.");

            var score = CosineSimilarity(idEmbedding, selfieEmbedding);
            return score >= _options.MatchThreshold
                ? FaceMatchResult.Match(score)
                : FaceMatchResult.NoMatch(score, "The faces do not appear to match.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Face comparison failed.");
            return FaceMatchResult.NotAvailable("Face verification could not be completed.");
        }
    }

    /// <summary>Loads an image, detects the largest face, and returns its embedding (or null).</summary>
    private Task<float[]?> GetEmbeddingAsync(string path, CancellationToken ct)
    {
        return Task.Run(() =>
        {
            using var image = Image.Load<Rgb24>(path);

            // Convert to the [3][h,w] float tensor FaceONNX expects (0-1 RGB).
            var array = new[]
            {
                new float[image.Height, image.Width],
                new float[image.Height, image.Width],
                new float[image.Height, image.Width]
            };
            image.ProcessPixelRows(rows =>
            {
                for (var y = 0; y < rows.Height; y++)
                {
                    var row = rows.GetRowSpan(y);
                    for (var x = 0; x < rows.Width; x++)
                    {
                        array[0][y, x] = row[x].R / 255.0F;
                        array[1][y, x] = row[x].G / 255.0F;
                        array[2][y, x] = row[x].B / 255.0F;
                    }
                }
            });

            lock (_lock)
            {
                if (!EnsureModels()) return null;

                var faces = _detector!.Forward(array);
                if (faces.Length == 0) return null;

                // Pick the highest-scoring detected face.
                var best = faces.Where(f => !f.Box.IsEmpty).OrderByDescending(f => f.Score).FirstOrDefault();
                if (best.Box.IsEmpty) return null;

                var points = _landmarks!.Forward(array, best.Box);
                var angle = points.RotationAngle;
                var aligned = FaceProcessingExtensions.Align(array, best.Box, angle);
                return _embedder!.Forward(aligned);
            }
        }, ct);
    }

    private static double CosineSimilarity(float[] a, float[] b)
    {
        double dot = 0, na = 0, nb = 0;
        var n = Math.Min(a.Length, b.Length);
        for (var i = 0; i < n; i++)
        {
            dot += a[i] * b[i];
            na += a[i] * a[i];
            nb += b[i] * b[i];
        }
        if (na == 0 || nb == 0) return 0;
        return dot / (Math.Sqrt(na) * Math.Sqrt(nb));
    }

    public void Dispose()
    {
        _detector?.Dispose();
        _landmarks?.Dispose();
        _embedder?.Dispose();
    }
}
