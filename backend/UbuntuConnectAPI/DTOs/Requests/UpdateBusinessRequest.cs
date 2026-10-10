namespace UbuntuConnectAPI.DTOs.Requests;

public class UpdateBusinessRequest
{
    public string? Industry { get; set; }
    public string? ContactPersonName { get; set; }
    public string? ContactPersonTitle { get; set; }
    public string? CsrGoal { get; set; }

    // Profile-level fields (stored on the linked Profile entity).
    public string? Bio { get; set; }
    public string? ProfileImage { get; set; }
    public string? BackgroundImage { get; set; }
}
