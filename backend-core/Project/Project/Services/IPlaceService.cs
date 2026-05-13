using SalesHub.DTOs;

namespace SalesHub.Services
{
    public interface IPlaceService
    {
        Task<IEnumerable<PlaceDto>> GetAllAsync();
        Task<int> CreateAsync(PlaceCreateDto dto);
    }
}
