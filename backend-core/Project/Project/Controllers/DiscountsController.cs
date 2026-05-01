using Microsoft.AspNetCore.Mvc;
using SalesHub.DTOs;
using SalesHub.Services;

namespace Project.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DiscountsController : ControllerBase
    {
        private readonly IDiscountService _discountService;

        public DiscountsController(IDiscountService discountService)
        {
            _discountService = discountService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? searchTerm = null,
            [FromQuery] int? categoryId = null,
            [FromQuery] string? sortOption = null)
        {
            if (page <= 0 || pageSize <= 0)
                return BadRequest("Page and PageSize must be greater than zero.");

            var result = await _discountService.GetAllAsync(page, pageSize, searchTerm, categoryId, sortOption);
            return Ok(new { Total = result.Total, Page = page, Data = result.Data });
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _discountService.GetCategoriesAsync();
            return Ok(categories);
        }


        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            if (id <= 0) return BadRequest("Invalid ID.");

            var offer = await _discountService.GetByIdAsync(id);
            if (offer == null)
                return NotFound(new { message = $"Discount with ID {id} not found." });

            return Ok(offer);
        }


        [HttpPost]
        public async Task<IActionResult> Create([FromBody] OfferCreateDto dto)
        {
             if (!ModelState.IsValid) return BadRequest(ModelState);

            //   бізнес-валідація цін
            if (dto.OldPrice.HasValue && dto.NewPrice >= dto.OldPrice.Value)
            {
                return UnprocessableEntity(new { message = "The new price must be lower than the old price." });
            }

            try
            {
                var id = await _discountService.CreateOfferAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = id }, new { id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error saving offer", details = ex.Message });
            }
        }

        

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _discountService.DeleteAsync(id);
            if (!deleted) return NotFound(new { message = "Discount not found" });

            return NoContent();
        }
        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromQuery] bool isActive)
        {
            var result = await _discountService.UpdateStatusAsync(id, isActive);
            if (!result) return NotFound("Offer not found");

            return Ok(new { message = $"Status updated to {isActive}" });
        }
    }
}