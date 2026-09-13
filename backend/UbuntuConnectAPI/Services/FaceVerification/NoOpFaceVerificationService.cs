namespace UbuntuConnectAPI.Services.FaceVerification;

/// <summary>
/// Default face-verification implementation: does nothing. Reports the engine
/// as unavailable so the self-service face-scan route falls back to admin
/// review. Replaced by a real FaceONNX-backed service in Task 15 (config-gated).
/// </summary>
public class NoOpFaceVerificationService : IFaceVerificationService
{
    public bool IsEnabled => false;

    public Task<FaceMatchResult> CompareAsync(string idImageUrl, string selfieImageUrl, CancellationToken cancellationToken = default)
        => Task.FromResult(FaceMatchResult.NotAvailable("Automated face verification is not enabled. Please use admin review."));
}
