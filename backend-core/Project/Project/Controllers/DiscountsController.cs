
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
        public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var query = _context.Offers.AsNoTracking();

            var total = await query.CountAsync();
            var data = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new { Total = total, Page = page, Data = data });
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
        /// Gets full details of a specific discount.

        /// </summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            var offer = await _context.Offers
                .Include(o => o.Place)
                .Include(o => o.Images)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (offer == null) return NotFound();
            return Ok(offer);
        }

        /// <summary>
        /// Пошук знижок за ключовим словом (назва або опис)
        /// </summary>
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q)) return BadRequest(new { message = "Request is empty" });

            var results = await _context.Offers
                .Include(o => o.Images)
                .Include(o => o.Place)
                .Where(o => o.Title.Contains(q) || o.Description.Contains(q))
                .ToListAsync();

            return Ok(results);
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
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Повне оновлення даних про знижку
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
        /// Отримати знижки у видимому прямокутнику карти (Bounds)
        /// </summary>
        [HttpGet("map-bounds")]
        public async Task<IActionResult> GetInBounds(double minLat, double minLon, double maxLat, double maxLon)
        {
            var boundary = new Envelope(minLon, maxLon, minLat, maxLat);
            var factory = new GeometryFactory(new PrecisionModel(), 4326);
            var polygon = factory.ToGeometry(boundary);

            var offers = await _context.Offers
                .Include(o => o.Place)
                .Where(o => o.Place != null && o.Place.Location != null && o.Place.Location.Within(polygon))
                .ToListAsync();

            return Ok(offers);
        }

        /// <summary>
        /// Знайти знижки в радіусі X метрів від користувача
        /// </summary>
        [HttpGet("nearby")]
        public async Task<IActionResult> GetNearby(double lat, double lon, double radiusMeters = 2000)
        {
            var userLocation = new Point(lon, lat) { SRID = 4326 };

            var offers = await _context.Offers
                .Include(o => o.Place)
                .Where(o => o.Place != null && o.Place.Location != null && o.Place.Location.Distance(userLocation) <= radiusMeters)
                .OrderBy(o => o.Place!.Location!.Distance(userLocation))
                .Select(o => new {
                    o.Id,
                    o.Title,
                    Price = o.NewPrice,
                    StoreName = o.Place!.Name,
                    Distance = Math.Round(o.Place.Location!.Distance(userLocation))
                })
                .ToListAsync();

            return Ok(offers);
        }


            /// <summary>
            ///  Uploads an image for an existing discount.
            /// </summary>
        [HttpPost("{id:int}/upload-image")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadImage([FromRoute] int id, [FromForm] IEnumerable<IFormFile> files)
            {
                if (files == null || !files.Any()) return BadRequest("No files selected.");

                var offerExists = await _discountService.GetByIdAsync(id);
                if (offerExists == null) return NotFound("Discount not found");

                try
                {
                    var urls = await _discountService.UploadImagesAsync(id, files);
                    return Ok(new { urls });
                }
                catch (Exception ex)
                {
                    return BadRequest(new { message = "File upload failed", error = ex.Message });
                }
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
