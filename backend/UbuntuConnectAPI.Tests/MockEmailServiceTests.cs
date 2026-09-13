using Microsoft.Extensions.Logging.Abstractions;
using UbuntuConnectAPI.Services.Email;
using Xunit;

namespace UbuntuConnectAPI.Tests;

[Collection("EmailOutbox")]
public class MockEmailServiceTests
{
    [Fact]
    public async Task SendAsync_records_the_message_in_the_outbox()
    {
        MockEmailService.Clear();
        var svc = new MockEmailService(NullLogger<MockEmailService>.Instance);

        var message = new EmailMessage
        {
            ToEmail = "someone@test.local",
            Subject = "Verify your email",
            Body = "Click here: http://localhost:5173/verify-email?token=abc123"
        };

        await svc.SendAsync(message);

        var sent = MockEmailService.SentMessages;
        Assert.Contains(sent, m =>
            m.ToEmail == message.ToEmail &&
            m.Subject == message.Subject &&
            m.Body.Contains("token=abc123"));
    }
}
