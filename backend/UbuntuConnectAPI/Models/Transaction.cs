using System;
using System.Collections.Generic;

namespace UbuntuConnectAPI.Models;

public partial class Transaction
{
    public int TransactionId { get; set; }

    public int? SenderUserId { get; set; }

    public int? ReceiverUserId { get; set; }

    public decimal Amount { get; set; }

    public string TransactionType { get; set; } = null!;

    public string Status { get; set; } = null!;

    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Why the funds moved. Required for withdrawals (enforced in the API),
    /// null for donations / top-ups / campaign contributions.
    /// </summary>
    public string? Reason { get; set; }

    public virtual User? ReceiverUser { get; set; }

    public virtual User? SenderUser { get; set; }
}
