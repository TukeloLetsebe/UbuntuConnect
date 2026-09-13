using System;
using System.Collections.Generic;

namespace UbuntuConnectAPI.Models;

public partial class Individual
{
    public int IndividualId { get; set; }

    public int UserId { get; set; }

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    public string? CauseOfCare { get; set; }

    // ── Identity verification (KYC) ──
    public string? IdNumber { get; set; }

    public string? IdDocumentUrl { get; set; }

    public string? SelfieUrl { get; set; }

    /// <summary>NotSubmitted | Pending | Approved | Rejected.</summary>
    public string KycStatus { get; set; } = "NotSubmitted";

    /// <summary>Admin | FaceScan — which route the user chose.</summary>
    public string? KycRoute { get; set; }

    /// <summary>Similarity score from the face-scan route (0-1), if used.</summary>
    public decimal? KycMatchScore { get; set; }

    public int? ReviewedByUserId { get; set; }

    public DateTime? SubmittedDate { get; set; }

    public DateTime? ReviewedDate { get; set; }

    public virtual User User { get; set; } = null!;
}
