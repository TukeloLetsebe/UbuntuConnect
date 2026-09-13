using Xunit;

namespace UbuntuConnectAPI.Tests;

/// <summary>
/// Test classes that assert against MockEmailService's static in-memory outbox
/// must not run in parallel with each other — one test's Clear() would race
/// another's SentMessages assertion. Placing them in a single (non-parallel)
/// collection serialises them while still allowing the rest of the suite to
/// run in parallel.
/// </summary>
[CollectionDefinition("EmailOutbox", DisableParallelization = true)]
public class EmailOutboxCollection { }
