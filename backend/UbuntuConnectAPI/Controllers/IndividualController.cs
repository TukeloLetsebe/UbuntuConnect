using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UbuntuConnectAPI.Data;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/individual")]
public class IndividualController : ControllerBase
{
    private readonly AppDbContext _context;

    public IndividualController(AppDbContext context)
    {
        _context = context;
    }

    //DISCOVER NPOs
    [HttpGet("discover-NPOs")]
    public async Task<IActionResult> DiscoverNpos()
    {
        var npos = await _context.Npos
            .Include(n => n.User)   // pulls in Users data (Location, IsVerified)
            .Select(n => new
            {
                npoId = n.NpoId,
                organizationName = n.OrganizationName,
                focusArea = n.NpofocusArea,
                mission = n.Npomission,
                location = n.User.Location,
                isVerified = n.User.IsVerified
            })
            .ToListAsync();

        return Ok(npos);
    }
}