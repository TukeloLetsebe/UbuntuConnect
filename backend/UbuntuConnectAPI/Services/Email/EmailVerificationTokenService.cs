using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using UbuntuConnectAPI.Data;
using UbuntuConnectAPI.Models;

namespace UbuntuConnectAPI.Services.Email;

public class EmailVerificationTokenService : IEmailVerificationTokenService
{
    private readonly AppDbContext _context;

    // Default token lifetime if the caller does not specify one.
    private static readonly TimeSpan DefaultLifetime = TimeSpan.FromHours(24);

    public EmailVerificationTokenService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<EmailVerificationToken> IssueAsync(
        int userId,
        string purpose = "EmailVerification",
        TimeSpan? lifetime = null,
        CancellationToken cancellationToken = default)
    {
        // Invalidate any existing unconsumed tokens of this purpose so only the
        // newest one is valid (matters for "resend verification").
        var existing = await _context.EmailVerificationTokens
            .Where(t => t.UserId == userId && t.Purpose == purpose && t.ConsumedAt == null)
            .ToListAsync(cancellationToken);

        var now = DateTime.UtcNow;
        foreach (var old in existing)
            old.ConsumedAt = now;

        var token = new EmailVerificationToken
        {
            UserId = userId,
            Token = GenerateToken(),
            Purpose = purpose,
            ExpiresAt = now.Add(lifetime ?? DefaultLifetime),
            CreatedAt = now
        };

        _context.EmailVerificationTokens.Add(token);
        await _context.SaveChangesAsync(cancellationToken);

        return token;
    }

    public async Task<EmailVerificationToken?> ValidateAsync(
        string token,
        string purpose = "EmailVerification",
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(token))
            return null;

        var entity = await _context.EmailVerificationTokens
            .FirstOrDefaultAsync(t => t.Token == token && t.Purpose == purpose, cancellationToken);

        if (entity == null)
            return null;
        if (entity.ConsumedAt != null)
            return null;
        if (entity.ExpiresAt <= DateTime.UtcNow)
            return null;

        return entity;
    }

    public async Task ConsumeAsync(EmailVerificationToken token, CancellationToken cancellationToken = default)
    {
        token.ConsumedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
    }

    /// <summary>URL-safe random token (~43 chars from 32 bytes).</summary>
    private static string GenerateToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');
    }
}
