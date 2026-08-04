using System.ComponentModel.DataAnnotations;

namespace UbuntuConnectAPI.DTOs.Requests;

public class LogHoursRequest
{
    [Required]
    [Range(0.01, 999.99, ErrorMessage = "Hours must be between 0.01 and 999.99.")]
    public decimal Hours { get; set; }

    /// <summary>
    /// Optional — defaults to today (UTC) if not provided.
    /// </summary>
    public DateOnly? Date { get; set; }

    public string? Notes { get; set; }
}
