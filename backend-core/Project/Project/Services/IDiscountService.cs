using SalesHub.DTOs;
using Microsoft.AspNetCore.Http;

namespace SalesHub.Services
{
    public interface IDiscountService
    {
        Task<(IEnumerable<OfferPreviewDto> Data, int Total)> GetAllAsync(int page, int pageSize);
        Task<IEnumerable<OfferPreviewDto>> GetByCategoryNameAsync(string categoryName);
        Task<OfferResponseDto?> GetByIdAsync(int id);
        Task<IEnumerable<OfferPreviewDto>> SearchAsync(string query);
        Task<int> CreateOfferAsync(OfferCreateDto dto);
        Task<bool> UpdateStatusAsync(int id, bool isActive);
        Task<bool> DeleteAsync(int id);
        Task<IEnumerable<object>> GetNearbyAsync(double lat, double lon, double radiusMeters);
        Task<string> UploadImageAsync(int id, IFormFile file);
    }
}