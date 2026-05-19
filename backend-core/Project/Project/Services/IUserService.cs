using SalesHub.DTOs;

namespace SalesHub.Services
{
    public interface IUserService
    {
        Task<UserProfileDto?> GetProfileAsync(int userId);
        Task<UserProfileDto?> GetPublicProfileAsync(int userId);
        Task<(bool Succeeded, string Message)> UpdateProfileAsync(int userId, UpdateProfileDto dto);
        Task<(bool Succeeded, string Message)> ChangePasswordAsync(int userId, ChangePasswordDto dto);
        Task<IEnumerable<OfferPreviewDto>> GetCreatedOffersAsync(int userId);
        Task<IEnumerable<OfferPreviewDto>> GetSavedOffersAsync(int userId);
        Task<(bool Succeeded, string Message)> SaveOfferAsync(int userId, int offerId);
        Task<(bool Succeeded, string Message)> UnsaveOfferAsync(int userId, int offerId);
        Task<bool> IsOfferSavedAsync(int userId, int offerId);
        Task<(bool Succeeded, string Message)> DeleteOfferAsync(int userId, int offerId);
    }
}
