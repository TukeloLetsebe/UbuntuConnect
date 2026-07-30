namespace UbuntuConnectAPI.DTOs.Requests;

namespace UbuntuConnectAPI.DTOs.Requests;

public class UpdateCampaignRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string? Requirements { get; set; }
    public decimal? BudgetPerPartner { get; set; }
}
