using System.ComponentModel.DataAnnotations;

namespace UbuntuConnectAPI.DTOs.Requests;

public class TopUpRequest
{
    [Required]
    [Range(0.01, 1000000, ErrorMessage = "Amount must be between 0.01 and 1,000,000.")]
    public decimal Amount { get; set; }

    // Simulated card details. Optional so existing callers (e.g. project
    // donations that reuse this DTO) keep working; when any card field is
    // supplied the top-up endpoints validate the card via the payment simulator.
    public string? CardNumber { get; set; }
    public string? CardExpiry { get; set; }
    public string? CardCvv { get; set; }
}
