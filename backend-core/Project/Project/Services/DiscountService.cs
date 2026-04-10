using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using SalesHub.Data;
using SalesHub.DTOs;
using SalesHub.Models;
using System.Linq.Expressions;

namespace SalesHub.Services
{
    public class DiscountService : IDiscountService
    {
        private readonly ApplicationDbContext _context;

        public DiscountService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<(IEnumerable<OfferPreviewDto> Data, int Total)> GetAllAsync(int page, int pageSize)
        {
            var query = _context.Offers.AsNoTracking().Where(o => o.IsActive);
            var total = await query.CountAsync();
            var data = await query
                .Include(o => o.Place)
                .OrderByDescending(o => o.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(MapToPreviewDto())
                .ToListAsync();

            return (data, total);
        }

        public async Task<IEnumerable<OfferPreviewDto>> GetByCategoryNameAsync(string categoryName)
        {
            return await _context.Offers
                .AsNoTracking()
                .Where(o => o.Category.Name.ToLower() == categoryName.ToLower() && o.IsActive)
                .Include(o => o.Place)
                .Select(MapToPreviewDto())
                .ToListAsync();
        }

        public async Task<OfferResponseDto?> GetByIdAsync(int id)
        {
            return await _context.Offers
                .AsNoTracking()
                .Include(o => o.Place)
                .Include(o => o.Images)
                .Where(o => o.Id == id)
                .Select(o => new OfferResponseDto
                {
                    Id = o.Id,
                    Title = o.Title,
                    NewPrice = o.NewPrice,
                    OldPrice = o.OldPrice,
                    IsOnline = o.Place.IsOnline,
                    StoreName = o.Place.Name,
                    OfferUrl = o.Place.OfferUrl,
                    Latitude = !o.Place.IsOnline && o.Place.Location != null ? o.Place.Location.Y : null,
                    Longitude = !o.Place.IsOnline && o.Place.Location != null ? o.Place.Location.X : null,
                    ImageUrls = o.Images.Select(i => i.ImageUrl).ToList()
                })
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<OfferPreviewDto>> SearchAsync(string query)
        {
            var searchTerm = query.Trim().ToLower();
            return await _context.Offers
                .AsNoTracking()
                .Include(o => o.Place)
                .Where(o => o.IsActive && (o.Title.ToLower().Contains(searchTerm) || o.Description.ToLower().Contains(searchTerm)))
                .Select(MapToPreviewDto())
                .ToListAsync();
        }

        public async Task<int> CreateOfferAsync(OfferCreateDto dto)
        {
            var offer = new Offer
            {
                Title = dto.Title,
                Description = dto.Description,
                NewPrice = dto.NewPrice,
                OldPrice = dto.OldPrice,
                ValidTo = dto.ValidTo,
                CategoryId = dto.CategoryId,
                PlaceId = dto.PlaceId,
                IsActive = true,
                Creator = OfferCreator.User
            };

            if (dto.Latitude.HasValue && dto.Longitude.HasValue)
            {
                var point = new Point(dto.Longitude.Value, dto.Latitude.Value) { SRID = 4326 };
                var place = await _context.Places.FindAsync(dto.PlaceId);
                if (place != null)
                {
                    place.Location = point;
                    _context.Entry(place).State = EntityState.Modified;
                }
            }

            _context.Offers.Add(offer);
            await _context.SaveChangesAsync();
            return offer.Id;
        }

        public async Task<bool> UpdateStatusAsync(int id, bool isActive)
        {
            var offer = await _context.Offers.FindAsync(id);
            if (offer == null) return false;
            offer.IsActive = isActive;
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var offer = await _context.Offers.FindAsync(id);
            if (offer == null) return false;
            _context.Offers.Remove(offer);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<IEnumerable<object>> GetNearbyAsync(double lat, double lon, double radiusMeters)
        {
            var userLocation = new Point(lon, lat) { SRID = 4326 };
            return await _context.Offers
                .AsNoTracking()
                .Include(o => o.Place)
                .Where(o => o.IsActive && o.Place.Location != null && o.Place.Location.Distance(userLocation) <= radiusMeters)
                .OrderBy(o => o.Place.Location.Distance(userLocation))
                .Select(o => new {
                    o.Id,
                    o.Title,
                    Price = o.NewPrice,
                    StoreName = o.Place.Name,
                    Distance = Math.Round(o.Place.Location.Distance(userLocation))
                })
                .ToListAsync();
        }

        public async Task<string> UploadImageAsync(int id, IFormFile file)
        {
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var fileName = Guid.NewGuid().ToString() + "_" + file.FileName;
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var image = new OfferImage { ImageUrl = $"/images/{fileName}", OfferId = id };
            _context.OfferImages.Add(image);
            await _context.SaveChangesAsync();
            return image.ImageUrl;
        }

        private static Expression<Func<Offer, OfferPreviewDto>> MapToPreviewDto()
        {
            return o => new OfferPreviewDto
            {
                Id = o.Id,
                Title = o.Title,
                NewPrice = o.NewPrice,
                OldPrice = o.OldPrice,
                StoreName = o.Place.Name,
                MainImageUrl = o.Images.OrderBy(i => i.Id).Select(i => i.ImageUrl).FirstOrDefault()
            };
        }
    }
}