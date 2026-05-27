using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using SalesHub.Data;
using SalesHub.Models;
using SalesHub.DTOs;
using SalesHub.Services;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;


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
            [FromQuery] string? sortOption = null,
            [FromQuery] bool? archived = null)
        {
            if (page <= 0 || pageSize <= 0)
                return BadRequest("Сторінка та розмір сторінки мають бути більше нуля.");

            var result = await _discountService.GetAllAsync(page, pageSize, searchTerm, categoryId, sortOption, archived);
            return Ok(new { Total = result.Total, Page = page, Data = result.Data });
        }

        /// <summary>
        /// Отримати найпопулярніші знижки, відсортовані за рейтингом (лайки - дизлайки).
        /// </summary>
        [HttpGet("popular")]
        public async Task<IActionResult> GetPopular(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] int? categoryId = null)
        {
            if (page <= 0 || pageSize <= 0)
                return BadRequest("Сторінка та розмір сторінки мають бути більше нуля.");

            var result = await _discountService.GetAllAsync(page, pageSize, sortOption: "popular", categoryId: categoryId);
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
            if (id <= 0) return BadRequest("Невірний ID.");

            var offer = await _discountService.GetByIdAsync(id);
            if (offer == null)
                return NotFound(new { message = $"Знижку з ID {id} не знайдено." });

            return Ok(offer);
        }

        


        /// <summary>
        /// Creates a new discount. Only for registered users/admins.
        /// </summary>
        // [Authorize]
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] OfferCreateDto dto)
        {
            if (!ModelState.IsValid) 
            {
                var errors = string.Join(" | ", ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage));
                _logger.LogWarning("Validation failed: {Errors}", errors);
                return ValidationProblem(ModelState);
            }

            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdString, out int userId)) 
                return Unauthorized(new { message = "Невірний токен або ID користувача" });

            try
            {
                var id = await _discountService.CreateOfferAsync(dto, userId);
                return CreatedAtAction(nameof(GetById), new { id = id }, new { id });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Validation error while creating offer");
                return BadRequest(new ProblemDetails { Title = "Невірні дані", Detail = ex.Message, Status = StatusCodes.Status400BadRequest });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while creating offer");
                return StatusCode(500, new { message = "Помилка збереження знижки", details = ex.Message });
            }
        }

       
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] OfferUpdateDto dto)
        {
            var existingOffer = await _context.Offers.FindAsync(id);
            if (existingOffer == null) return NotFound("Discount not found");

            existingOffer.Title = dto.Title;
            existingOffer.Description = dto.Description;
            existingOffer.NewPrice = dto.NewPrice;
            existingOffer.OldPrice = dto.OldPrice;
            existingOffer.ValidTo = dto.ValidTo;
            existingOffer.IsActive = dto.IsActive;

            if (existingOffer.NewPrice >= existingOffer.OldPrice)
                return BadRequest("Нова ціна має бути меншою за стару.");
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return StatusCode(409, "Update conflict. The data has been changed by someone else.");
            }

            return NoContent();
        }

        [HttpPatch("{id:int}/status")]
        [Authorize]
        public async Task<IActionResult> UpdateStatus(int id, [FromQuery] bool isActive)
        {
            // Тільки валідація запиту
            if (id <= 0) return BadRequest("Невірний ID");

            // Виклик сервісу (вся робота там)
            var result = await _discountService.UpdateStatusAsync(id, isActive);

            return result ? Ok() : NotFound();
        }

            /// <summary>
            /// Admin Only: Deletes a discount from the system.
            /// </summary>
            // [Authorize(Roles = "Admin")]
        [HttpDelete("{id:int}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _discountService.DeleteAsync(id);
            if (!deleted) return NotFound(new { message = "Знижку не знайдено" });

            return NoContent();
        }

        /// <summary>
        /// Архівує усі знижки з вичерпаним терміном дії
        /// </summary>
        [HttpPost("archive-expired")]
        [Authorize]
        public async Task<IActionResult> ArchiveExpired()
        {
            var count = await _discountService.ArchiveExpiredAsync();
            return Ok(new { archivedCount = count, message = $"Архівовано {count} знижок." });
        }

        [HttpGet("{id:int}/reviews")]
        public async Task<IActionResult> GetReviews(int id)
        {
            var reviews = await _discountService.GetReviewsAsync(id);
            return Ok(reviews);
        }

        [HttpPost("{id:int}/reviews")]
        [Authorize]
        public async Task<IActionResult> PostReview(int id, [FromBody] OfferReviewCreateDto dto)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdString, out int userId)) 
                return Unauthorized();

            var review = await _discountService.AddOrUpdateReviewAsync(id, userId, dto);
            if (review == null) return NotFound(new { message = "Знижку не знайдено" });

            return Ok(review);
        }

        [HttpGet("{id:int}/review/check")]
        [Authorize]
        public async Task<IActionResult> CheckReview(int id)
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdString, out int userId)) 
                return Unauthorized();

            var review = await _context.OfferReviews
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.OfferId == id && r.CreatedById == userId);

            if (review == null)
            {
                return Ok(new { hasReview = false, isRecommended = false, comment = "" });
            }

            return Ok(new { hasReview = true, isRecommended = review.IsRecommended, comment = review.Comment });
        }
        
        }
    }