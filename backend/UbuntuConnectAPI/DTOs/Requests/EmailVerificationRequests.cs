namespace UbuntuConnectAPI.DTOs.Requests;

public class VerifyEmailRequest
{
    public string Token { get; set; } = string.Empty;
}

public class ResendVerificationRequest
{
    public string UserEmail { get; set; } = string.Empty;
}
