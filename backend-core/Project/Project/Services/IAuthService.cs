using SalesHub.DTOs;

namespace SalesHub.Services
{
    public interface IAuthService
    {
        Task<(bool Succeeded, string Message)> RegisterAsync(RegisterDto model);
        Task<TokenDto?> LoginAsync(LoginDto model);
    }
}
