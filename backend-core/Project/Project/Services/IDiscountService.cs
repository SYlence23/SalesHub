using SalesHub.DTOs;
using Microsoft.AspNetCore.Http;
using System.Threading;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SalesHub.Services
{
    public interface IDiscountService
    {
        Task<(IEnumerable<OfferPreviewDto> Data, int Total)> GetAllAsync(int page, int pageSize, string? searchTerm = null, int? categoryId = null, string? sortOption = null);

        Task<IEnumerable<CategoryPreviewDto>> GetCategoriesAsync();

        Task<OfferResponseDto?> GetByIdAsync(int id);
        Task<int> CreateOfferAsync(OfferCreateDto dto, int userId);
        Task<bool> UpdateStatusAsync(int id, bool isActive);

        Task<bool> DeleteAsync(int id);
        
        Task<IEnumerable<OfferReviewDto>> GetReviewsAsync(int offerId);
        Task<OfferReviewDto?> AddOrUpdateReviewAsync(int offerId, int userId, OfferReviewCreateDto dto);

        Task<IEnumerable<OfferMapPinDto>> GetByRadiusAsync(LocationSearchRequest request);

         Task<IEnumerable<object>> GetNearbyAsync(double lat, double lon, double radiusMeters);

         Task<IEnumerable<OfferPreviewDto>> GetByUserIdAsync(int userId);

         Task<IEnumerable<OfferMapPinDto>> GetInBoundsAsync(double minLat, double maxLat, double minLon, double maxLon);

         Task<string> UploadImageAsync(int id, IFormFile file, CancellationToken cancellationToken = default);
        Task<IEnumerable<string>> UploadImagesAsync(int id, IEnumerable<IFormFile> files, CancellationToken cancellationToken = default);
    }
}