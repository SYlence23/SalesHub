using Microsoft.AspNetCore.Authorization;
using System;
using Microsoft.AspNetCore.Mvc;
using SalesHub.DTOs;
using SalesHub.Services;
using System.Security.Claims;

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
            if (id <= 0) return BadRequest("Невірний ID.");

            var place = await _placeService.GetPlaceDetailsAsync(id);
            if (place == null)
                return NotFound(new { message = $"Заклад з ID {id} не знайдено." });

            
            return Ok(place);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] PlaceCreateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdString, out int userId)) 
                return Unauthorized(new { message = "Невірний токен або ID користувача" });

            try
            {
                var id = await _placeService.CreateAsync(dto, userId);
                // Return just the created ID or an object containing it
                return Ok(new { id });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}
