using System;

namespace UbuntuConnectAPI.Models;

public partial class EmailVerificationToken
{
    public int TokenId { get; set; }

    public int UserId { get; set; }

    public string Token { get; set; } = null!;

    public string Purpose { get; set; } = "EmailVerification";

    public DateTime ExpiresAt { get; set; }

    public DateTime? ConsumedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
