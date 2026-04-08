using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using SalesHub.Data;
using SalesHub.Models;

namespace Project.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DiscountsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DiscountsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Отримати список усіх активних знижок з пагінацією
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
        /// </summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var offer = await _context.Offers
                .Include(o => o.Place)
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
            if (string.IsNullOrWhiteSpace(q)) return BadRequest(new { message = "Запит порожній" });

            var results = await _context.Offers
                .Where(o => o.Title.Contains(q) || o.Description.Contains(q))
                .ToListAsync();

            return Ok(results);
        }


        /// <summary>
        /// Створити нову знижку
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Offer offer)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            _context.Offers.Add(offer);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = offer.Id }, offer);
        }

        /// <summary>
        /// Повне оновлення даних про знижку
        /// </summary>
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] Offer updatedOffer)
        {
            if (id != updatedOffer.Id) return BadRequest("ID не збігається");

            _context.Entry(updatedOffer).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Offers.Any(e => e.Id == id)) return NotFound();
                throw;
            }

            return NoContent();
        }

        /// <summary>
        /// Часткове оновлення (деактивація знижки)
        /// </summary>
        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromQuery] bool isActive)
        {
            var offer = await _context.Offers.FindAsync(id);
            if (offer == null) return NotFound();

            offer.IsActive = isActive;
            await _context.SaveChangesAsync();

            return Ok(offer);
        }

        /// <summary>
        /// Видалення знижки з бази
        /// </summary>
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var offer = await _context.Offers.FindAsync(id);
            if (offer == null) return NotFound();

            _context.Offers.Remove(offer);
            await _context.SaveChangesAsync();

            return NoContent();
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
    }
}