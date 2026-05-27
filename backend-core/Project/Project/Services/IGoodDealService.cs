using SalesHub.DTOs;

namespace SalesHub.Services
{
    public interface IGoodDealService
    {
        Task<(IEnumerable<GoodDealPreviewDto> Data, int Total)> GetAllAsync(int page, int pageSize, string? searchTerm = null, int? categoryId = null, string? audience = null, bool? archived = null);
        Task<GoodDealResponseDto?> GetByIdAsync(int id);
        Task<int> CreateAsync(GoodDealCreateDto dto, int userId);
        Task<bool> UpdateStatusAsync(int id, bool isActive);
        Task<bool> DeleteAsync(int id);
        Task<IEnumerable<GoodDealPreviewDto>> GetByUserIdAsync(int userId);
        Task<int> ArchiveExpiredAsync();
    }
}
