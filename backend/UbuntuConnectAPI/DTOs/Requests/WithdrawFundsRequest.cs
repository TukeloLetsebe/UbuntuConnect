using System;

namespace UbuntuConnectAPI.DTOs.Requests;

public class WithdrawFundsRequest
{
    public int UserId { get; set; }
    public decimal Amount { get; set; }

    /// <summary>
    /// Why the funds are being withdrawn (preset category plus optional note,
    /// joined into one string by the client). Required — the API rejects a
    /// withdrawal with no reason so admins can audit the cause of the movement.
    /// </summary>
    public string? Reason { get; set; }
}
