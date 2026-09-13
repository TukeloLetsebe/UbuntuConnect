namespace UbuntuConnectAPI.Services.FaceVerification;

/// <summary>
/// Bound from the "FaceVerification" section. When disabled, the no-op service
/// is registered and the self-service face-scan route falls back to admin
/// review. The engine (FaceONNX) runs entirely locally — no external API.
/// Liveness detection is out of scope.
/// </summary>
public class FaceVerificationOptions
{
    public const string SectionName = "FaceVerification";

    /// <summary>Master switch. Default off so the app runs without the ONNX models loaded.</summary>
    public bool Enabled { get; set; } = false;

    /// <summary>Cosine-similarity threshold (0-1) above which two faces are a match.</summary>
    public double MatchThreshold { get; set; } = 0.62;
}
