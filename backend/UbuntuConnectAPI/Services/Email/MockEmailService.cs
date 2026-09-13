using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace UbuntuConnectAPI.Services.Email;

/// <summary>
/// Development email service. Does NOT send real email. Instead it logs the
/// full message (so a verification link/code is visible in the API console)
/// and keeps the most recent messages in memory so tests and a demo can
/// assert what "would have been sent".
/// </summary>
public class MockEmailService : IEmailService
{
    private readonly ILogger<MockEmailService> _logger;

    // Bounded in-memory outbox for demo/testing visibility.
    private static readonly ConcurrentQueue<EmailMessage> _sent = new();
    private const int MaxRetained = 100;

    public MockEmailService(ILogger<MockEmailService> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(EmailMessage message, CancellationToken cancellationToken = default)
    {
        _sent.Enqueue(message);
        while (_sent.Count > MaxRetained && _sent.TryDequeue(out _)) { }

        _logger.LogInformation(
            "[MOCK EMAIL] To: {To} | Subject: {Subject}\n{Body}",
            message.ToEmail, message.Subject, message.Body);

        return Task.CompletedTask;
    }

    /// <summary>Most recent mock emails (newest last). For tests/demo only.</summary>
    public static IReadOnlyList<EmailMessage> SentMessages => _sent.ToArray();

    /// <summary>Clears the in-memory outbox. For test isolation.</summary>
    public static void Clear()
    {
        while (_sent.TryDequeue(out _)) { }
    }
}
