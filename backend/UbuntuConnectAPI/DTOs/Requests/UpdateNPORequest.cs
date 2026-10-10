using System;

namespace UbuntuConnectAPI.DTOs.Requests;

public class UpdateNPORequest
{
    public string? OrganizationName { get; set; }
    public string? NPOFocusArea { get; set; }
    public string? NPOMission { get; set; }

    // Profile-level fields (stored on the linked Profile entity).
    public string? Bio { get; set; }
    public string? ProfileImage { get; set; }
    public string? BackgroundImage { get; set; }
}
