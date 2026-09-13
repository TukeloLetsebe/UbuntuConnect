using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UbuntuConnectAPI.Services.Storage;

namespace UbuntuConnectAPI.Controllers;

[ApiController]
[Route("api/upload")]
[Authorize]
public class UploadController : ControllerBase
{
    private readonly IFileStorageService _storage;

    public UploadController(IFileStorageService storage)
    {
        _storage = storage;
    }

    /// <summary>
    /// Uploads an image (jpg/png/webp). Server resizes + compresses it and
    /// returns the public URL to store in a MediaUrl/ProfileImage field.
    /// </summary>
    [HttpPost("image")]
    public Task<IActionResult> UploadImage(IFormFile file, CancellationToken cancellationToken)
        => Handle(file, UploadKind.Image, cancellationToken);

    /// <summary>
    /// Uploads a document (pdf) for verification purposes. Returns the public URL.
    /// </summary>
    [HttpPost("document")]
    public Task<IActionResult> UploadDocument(IFormFile file, CancellationToken cancellationToken)
        => Handle(file, UploadKind.Document, cancellationToken);

    private async Task<IActionResult> Handle(IFormFile file, UploadKind kind, CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file was provided.");

        try
        {
            await using var stream = file.OpenReadStream();
            var stored = await _storage.SaveAsync(
                stream, file.FileName, file.ContentType, kind, cancellationToken);

            return Ok(new
            {
                url = stored.Url,
                fileName = stored.FileName,
                sizeBytes = stored.SizeBytes,
                contentType = stored.ContentType
            });
        }
        catch (FileValidationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
