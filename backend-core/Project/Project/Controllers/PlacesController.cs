using Microsoft.AspNetCore.Mvc;
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
            var places = await _placeService.GetAllPlacesAsync();
            return Ok(places);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            if (id <= 0) return BadRequest("Invalid ID.");

            var place = await _placeService.GetPlaceDetailsAsync(id);
            if (place == null)
                return NotFound(new { message = $"Place with ID {id} not found." });

            return Ok(place);
        }
    }
}
