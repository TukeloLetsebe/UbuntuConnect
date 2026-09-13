using Microsoft.EntityFrameworkCore;
using UbuntuConnectAPI.Data;

namespace UbuntuConnectAPI.Services.Verification;

public class VerificationGate : IVerificationGate
{
    private readonly AppDbContext _context;

    public VerificationGate(AppDbContext context)
    {
        _context = context;
    }

    public async Task<GateResult> CanTransactAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UserId == userId, cancellationToken);

        if (user == null)
            return GateResult.Deny("User not found.");

        if (!user.IsActive)
            return GateResult.Deny("Your account is not active.");

        if (!user.IsEmailVerified)
            return GateResult.Deny("Please verify your email address before performing this action.");

        if (!user.IsVerified)
            return GateResult.Deny("Your identity must be verified before you can donate, top up, or volunteer. Please complete identity verification.");

        return GateResult.Ok();
    }
}
