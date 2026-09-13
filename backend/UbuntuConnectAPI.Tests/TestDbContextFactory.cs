using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using UbuntuConnectAPI.Data;

namespace UbuntuConnectAPI.Tests;

/// <summary>
/// Builds an isolated in-memory AppDbContext per test (unique DB name),
/// so tests never share state.
/// </summary>
internal static class TestDbContextFactory
{
    public static AppDbContext Create()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            // Register uses explicit transactions; InMemory has no real transactions,
            // so we tell EF to ignore that warning instead of throwing in tests.
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new AppDbContext(options);
    }
}
