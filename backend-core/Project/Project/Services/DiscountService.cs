using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using SalesHub.Data;
using SalesHub.DTOs;
using SalesHub.Models;
using System.Linq.Expressions;
using static System.Net.Mime.MediaTypeNames;
using SalesHub.Enums;
namespace SalesHub.Services
{
    public class DiscountService : IDiscountService
    {
        private readonly ApplicationDbContext _context;

        public DiscountService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<(IEnumerable<OfferPreviewDto> Data, int Total)> GetAllAsync(int page, int pageSize, string? searchTerm = null, int? categoryId = null, string? sortOption = null, bool? archived = null)
        {
            IQueryable<Offer> query;

            if (archived == true)
            {
                // Показати лише архівовані (ті що вийшли з терміну або деактивовані)
                query = _context.Offers.AsNoTracking().Where(o => o.IsArchived);
            }
            else
            {
                // Активні, ще не архівовані
                query = _context.Offers.AsNoTracking().Where(o => o.IsActive && !o.IsArchived);
            }

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var term = searchTerm.Trim().ToLower();
                query = query.Where(o => o.Title.ToLower().Contains(term) || o.Description.ToLower().Contains(term));
            }

            if (categoryId.HasValue)
            {
                query = query.Where(o => o.CategoryId == categoryId.Value);
            }

             var total = await query.CountAsync();

            query = sortOption switch
            {
                "newest" => query.OrderByDescending(o => o.CreatedAt),
                "oldest" => query.OrderBy(o => o.CreatedAt),
                "price_asc" => query.OrderBy(o => o.NewPrice),
                "price_desc" => query.OrderByDescending(o => o.NewPrice),
                "discount_desc" => query.OrderByDescending(query => (query.OldPrice - query.NewPrice) * 100 / query.OldPrice),
                "valid_to_asc" => query.OrderBy(o => o.ValidTo == null ? DateTime.MaxValue : o.ValidTo),
                "valid_to_desc" => query.OrderByDescending(o => o.ValidTo),
                // Сортування за популярністю: спочатку вираховується рейтинг (лайки мінус дизлайки).
                // У разі рівності рейтингу пріоритет віддається пропозиції з більшою кількістю лайків.
                "popular" => query
                    .OrderByDescending(o => o.Reviews.Count(r => r.IsRecommended) - o.Reviews.Count(r => !r.IsRecommended))
                    .ThenByDescending(o => o.Reviews.Count(r => r.IsRecommended)),
                _ => query.OrderByDescending(o => o.Id)
            };

            var data = await query
                .Include(o => o.Place)
                .Include(o => o.CreatedBy)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(MapToPreviewDto())
                .ToListAsync();

            return (data, total);
        }

        public async Task<IEnumerable<CategoryPreviewDto>> GetCategoriesAsync()
        {
            return await _context.OfferCategories
                .AsNoTracking()
                .Select(c => new CategoryPreviewDto { Id = c.Id, Name = c.Name, MarkerColor = c.MarkerColor })
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
                    Description = o.Description,
                    IsActive = o.IsActive,
                    CreatedAt = o.CreatedAt,
                    StoreDescription = o.Place.Description,
                    Address = o.Place.PlaceLocations.Select(pl => pl.Location.Address).FirstOrDefault(),
                    Creator = o.Creator == SalesHub.Enums.OfferCreator.User ? "User" : "Parser",
                    CreatedById = o.CreatedById,
                    CreatedByName = o.CreatedBy != null ? (o.CreatedBy.Name + " " + o.CreatedBy.Surname).Trim() : null,
                    SaveCount = o.UserSavedOffers.Count(),
                    LikeCount = o.Reviews.Count(r => r.IsRecommended),
                    DislikeCount = o.Reviews.Count(r => !r.IsRecommended),
                    ImageUrls = o.Images.Select(i => i.ImageUrl).ToList()
                })
                .FirstOrDefaultAsync();
        }


        public async Task<int> CreateOfferAsync(OfferCreateDto dto, int userId)
        {
            return await CreateOfferAsync(dto, userId, CancellationToken.None);
        }

        private bool IsWithinLvivRegion(double? lat, double? lon)
        {
            if (!lat.HasValue || !lon.HasValue) return false; // Offline offers MUST have location
            
            // Approximate bounding box for Lviv Oblast
            return lat >= 48.70 && lat <= 50.60 && lon >= 22.70 && lon <= 25.50;
        }

        private async Task<int> CreateOfferAsync(OfferCreateDto dto, int userId, CancellationToken cancellationToken = default)
        {
            int finalPlaceId;

            if (dto.PlaceId.HasValue && dto.PlaceId.Value > 0)
            {
                var existingPlace = await _context.Places
                    .Include(p => p.PlaceLocations)
                        .ThenInclude(pl => pl.Location)
                    .FirstOrDefaultAsync(p => p.Id == dto.PlaceId.Value, cancellationToken);

                if (existingPlace != null && !existingPlace.IsOnline)
                {
                    var coords = existingPlace.PlaceLocations.FirstOrDefault()?.Location?.Coordinates;
                    if (coords != null && !IsWithinLvivRegion(coords.Y, coords.X))
                    {
                        throw new ArgumentException("Обраний заклад знаходиться за межами Львівської області.");
                    }
                }
                finalPlaceId = dto.PlaceId.Value;
            }
            else if (!string.IsNullOrWhiteSpace(dto.NewPlaceName))
            {
                var nameTrimmed = dto.NewPlaceName.Trim();
                var addressTrimmed = (dto.NewPlaceAddress ?? "Address not provided").Trim();
                var exists = await _context.Places.AnyAsync(p => 
                    p.Name.ToLower() == nameTrimmed.ToLower() &&
                    p.PlaceLocations.Any(pl => pl.Location.Address.ToLower() == addressTrimmed.ToLower()), cancellationToken);
                if (exists)
                {
                    throw new ArgumentException("Заклад з такою назвою та адресою вже існує.");
                }

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
                throw new ArgumentException("Необхідно вказати існуючий PlaceId або назву нового закладу.");
            }
            // Validate DTO coordinates against Lviv region for offline offers with coordinates provided
            if (!string.IsNullOrWhiteSpace(dto.NewPlaceName) && !IsWithinLvivRegion(dto.Latitude, dto.Longitude))
            {
                throw new ArgumentException("Пропозиції можна створювати лише для локацій у межах Львова та Львівської області.");
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
                Creator = OfferCreator.User,
                CreatedById = userId,
                Images = dto.ImageUrls?
                    .Where(url => !string.IsNullOrWhiteSpace(url))
                    .Select((url, index) => new OfferImage
                    {
                        ImageUrl = url,
                        IsMain = index == 0
                    }).ToList() ?? new List<OfferImage>()
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
            // Деактивація — одразу переміщуємо в архів; реактивація — витягуємо з архіву
            offer.IsArchived = !isActive;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<int> ArchiveExpiredAsync()
        {
            var now = DateTime.UtcNow;
            var expired = await _context.Offers
                .Where(o => !o.IsArchived && (o.ValidTo != null && o.ValidTo < now))
                .ToListAsync();

            foreach (var offer in expired)
            {
                offer.IsArchived = true;
                offer.IsActive = false;
            }

            if (expired.Any())
                await _context.SaveChangesAsync();

            return expired.Count;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var offer = await _context.Offers.FindAsync(id);
            if (offer == null) return false;
            _context.Offers.Remove(offer);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<IEnumerable<OfferReviewDto>> GetReviewsAsync(int offerId)
        {
            return await _context.OfferReviews
                .AsNoTracking()
                .Include(r => r.CreatedBy)
                .Where(r => r.OfferId == offerId && !string.IsNullOrWhiteSpace(r.Comment))
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new OfferReviewDto
                {
                    Id = r.Id,
                    Author = r.CreatedBy != null ? r.CreatedBy.Name : "Unknown",
                    Text = r.Comment,
                    CreatedAt = r.CreatedAt,
                    Avatar = r.CreatedBy != null && r.CreatedBy.Name.Length > 1 ? r.CreatedBy.Name.Substring(0, 2).ToUpper() : "U",
                    IsRecommended = r.IsRecommended
                })
                .ToListAsync();
        }

        public async Task<OfferReviewDto?> AddOrUpdateReviewAsync(int offerId, int userId, OfferReviewCreateDto dto)
        {
            var offer = await _context.Offers.FindAsync(offerId);
            if (offer == null) return null;

            OfferReviews review;

            if (string.IsNullOrWhiteSpace(dto.Comment))
            {
                // Vote-only action: find an existing vote-only record or create a new one
                var existingVote = await _context.OfferReviews
                    .FirstOrDefaultAsync(r => r.OfferId == offerId && r.CreatedById == userId && r.Comment == "");

                if (existingVote == null)
                {
                    review = new OfferReviews
                    {
                        OfferId = offerId,
                        CreatedById = userId,
                        IsRecommended = dto.IsRecommended,
                        Comment = "",
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.OfferReviews.Add(review);
                }
                else
                {
                    review = existingVote;
                    review.IsRecommended = dto.IsRecommended;
                }
            }
            else
            {
                // Comment submission: always add a new record to support multiple comments
                review = new OfferReviews
                {
                    OfferId = offerId,
                    CreatedById = userId,
                    IsRecommended = dto.IsRecommended,
                    Comment = dto.Comment.Trim(),
                    CreatedAt = DateTime.UtcNow
                };
                _context.OfferReviews.Add(review);
            }

            await _context.SaveChangesAsync();

            var author = await _context.Users.FindAsync(userId);
            
            return new OfferReviewDto
            {
                Id = review.Id,
                Author = author != null ? author.Name : "Unknown",
                Text = review.Comment,
                CreatedAt = review.CreatedAt,
                Avatar = author != null && author.Name.Length > 1 ? author.Name.Substring(0, 2).ToUpper() : "U",
                IsRecommended = review.IsRecommended
            };
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
        public async Task<IEnumerable<OfferMapPinDto>> GetByRadiusAsync(LocationSearchRequest request)
        {
            // Створюємо точку користувача (SRID 4326 - стандарт для GPS)
            var userLocation = new Point(request.Longitude, request.Latitude) { SRID = 4326 };
            double radiusInMeters = request.RadiusInKm * 1000;

            return await _context.Offers
                .AsNoTracking()
                .Where(o => o.IsActive)
                // Фільтруємо через зв'язок Place -> PlaceLocations
                .Where(o => o.Place.PlaceLocations.Any(pl =>
                    pl.Location.Coordinates.Distance(userLocation) <= radiusInMeters))
                .Select(o => new OfferMapPinDto
                {
                    Id = o.Id,
                    Title = o.Title,
                    NewPrice = o.NewPrice,
                    OldPrice = o.OldPrice,
                    MainImageUrl = o.Images.OrderBy(i => i.Id).Select(i => i.ImageUrl).FirstOrDefault(),
                    StoreName = o.Place.Name,
                    Latitude = o.Place.PlaceLocations.Select(pl => pl.Location.Coordinates.Y).FirstOrDefault(),
                    Longitude = o.Place.PlaceLocations.Select(pl => pl.Location.Coordinates.X).FirstOrDefault(),
                    CategoryId = o.CategoryId,
                    MarkerColor = o.Category.MarkerColor
                })
                .ToListAsync();
        }
        public async Task<IEnumerable<OfferMapPinDto>> GetInBoundsAsync(double minLat, double maxLat, double minLon, double maxLon)
        {
            var boundary = new Envelope(minLon, maxLon, minLat, maxLat);
            var factory = new GeometryFactory(new PrecisionModel(), 4326);
            var polygon = factory.ToGeometry(boundary);

            return await _context.Offers
                .AsNoTracking()
                .Where(o => o.IsActive)
                .Where(o => o.Place.PlaceLocations.Any(pl => pl.Location.Coordinates.Within(polygon)))
                .Select(o => new OfferMapPinDto
                {
                    Id = o.Id,
                    Title = o.Title,
                    NewPrice = o.NewPrice,
                    OldPrice = o.OldPrice,
                    MainImageUrl = o.Images.OrderBy(i => i.Id).Select(i => i.ImageUrl).FirstOrDefault(),
                    StoreName = o.Place.Name,
                    // Беремо першу доступну локацію для координат піна
                    Latitude = o.Place.PlaceLocations.Select(pl => pl.Location.Coordinates.Y).FirstOrDefault(),
                    Longitude = o.Place.PlaceLocations.Select(pl => pl.Location.Coordinates.X).FirstOrDefault(),
                    CategoryId = o.CategoryId,
                    MarkerColor = o.Category.MarkerColor
                })
                .ToListAsync();
        }
        
        public async Task<IEnumerable<OfferPreviewDto>> GetByUserIdAsync(int userId)
        {
            return await _context.Offers
                .AsNoTracking()
                .Where(o => o.CreatedById == userId)
                .Include(o => o.Place)
                .Include(o => o.Images)
                .Include(o => o.CreatedBy)
                .Select(MapToPreviewDto())
                .ToListAsync();
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
                CreatedAt = o.CreatedAt,
                MainImageUrl = o.Images.OrderBy(i => i.Id).Select(i => i.ImageUrl).FirstOrDefault(),
                CreatorUserName = o.CreatedBy != null ? o.CreatedBy.Name : null
            };
        }
    }
}
