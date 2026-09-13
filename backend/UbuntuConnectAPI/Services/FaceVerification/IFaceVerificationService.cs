namespace UbuntuConnectAPI.Services.FaceVerification;

/// <summary>Outcome of a face-match comparison between an ID photo and a selfie.</summary>
public record FaceMatchResult(bool Available, bool Matched, double Score, string? Message)
{
    /// <summary>The engine is disabled / not implemented — caller should fall back to admin review.</summary>
    public static FaceMatchResult NotAvailable(string message) => new(false, false, 0, message);
    public static FaceMatchResult Match(double score) => new(true, true, score, null);
    public static FaceMatchResult NoMatch(double score, string message) => new(true, false, score, message);
}

/// <summary>
/// Compares a face in an ID document to a selfie for self-service identity
/// verification. This is a seam: the default is a no-op (NotAvailable) and a
/// real local engine (FaceONNX) is dropped in at Task 15 without changing
/// callers. Liveness detection is out of scope.
/// </summary>
public interface IFaceVerificationService
{
    /// <summary>True when a working face engine is configured/enabled.</summary>
    bool IsEnabled { get; }

    /// <summary>
    /// Compares the faces in two stored image URLs (ID + selfie). Returns a
    /// match decision + similarity score, or NotAvailable if disabled.
    /// </summary>
    Task<FaceMatchResult> CompareAsync(string idImageUrl, string selfieImageUrl, CancellationToken cancellationToken = default);
}
