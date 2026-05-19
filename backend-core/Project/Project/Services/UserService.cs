using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SalesHub.Data;
using SalesHub.DTOs;
using SalesHub.Enums;
using SalesHub.Models;
using System.Linq.Expressions;

namespace SalesHub.Services
{
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public UserService(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        public async Task<UserProfileDto?> GetProfileAsync(int userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) return null;

            var createdCount = await _context.Offers.CountAsync(o => o.CreatedById == userId);
            var savedCount = await _context.UserSavedOffers.CountAsync(u => u.UserId == userId);

            return new UserProfileDto
            {
                Id = user.Id,
                Name = user.Name,
                Surname = user.Surname,
                Email = user.Email ?? string.Empty,
                Category = user.Category == UserCategories.Student ? "Student" : "NonStudent",
                CreatedOffersCount = createdCount,
                SavedOffersCount = savedCount
            };
        }

        public async Task<UserProfileDto?> GetPublicProfileAsync(int userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) return null;

            var createdCount = await _context.Offers.CountAsync(o => o.CreatedById == userId);

            return new UserProfileDto
            {
                Id = user.Id,
                Name = user.Name,
                Surname = user.Surname,
                Email = string.Empty, // email is hidden on public profile
                Category = user.Category == UserCategories.Student ? "Student" : "NonStudent",
                CreatedOffersCount = createdCount,
                SavedOffersCount = 0 // hidden on public profile
            };
        }

        public async Task<(bool Succeeded, string Message)> UpdateProfileAsync(int userId, UpdateProfileDto dto)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) return (false, "Користувача не знайдено.");

            user.Name = dto.Name;
            user.Surname = dto.Surname;
            user.Category = dto.IsStudent ? UserCategories.Student : UserCategories.NonStudent;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return (false, string.Join(", ", result.Errors.Select(e => e.Description)));

            return (true, "Профіль успішно оновлено.");
        }

        public async Task<(bool Succeeded, string Message)> ChangePasswordAsync(int userId, ChangePasswordDto dto)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null) return (false, "Користувача не знайдено.");

            var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
            if (!result.Succeeded)
                return (false, string.Join(", ", result.Errors.Select(e => e.Description)));

            return (true, "Пароль успішно змінено.");
        }

        public async Task<IEnumerable<OfferPreviewDto>> GetCreatedOffersAsync(int userId)
        {
            return await _context.Offers
                .AsNoTracking()
                .Where(o => o.CreatedById == userId)
                .Include(o => o.Place)
                .Include(o => o.Images)
                .Include(o => o.CreatedBy)
                .OrderByDescending(o => o.CreatedAt)
                .Select(MapToPreviewDto())
                .ToListAsync();
        }

        public async Task<IEnumerable<OfferPreviewDto>> GetSavedOffersAsync(int userId)
        {
            return await _context.UserSavedOffers
                .AsNoTracking()
                .Where(uso => uso.UserId == userId)
                .Include(uso => uso.Offer)
                    .ThenInclude(o => o.Place)
                .Include(uso => uso.Offer)
                    .ThenInclude(o => o.Images)
                .Include(uso => uso.Offer)
                    .ThenInclude(o => o.CreatedBy)
                .OrderByDescending(uso => uso.CreatedAt)
                .Select(uso => new OfferPreviewDto
                {
                    Id = uso.Offer.Id,
                    Title = uso.Offer.Title,
                    NewPrice = uso.Offer.NewPrice,
                    OldPrice = uso.Offer.OldPrice,
                    StoreName = uso.Offer.Place.Name,
                    CreatedAt = uso.Offer.CreatedAt,
                    MainImageUrl = uso.Offer.Images.OrderBy(i => i.Id).Select(i => i.ImageUrl).FirstOrDefault(),
                    CreatorUserName = uso.Offer.CreatedBy != null ? uso.Offer.CreatedBy.Name : null
                })
                .ToListAsync();
        }

        public async Task<(bool Succeeded, string Message)> SaveOfferAsync(int userId, int offerId)
        {
            var offer = await _context.Offers.FindAsync(offerId);
            if (offer == null) return (false, "Пропозицію не знайдено.");

            var alreadySaved = await _context.UserSavedOffers
                .AnyAsync(uso => uso.UserId == userId && uso.OfferId == offerId);

            if (alreadySaved) return (false, "Пропозиція вже збережена.");

            _context.UserSavedOffers.Add(new UserSavedOffers { UserId = userId, OfferId = offerId });
            await _context.SaveChangesAsync();

            return (true, "Пропозицію збережено.");
        }

        public async Task<(bool Succeeded, string Message)> UnsaveOfferAsync(int userId, int offerId)
        {
            var saved = await _context.UserSavedOffers
                .FirstOrDefaultAsync(uso => uso.UserId == userId && uso.OfferId == offerId);

            if (saved == null) return (false, "Пропозиція не знайдена у збережених.");

            _context.UserSavedOffers.Remove(saved);
            await _context.SaveChangesAsync();

            return (true, "Пропозицію видалено зі збережених.");
        }

        public async Task<bool> IsOfferSavedAsync(int userId, int offerId)
        {
            return await _context.UserSavedOffers
                .AnyAsync(uso => uso.UserId == userId && uso.OfferId == offerId);
        }

        public async Task<(bool Succeeded, string Message)> DeleteOfferAsync(int userId, int offerId)
        {
            var offer = await _context.Offers.FindAsync(offerId);
            if (offer == null) return (false, "Пропозицію не знайдено.");
            if (offer.CreatedById != userId) return (false, "Ви не можете видалити цю пропозицію.");

            _context.Offers.Remove(offer);
            await _context.SaveChangesAsync();

            return (true, "Пропозицію видалено.");
        }

        private static Expression<Func<Offer, OfferPreviewDto>> MapToPreviewDto()
        {
            return o => new OfferPreviewDto
            {
                Id = o.Id,
                Title = o.Title,
                NewPrice = o.NewPrice,
                OldPrice = o.OldPrice,
                StoreName = o.Place.Name,
                CreatedAt = o.CreatedAt,
                MainImageUrl = o.Images.OrderBy(i => i.Id).Select(i => i.ImageUrl).FirstOrDefault(),
                CreatorUserName = o.CreatedBy != null ? o.CreatedBy.Name : null
            };
        }
    }
}
