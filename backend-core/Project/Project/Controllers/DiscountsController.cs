
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using SalesHub.Data;
using SalesHub.Models;
using SalesHub.DTOs;
using SalesHub.Services;


namespace Project.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DiscountsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IDiscountService _discountService;
        private readonly ILogger<DiscountsController> _logger;

     public DiscountsController(
            ApplicationDbContext context,
            IDiscountService discountService,
            ILogger<DiscountsController> logger)
        {
            _context = context;
            _discountService = discountService;
            _logger = logger;
        }

        /// <summary>
        /// Retrieves all active discounts with pagination and search.
        /// </summary>
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


        /// <summary>
        /// Отримати повну інформацію про одну знижку за її ID
        /// <summary>
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _discountService.GetCategoriesAsync();
            return Ok(categories);
        }


        /// <summary>
        /// Gets full details of a specific discount
        /// </summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            if (id <= 0) return BadRequest("Invalid ID.");

            var offer = await _discountService.GetByIdAsync(id);
            if (offer == null)
                return NotFound(new { message = $"Discount with ID {id} not found." });

            return Ok(offer);
        }

        


        /// <summary>
        /// Creates a new discount. Only for registered users/admins.
        /// </summary>
        // [Authorize]
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status403Forbidden)]
        [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> CreateOfferAsync([FromBody] OfferCreateDto dto, CancellationToken cancellationToken = default)
        {
            if (dto == null) return BadRequest();
            if (!ModelState.IsValid) return ValidationProblem(ModelState);

            try
            {
                if (dto.OldPrice.HasValue && dto.NewPrice >= dto.OldPrice.Value)
                {
                    return UnprocessableEntity(new { message = "The new price must be lower than the old price." });
                }

                var id = await _discountService.CreateOfferAsync(dto, cancellationToken);
                _logger.LogInformation("Created offer {OfferId} by user {User}", id, User?.Identity?.Name ?? "anonymous");
                return CreatedAtAction(nameof(GetById), new { id = id }, new { id });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Validation error while creating offer");
                return BadRequest(new ProblemDetails { Title = "Invalid input", Detail = ex.Message, Status = StatusCodes.Status400BadRequest });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while creating offer");
                return StatusCode(500, new { message = "Error saving offer", details = ex.Message });
            }
        }

        /// <summary>
        /// updates an existing discount. 
        /// </summary>
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] Offer updatedOffer)
        {
            if (id != updatedOffer.Id) return BadRequest("ID doesn't match");

            var existingOffer = await _context.Offers.FindAsync(id);
            if (existingOffer == null) return NotFound("Discount not found");

            existingOffer.Title = updatedOffer.Title;
            existingOffer.Description = updatedOffer.Description;
            existingOffer.NewPrice = updatedOffer.NewPrice;
            existingOffer.OldPrice = updatedOffer.OldPrice;
            existingOffer.ValidTo = updatedOffer.ValidTo;
            existingOffer.IsActive = updatedOffer.IsActive;
            existingOffer.CategoryId = updatedOffer.CategoryId;
            existingOffer.PlaceId = updatedOffer.PlaceId;

            if (existingOffer.NewPrice >= existingOffer.OldPrice)
                return BadRequest("New price must be less than the old one .");
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return StatusCode(409, "Update conflict. The data has been changed by someone else ");
            }

            return Ok(existingOffer);
        }
        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult> UpdateStatus(int id, bool isActive)
        {
            // Тільки валідація запиту
            if (id <= 0) return BadRequest("Invalid ID");

            // Виклик сервісу (вся робота там)
            var result = await _discountService.UpdateStatusAsync(id, isActive);

            return result ? Ok() : NotFound();
        }

            /// <summary>
            /// Admin Only: Deletes a discount from the system.
            /// </summary>
            // [Authorize(Roles = "Admin")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
            {
                var deleted = await _discountService.DeleteAsync(id);
                if (!deleted) return NotFound(new { message = "Discount not found" });

                return NoContent();
            }
        
        }
    }
