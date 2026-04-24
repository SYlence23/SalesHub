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

        public async Task<(IEnumerable<OfferPreviewDto> Data, int Total)> GetAllAsync(int page, int pageSize, string? searchTerm = null, int? categoryId = null, string? sortOption = null)
        {
            var query = _context.Offers.AsNoTracking().Where(o => o.IsActive);

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var term = searchTerm.Trim().ToLower();
                query = query.Where(o => o.Title.ToLower().Contains(term) || o.Description.ToLower().Contains(term));
            }

            if (categoryId.HasValue)
            {
                query = query.Where(o => o.CategoryId == categoryId.Value);
            }


            query = sortOption switch
            {
                "newest" => query.OrderBy(o => o.CreatedAt),
                "price_asc" => query.OrderBy(o => o.NewPrice),
                "price_desc" => query.OrderByDescending(o => o.NewPrice),
                "discount_desc" => query.OrderByDescending(query => (query.OldPrice - query.NewPrice) * 100 / query.OldPrice),
                _ => query.OrderByDescending(o => o.Id)
            };

            var data = await query
                .Include(o => o.Place)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(MapToPreviewDto())
                .ToListAsync();

            return (data, total: await query.CountAsync());
        }

        public async Task<IEnumerable<CategoryPreviewDto>> GetCategoriesAsync()
        {
            return await _context.OfferCategories
                .AsNoTracking()
                .Select(c => new CategoryPreviewDto { Id = c.Id, Name = c.Name })
                .ToListAsync();
        }

        public async Task<OfferResponseDto?> GetByIdAsync(int id)
        {
            return await _context.Offers
                .AsNoTracking()
                .Include(o => o.Place)
                    .ThenInclude(p => p.PlaceLocations)
                    .ThenInclude(pl => pl.Location)
                .Include(o => o.Category)
                .Include(o => o.Images)
                .Where(o => o.Id == id)
                .Select(o => new OfferResponseDto
                {
                    Id = o.Id,
                    Title = o.Title,
                    CategoryName = o.Category.Name,
                    NewPrice = o.NewPrice,
                    OldPrice = o.OldPrice,
                    ValidFrom = o.ValidFrom,
                    ValidTo = o.ValidTo,
                    IsOnline = o.Place.IsOnline,
                    StoreName = o.Place.Name,
                    OfferUrl = o.Place.OfferUrl,
                    Latitude = o.Place.PlaceLocations.Select(pl => (double?)pl.Location.Coordinates.Y).FirstOrDefault(),
                    Longitude = o.Place.PlaceLocations.Select(pl => (double?)pl.Location.Coordinates.X).FirstOrDefault(),
                    ImageUrls = o.Images.Select(i => i.ImageUrl).ToList()
                })
                .FirstOrDefaultAsync();
        }


        public async Task<int> CreateOfferAsync(OfferCreateDto dto)
        {
            return await CreateOfferAsync(dto, CancellationToken.None);
        }

        public async Task<int> CreateOfferAsync(OfferCreateDto dto, CancellationToken cancellationToken = default)
        {
            int finalPlaceId;

            if (dto.PlaceId.HasValue
                && dto.PlaceId.Value > 0)
            {
                finalPlaceId = dto.PlaceId.Value;
            }
            else if (!string.IsNullOrWhiteSpace(dto.NewPlaceName))
            {
                var newLocation = new SalesHub.Models.Location
                {
                    Address = dto.NewPlaceAddress ?? "Address not provided",
                    Coordinates = (dto.Longitude.HasValue && dto.Latitude.HasValue)
                       ? new Point(dto.Longitude.Value, dto.Latitude.Value) { SRID = 4326 } : null
                };

                var newPlace = new Place
                {
                    Name = dto.NewPlaceName,
                    Description = dto.Description ?? "New place added by user",
                    IsOnline = false,
                    OfferUrl = ""
                };

                var placeLocation = new PlaceLocation
                {
                    Place = newPlace,
                    Location = newLocation
                };

                newPlace.PlaceLocations.Add(placeLocation);

                _context.Places.Add(newPlace);
                await _context.SaveChangesAsync(cancellationToken);

                finalPlaceId = newPlace.Id;
            }
            else
            {
                throw new ArgumentException("You must provide either an existing PlaceId or a NewPlaceName.");
            }

            var offer = new Offer
            {
                Title = dto.Title,
                Description = dto.Description ?? "",
                NewPrice = dto.NewPrice,
                OldPrice = dto.OldPrice,
                ValidFrom = dto.ValidFrom ?? DateTime.UtcNow,
                ValidTo = dto.ValidTo,
                CategoryId = dto.CategoryId,
                PlaceId = finalPlaceId,
                IsActive = true,
                Creator = OfferCreator.User
            };

            _context.Offers.Add(offer);
            await _context.SaveChangesAsync(cancellationToken);

            return offer.Id;
        }
        public async Task<bool> UpdateStatusAsync(int id, bool isActive)
        {
            var offer = await _context.Offers.FindAsync(id);
            if (offer == null) return false;

            offer.IsActive = isActive;

            await _context.SaveChangesAsync();
            return true;
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
                    .ThenInclude(p => p.PlaceLocations)
                    .ThenInclude(pl => pl.Location)
                .Where(o => o.IsActive && o.Place.PlaceLocations.Any(pl => pl.Location.Coordinates.Distance(userLocation) <= radiusMeters))
                .Select(o => new {
                    o.Id,
                    o.Title,
                    Price = o.NewPrice,
                    StoreName = o.Place.Name,
                    Distance = Math.Round(o.Place.PlaceLocations
                        .Min(pl => pl.Location.Coordinates.Distance(userLocation)))
                })
                .OrderBy(x => x.Distance)
                .ToListAsync();
        }
        public async Task<string> UploadImageAsync(int id, IFormFile file, CancellationToken cancellationToken = default)
        {
            var urls = await UploadImagesAsync(id, new[] { file }, cancellationToken);
            return urls.FirstOrDefault() ?? string.Empty;
        }

        public async Task<IEnumerable<string>> UploadImagesAsync(int id, IEnumerable<IFormFile> files, CancellationToken cancellationToken = default)
        {
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var result = new List<string>();

            foreach (var file in files)
            {
                var fileName = Guid.NewGuid().ToString() + "_" + file.FileName;
                var filePath = Path.Combine(uploadsFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream, cancellationToken);
                }

                var image = new OfferImage { ImageUrl = $"/images/{fileName}", OfferId = id };
                _context.OfferImages.Add(image);
                result.Add(image.ImageUrl);
            }

            await _context.SaveChangesAsync(cancellationToken);
            return result;
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
                CreatedAt = o.Id > 0 ? DateTime.UtcNow : o.Id == 0 ? DateTime.UtcNow : DateTime.MinValue, // Або просто o.CreatedAt, якщо воно є в BaseEntity
                MainImageUrl = o.Images.OrderBy(i => i.Id).Select(i => i.ImageUrl).FirstOrDefault()
                // Distance заповнюється окремо в методі GetNearbyAsync
            };
        }
    }
}
