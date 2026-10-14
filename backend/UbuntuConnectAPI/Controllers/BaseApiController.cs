using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace UbuntuConnectAPI.Controllers;

/// <summary>
/// Base controller exposing the authenticated caller's user id. Centralizes the
/// JWT NameIdentifier parsing that was previously repeated in every controller.
/// A missing or malformed claim throws <see cref="UnauthorizedAccessException"/>,
/// which the global handler maps to a clean 401 (instead of an unhandled 500).
/// </summary>
public abstract class BaseApiController : ControllerBase
{
    /// <summary>The authenticated caller's user id. Throws 401 if absent/invalid.</summary>
    protected int CallerId
    {
        get
        {
            var raw = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(raw, out var id)) return id;
            throw new UnauthorizedAccessException("Your session is invalid or has expired. Please sign in again.");
        }
    }
}
