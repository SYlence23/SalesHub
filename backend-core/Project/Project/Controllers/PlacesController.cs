using Microsoft.AspNetCore.Mvc;
using SalesHub.DTOs;
using SalesHub.Services;

namespace Project.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PlacesController : ControllerBase
    {
        private readonly IPlaceService _placeService;

        public PlacesController(IPlaceService placeService)
        {
            _placeService = placeService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var places = await _placeService.GetAllAsync();
            return Ok(places);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PlaceCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var id = await _placeService.CreateAsync(dto);
                // Return just the created ID or an object containing it
                return Ok(new { id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error saving place", details = ex.Message });
            }
        }
    }
}
