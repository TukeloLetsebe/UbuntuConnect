using System;
using System.Collections.Generic;

namespace UbuntuConnectAPI.Models;

public partial class Verification
{
    public int VerificationId { get; set; }

    // A verification row belongs to EITHER an NPO or a Business (exactly one is
    // set). Both are nullable so the single table can represent both subjects.
    public int? NpoId { get; set; }

    public int? BusinessId { get; set; }

    public int? ReviewedByUserId { get; set; }

    // Document URLs. For an NPO these are the NPO certificate + tax certificate;
    // for a Business they are the CIPC registration document + tax clearance.
    public string? Npocertificate { get; set; }

    public string? NpotaxCertificate { get; set; }

    public string Status { get; set; } = null!;

    public DateTime SubmittedDate { get; set; }

    public DateTime? ReviewedDate { get; set; }

    public virtual Npo? Npo { get; set; }

    public virtual Business? Business { get; set; }

    public virtual User? ReviewedByUser { get; set; }
}
