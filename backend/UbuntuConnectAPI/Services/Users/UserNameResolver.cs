using Microsoft.EntityFrameworkCore;
using UbuntuConnectAPI.Data;

namespace UbuntuConnectAPI.Services.Users;

public class UserNameResolver : IUserNameResolver
{
    private readonly AppDbContext _context;

    public UserNameResolver(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Dictionary<int, string>> ResolveAsync(IEnumerable<int> userIds, CancellationToken cancellationToken = default)
    {
        var ids = userIds.Distinct().ToList();
        if (ids.Count == 0) return new();

        var users = await _context.Users
            .Where(u => ids.Contains(u.UserId))
            .Select(u => new
            {
                u.UserId,
                u.UserEmail,
                individual = u.Individuals.Select(i => i.FirstName + " " + i.LastName).FirstOrDefault(),
                npo = u.Npos.Select(n => n.OrganizationName).FirstOrDefault(),
                business = u.Businesses.Select(b => b.ContactPersonName).FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        return users.ToDictionary(
            u => u.UserId,
            u => u.individual ?? u.npo ?? u.business ?? u.UserEmail);
    }
}
