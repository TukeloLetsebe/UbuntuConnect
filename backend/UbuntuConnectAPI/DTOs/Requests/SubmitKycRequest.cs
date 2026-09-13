namespace UbuntuConnectAPI.DTOs.Requests;

public class SubmitKycRequest
{
    public string IdNumber { get; set; } = string.Empty;

    /// <summary>Public URL of the uploaded ID document image.</summary>
    public string IdDocumentUrl { get; set; } = string.Empty;

    /// <summary>Public URL of the uploaded selfie image.</summary>
    public string SelfieUrl { get; set; } = string.Empty;

    /// <summary>"Admin" (manual review) or "FaceScan" (self-service).</summary>
    public string Route { get; set; } = "Admin";
}
