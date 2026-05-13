using SalesHub.DTOs;

namespace SalesHub.Services
{
    public interface IPlaceService
    {
        Task<IEnumerable<PlacePreviewDto>> GetAllPlacesAsync();
        Task<PlaceFullDto?> GetPlaceDetailsAsync(int id);
        Task<int> CreateAsync(PlaceCreateDto dto);
    }
}
