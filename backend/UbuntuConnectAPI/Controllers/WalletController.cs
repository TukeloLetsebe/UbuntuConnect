using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using UbuntuConnectAPI.Data;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/wallet")]
public class WalletController : ControllerBase
{
    private readonly AppDbContext _context;

    public WalletController(AppDbContext context)
    {
        _context = context;
    }

    [Authorize]
    [HttpGet("user/{userId}/balance")]
    public async Task<IActionResult> GetBalanceByUser(int userId)
    {
        var callerIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var callerId = int.Parse(callerIdClaim!);

        // Only view your own balance
        if (callerId != userId) return Forbid();

        var wallet = await _context.Wallets.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null) return NotFound();
        return Ok(new { wallet.WalletId, wallet.UserId, wallet.Balance });
    }
}