using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesHub.DTOs;
using SalesHub.Services;
using System.Security.Claims;

namespace Project.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GoodDealsController : ControllerBase
    {
        private readonly IGoodDealService _goodDealService;
        private readonly ILogger<GoodDealsController> _logger;

        public GoodDealsController(IGoodDealService goodDealService, ILogger<GoodDealsController> logger)
        {
            _goodDealService = goodDealService;
            _logger = logger;
        }

        /// <summary>
        /// Retrieves all active good deals with pagination and optional search/category filter.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? searchTerm = null,
            [FromQuery] int? categoryId = null,
            [FromQuery] string? audience = null,
            [FromQuery] bool? archived = null)
        {
            if (page <= 0 || pageSize <= 0)
                return BadRequest("Сторінка та розмір сторінки мають бути більше нуля.");

            var result = await _goodDealService.GetAllAsync(page, pageSize, searchTerm, categoryId, audience, archived);
            return Ok(new { Total = result.Total, Page = page, Data = result.Data });
        }

        /// <summary>
        /// Gets full details of a specific good deal.
        /// </summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            if (id <= 0) return BadRequest("Невірний ID.");
            var deal = await _goodDealService.GetByIdAsync(id);
            if (deal == null) return NotFound(new { message = $"Пропозицію з ID {id} не знайдено." });
            return Ok(deal);
        }

        /// <summary>
        /// Creates a new good deal. Requires authentication.
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] GoodDealCreateDto dto)
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
                var id = await _goodDealService.CreateAsync(dto, userId);
                return CreatedAtAction(nameof(GetById), new { id }, new { id });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Validation error while creating good deal");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while creating good deal");
                return StatusCode(500, new { message = "Помилка збереження пропозиції", details = ex.Message });
            }
        }

        /// <summary>
        /// Updates the active status of a good deal.
        /// </summary>
        [HttpPatch("{id:int}/status")]
        [Authorize]
        public async Task<IActionResult> UpdateStatus(int id, [FromQuery] bool isActive)
        {
            if (id <= 0) return BadRequest("Невірний ID");
            var result = await _goodDealService.UpdateStatusAsync(id, isActive);
            return result ? Ok() : NotFound();
        }

        /// <summary>
        /// Deletes a good deal.
        /// </summary>
        [HttpDelete("{id:int}")]
        [Authorize]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _goodDealService.DeleteAsync(id);
            if (!deleted) return NotFound(new { message = "Пропозицію не знайдено" });
            return NoContent();
        }

        /// <summary>
        /// Архівує усі пропозиції з вичерпаним терміном дії
        /// </summary>
        [HttpPost("archive-expired")]
        [Authorize]
        public async Task<IActionResult> ArchiveExpired()
        {
            var count = await _goodDealService.ArchiveExpiredAsync();
            return Ok(new { archivedCount = count, message = $"Архівовано {count} пропозицій." });
        }
    }
}
