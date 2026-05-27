using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using SalesHub.Data;
using SalesHub.DTOs;
using SalesHub.Models;

namespace SalesHub.Services
{
    public class GoodDealService : IGoodDealService
    {
        private readonly ApplicationDbContext _context;

        public GoodDealService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<(IEnumerable<GoodDealPreviewDto> Data, int Total)> GetAllAsync(
            int page, int pageSize, string? searchTerm = null, int? categoryId = null, string? audience = null, bool? archived = null)
        {
            IQueryable<GoodDeal> query;

            if (archived == true)
            {
                // Показати лише архівовані
                query = _context.GoodDeals.AsNoTracking().Where(gd => gd.IsArchived);
            }
            else
            {
                // За замовчуванням — лише активні, не архівовані
                query = _context.GoodDeals.AsNoTracking().Where(gd => gd.IsActive && !gd.IsArchived);
            }

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var term = searchTerm.Trim().ToLower();
                query = query.Where(gd => gd.Title.ToLower().Contains(term) ||
                                          (gd.Description != null && gd.Description.ToLower().Contains(term)));
            }

            if (categoryId.HasValue)
                query = query.Where(gd => gd.CategoryId == categoryId.Value);

            if (!string.IsNullOrWhiteSpace(audience))
                query = query.Where(gd => gd.TargetAudiences.Contains(audience));

            var total = await query.CountAsync();

            var data = await query
                .OrderByDescending(gd => gd.Id)
                .Include(gd => gd.Place)
                .Include(gd => gd.Category)
                .Include(gd => gd.CreatedBy)
                .Include(gd => gd.Images)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(gd => new GoodDealPreviewDto
                {
                    Id = gd.Id,
                    Title = gd.Title,
                    Description = gd.Description,
                    MainImageUrl = gd.Images.OrderBy(i => i.Id).Select(i => i.ImageUrl).FirstOrDefault(),
                    StoreName = gd.Place != null ? gd.Place.Name : "",
                    CreatedAt = gd.CreatedAt,
                    CreatorUserName = gd.CreatedBy != null ? gd.CreatedBy.Name : null,
                    CategoryName = gd.Category != null ? gd.Category.Name : null,
                    ValidFrom = gd.ValidFrom,
                    ValidTo = gd.ValidTo,
                    TargetAudiences = gd.TargetAudiences != null ? gd.TargetAudiences.ToList() : new List<string>(),
                })
                .ToListAsync();

            return (data, total);
        }

        public async Task<GoodDealResponseDto?> GetByIdAsync(int id)
        {
            return await _context.GoodDeals
                .AsNoTracking()
                .Include(gd => gd.Place)
                    .ThenInclude(p => p.PlaceLocations)
                    .ThenInclude(pl => pl.Location)
                .Include(gd => gd.Category)
                .Include(gd => gd.Images)
                .Include(gd => gd.CreatedBy)
                .Where(gd => gd.Id == id)
                .Select(gd => new GoodDealResponseDto
                {
                    Id = gd.Id,
                    Title = gd.Title,
                    Description = gd.Description,
                    CategoryName = gd.Category != null ? gd.Category.Name : "",
                    ValidFrom = gd.ValidFrom,
                    ValidTo = gd.ValidTo,
                    IsOnline = gd.Place != null && gd.Place.IsOnline,
                    StoreName = gd.Place != null ? gd.Place.Name : "",
                    OfferUrl = gd.Place != null ? gd.Place.OfferUrl : null,
                    Latitude = gd.Place != null ? gd.Place.PlaceLocations.Select(pl => (double?)pl.Location.Coordinates.Y).FirstOrDefault() : null,
                    Longitude = gd.Place != null ? gd.Place.PlaceLocations.Select(pl => (double?)pl.Location.Coordinates.X).FirstOrDefault() : null,
                    ImageUrls = gd.Images.Select(i => i.ImageUrl).ToList(),
                    CreatorUserName = gd.CreatedBy != null ? gd.CreatedBy.Name : null,
                    CreatedAt = gd.CreatedAt,
                    TargetAudiences = gd.TargetAudiences != null ? gd.TargetAudiences.ToList() : new List<string>(),
                })
                .FirstOrDefaultAsync();
        }

        public async Task<int> CreateAsync(GoodDealCreateDto dto, int userId)
        {
            int finalPlaceId;

            if (dto.PlaceId.HasValue && dto.PlaceId.Value > 0)
            {
                var existingPlace = await _context.Places.FindAsync(dto.PlaceId.Value);
                if (existingPlace == null)
                    throw new ArgumentException("Обраний заклад не знайдено.");
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
                    Description = "",
                    IsOnline = dto.IsNewPlaceOnline,
                    OfferUrl = dto.NewPlaceOfferUrl ?? "",
                    CreatedById = userId,
                };

                if (!dto.IsNewPlaceOnline)
                {
                    var placeLocation = new PlaceLocation
                    {
                        Place = newPlace,
                        Location = newLocation
                    };
                    newPlace.PlaceLocations.Add(placeLocation);
                }

                _context.Places.Add(newPlace);
                await _context.SaveChangesAsync();
                finalPlaceId = newPlace.Id;
            }
            else
            {
                throw new ArgumentException("Необхідно вказати існуючий PlaceId або назву нового закладу.");
            }

            var goodDeal = new GoodDeal
            {
                Title = dto.Title,
                Description = dto.Description ?? "",
                ValidFrom = dto.ValidFrom ?? DateTime.UtcNow,
                ValidTo = dto.ValidTo,
                CategoryId = dto.CategoryId,
                PlaceId = finalPlaceId,
                IsActive = true,
                CreatedById = userId,
                TargetAudiences = dto.TargetAudiences?.ToArray() ?? Array.Empty<string>(),
                Images = dto.ImageUrls?
                    .Where(url => !string.IsNullOrWhiteSpace(url))
                    .Select((url, index) => new GoodDealImage
                    {
                        ImageUrl = url,
                        IsMain = index == 0
                    }).ToList() ?? new List<GoodDealImage>()
            };

            _context.GoodDeals.Add(goodDeal);
            await _context.SaveChangesAsync();

            return goodDeal.Id;
        }

        public async Task<bool> UpdateStatusAsync(int id, bool isActive)
        {
            var deal = await _context.GoodDeals.FindAsync(id);
            if (deal == null) return false;

            deal.IsActive = isActive;

            if (!isActive)
            {
                // Деактивація — переміщуємо в архів
                deal.IsArchived = true;
            }
            else
            {
                // Реактивація — витягуємо з архіву
                deal.IsArchived = false;
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> ArchiveExpiredAsync()
        {
            var now = DateTime.UtcNow;
            var expired = await _context.GoodDeals
                .Where(gd => !gd.IsArchived && (gd.ValidTo != null && gd.ValidTo < now))
                .ToListAsync();

            foreach (var deal in expired)
            {
                deal.IsArchived = true;
                deal.IsActive = false;
            }

            if (expired.Any())
                await _context.SaveChangesAsync();

            return expired.Count;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var deal = await _context.GoodDeals.FindAsync(id);
            if (deal == null) return false;
            _context.GoodDeals.Remove(deal);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<IEnumerable<GoodDealPreviewDto>> GetByUserIdAsync(int userId)
        {
            return await _context.GoodDeals
                .AsNoTracking()
                .Where(gd => gd.CreatedById == userId)
                .Include(gd => gd.Place)
                .Include(gd => gd.Category)
                .Include(gd => gd.Images)
                .Include(gd => gd.CreatedBy)
                .OrderByDescending(gd => gd.Id)
                .Select(gd => new GoodDealPreviewDto
                {
                    Id = gd.Id,
                    Title = gd.Title,
                    Description = gd.Description,
                    MainImageUrl = gd.Images.OrderBy(i => i.Id).Select(i => i.ImageUrl).FirstOrDefault(),
                    StoreName = gd.Place != null ? gd.Place.Name : "",
                    CreatedAt = gd.CreatedAt,
                    CreatorUserName = gd.CreatedBy != null ? gd.CreatedBy.Name : null,
                    CategoryName = gd.Category != null ? gd.Category.Name : null,
                    ValidFrom = gd.ValidFrom,
                    ValidTo = gd.ValidTo,
                    TargetAudiences = gd.TargetAudiences != null ? gd.TargetAudiences.ToList() : new List<string>(),
                })
                .ToListAsync();
        }
    }
}
