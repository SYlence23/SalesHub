using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using SalesHub.DTOs;
using SalesHub.Models;
using SalesHub.Services;

namespace SalesHub.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto model)
        {
            var (succeeded, message) = await _authService.RegisterAsync(model);
            if (!succeeded)
                return Conflict(new { message });

            return Ok(message);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto model)
        {
            var token = await _authService.LoginAsync(model);
            if (token == null)
                return Unauthorized("Invalid email or password.");
            return Ok(token);
        }
    }
}
