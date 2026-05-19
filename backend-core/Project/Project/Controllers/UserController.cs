using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesHub.DTOs;
using SalesHub.Services;
using System.Security.Claims;

namespace SalesHub.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IDiscountService _discountService;
        private readonly ILogger<UserController> _logger;

        public UserController(IUserService userService, IDiscountService discountService, ILogger<UserController> logger)
        {
            _userService = userService;
            _discountService = discountService;
            _logger = logger;
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(claim, out var id) ? id : null;
        }

        // ─── Профіль ─────────────────────────────────────────────────────────────

        /// <summary>Отримати власний профіль</summary>
        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var profile = await _userService.GetProfileAsync(userId.Value);
            if (profile == null) return NotFound(new { message = "Профіль не знайдено." });

            return Ok(profile);
        }

        /// <summary>Публічний профіль іншого користувача</summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetPublicProfile(int id)
        {
            var profile = await _userService.GetPublicProfileAsync(id);
            if (profile == null) return NotFound(new { message = "Користувача не знайдено." });

            return Ok(profile);
        }

        /// <summary>Оновити профіль (ім'я, прізвище, статус студента)</summary>
        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var (succeeded, message) = await _userService.UpdateProfileAsync(userId.Value, dto);
            if (!succeeded) return BadRequest(new { message });

            return Ok(new { message });
        }

        /// <summary>Змінити пароль</summary>
        [HttpPut("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var (succeeded, message) = await _userService.ChangePasswordAsync(userId.Value, dto);
            if (!succeeded) return BadRequest(new { message });

            return Ok(new { message });
        }

        // ─── Мої пропозиції ───────────────────────────────────────────────────────

        /// <summary>Пропозиції, створені поточним користувачем</summary>
        [HttpGet("my-offers")]
        [Authorize]
        public async Task<IActionResult> GetMyOffers()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var offers = await _userService.GetCreatedOffersAsync(userId.Value);
            return Ok(offers);
        }

        /// <summary>Пропозиції публічного профілю</summary>
        [HttpGet("{id:int}/offers")]
        public async Task<IActionResult> GetUserOffers(int id)
        {
            var offers = await _userService.GetCreatedOffersAsync(id);
            return Ok(offers);
        }

        /// <summary>Видалити власну пропозицію</summary>
        [HttpDelete("my-offers/{offerId:int}")]
        [Authorize]
        public async Task<IActionResult> DeleteMyOffer(int offerId)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var (succeeded, message) = await _userService.DeleteOfferAsync(userId.Value, offerId);
            if (!succeeded) return BadRequest(new { message });

            return NoContent();
        }

        // ─── Збережені пропозиції ─────────────────────────────────────────────────

        /// <summary>Список збережених пропозицій</summary>
        [HttpGet("saved-offers")]
        [Authorize]
        public async Task<IActionResult> GetSavedOffers()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var offers = await _userService.GetSavedOffersAsync(userId.Value);
            return Ok(offers);
        }

        /// <summary>Зберегти пропозицію</summary>
        [HttpPost("saved-offers/{offerId:int}")]
        [Authorize]
        public async Task<IActionResult> SaveOffer(int offerId)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var (succeeded, message) = await _userService.SaveOfferAsync(userId.Value, offerId);
            if (!succeeded) return BadRequest(new { message });

            return Ok(new { message });
        }

        /// <summary>Видалити зі збережених</summary>
        [HttpDelete("saved-offers/{offerId:int}")]
        [Authorize]
        public async Task<IActionResult> UnsaveOffer(int offerId)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var (succeeded, message) = await _userService.UnsaveOfferAsync(userId.Value, offerId);
            if (!succeeded) return BadRequest(new { message });

            return NoContent();
        }

        /// <summary>Перевірити, чи збережена пропозиція</summary>
        [HttpGet("saved-offers/{offerId:int}/check")]
        [Authorize]
        public async Task<IActionResult> IsOfferSaved(int offerId)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var isSaved = await _userService.IsOfferSavedAsync(userId.Value, offerId);
            return Ok(new { isSaved });
        }
    }
}
