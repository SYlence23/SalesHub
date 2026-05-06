using Microsoft.AspNetCore.Mvc;
using SalesHub.DTOs;
using SalesHub.Services;

namespace SalesHub.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MapController : ControllerBase
    {
        private readonly IDiscountService _discountService;

        public MapController(IDiscountService discountService)
        {
            _discountService = discountService;
        }

        [HttpGet("nearby")]
        public async Task<IActionResult> GetNearby([FromQuery] LocationSearchRequest request)
        {
            if (request.Latitude == 0 || request.Longitude == 0)
                return BadRequest("Необхідні координати користувача.");

            var offers = await _discountService.GetByRadiusAsync(request);
            return Ok(offers);
        }

        [HttpGet("markers")]
        public async Task<IActionResult> GetMarkers([FromQuery] double minLat, [FromQuery] double maxLat, [FromQuery] double minLon, [FromQuery] double maxLon)
        {
             var markers = await _discountService.GetInBoundsAsync(minLat, maxLat, minLon, maxLon);
            return Ok(markers);
        }

        [HttpGet("offer/{id}")]
        public async Task<IActionResult> GetOffer(int id)
        {
            var offer = await _discountService.GetByIdAsync(id);
            if (offer == null) return NotFound("Знижку не знайдено.");
            return Ok(offer);
            
        }

        [HttpPost("share-location")]
        public IActionResult ShareLocation([FromBody] LocationSearchRequest request)
        {
            if (request.Latitude == 0 || request.Longitude == 0)
                return BadRequest("Необхідні координати користувача.");

            var latStr = request.Latitude.ToString(System.Globalization.CultureInfo.InvariantCulture);
            var lngStr = request.Longitude.ToString(System.Globalization.CultureInfo.InvariantCulture);

            var shareableLink = $"{Request.Scheme}://{Request.Host}/map?lat={latStr}&lng={lngStr}";
            
            return Ok(new { 
                Message = "Локацію успішно поширено.", 
                Link = shareableLink,
                Latitude = request.Latitude,
                Longitude = request.Longitude
            });
        }
    }
}
