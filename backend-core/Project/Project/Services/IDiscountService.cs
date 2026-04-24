using SalesHub.DTOs;
using Microsoft.AspNetCore.Http;
using System.Threading;

namespace SalesHub.Services
{
    public interface IDiscountService
    {
        Task<(IEnumerable<OfferPreviewDto> Data, int Total)> GetAllAsync(int page, int pageSize, string? searchTerm = null, int? categoryId = null, string? sortOption = null);
        Task<IEnumerable<CategoryPreviewDto>> GetCategoriesAsync();

        Task<OfferResponseDto?> GetByIdAsync(int id);

        Task<int> CreateOfferAsync(OfferCreateDto dto, CancellationToken cancellationToken = default);

        Task<bool> UpdateStatusAsync(int id, bool isActive);
        Task<bool> DeleteAsync(int id);
        Task<IEnumerable<object>> GetNearbyAsync(double lat, double lon, double radiusMeters);
        Task<string> UploadImageAsync(int id, IFormFile file, CancellationToken cancellationToken = default);
        Task<IEnumerable<string>> UploadImagesAsync(int id, IEnumerable<IFormFile> files, CancellationToken cancellationToken = default);
    }
}