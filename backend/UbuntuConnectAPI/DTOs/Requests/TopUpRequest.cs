using System.ComponentModel.DataAnnotations;

namespace UbuntuConnectAPI.DTOs.Requests;

public class TopUpRequest
{
    [Required]
    [Range(0.01, 1000000, ErrorMessage = "Amount must be between 0.01 and 1,000,000.")]
    public decimal Amount { get; set; }
}
