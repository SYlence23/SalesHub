using SalesHub.Models;
using SalesHub.Data;
using Microsoft.EntityFrameworkCore;

namespace SalesHub.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            if (await context.Offers.AnyAsync())
            {
                return; // Already seeded
            }

            var category1 = new OfferCategory { Name = "Electronics", IconUrl = "https://example.com/icons/electronics.png", MarkerColor = "#FF0000" };
            var category2 = new OfferCategory { Name = "Fashion", IconUrl = "https://example.com/icons/fashion.png", MarkerColor = "#00FF00" };
            var category3 = new OfferCategory { Name = "Groceries", IconUrl = "https://example.com/icons/groceries.png", MarkerColor = "#0000FF" };

            context.OfferCategories.AddRange(category1, category2, category3);
            await context.SaveChangesAsync();

            var place1 = new Place { Name = "SuperStore", Description = "A huge store with everything", IsOnline = false, OfferUrl = "https://superstore.com" };
            var place2 = new Place { Name = "TechWorld", Description = "Best electronics in town", IsOnline = true, OfferUrl = "https://techworld.com" };

            context.Places.AddRange(place1, place2);
            await context.SaveChangesAsync();

            var offers = new List<Offer>
            {
                new Offer
                {
                    Title = "Smartphone Sale",
                    Description = "Get the latest smartphone at 20% off",
                    IsActive = true,
                    NewPrice = 799.99m,
                    OldPrice = 999.99m,
                    ValidFrom = DateTime.UtcNow,
                    ValidTo = DateTime.UtcNow.AddDays(7),
                    Creator = OfferCreator.User,
                    CategoryId = category1.Id,
                    PlaceId = place2.Id
                },
                new Offer
                {
                    Title = "Summer Dress",
                    Description = "Beautiful summer dress for the beach",
                    IsActive = true,
                    NewPrice = 49.99m,
                    OldPrice = 69.99m,
                    ValidFrom = DateTime.UtcNow,
                    ValidTo = DateTime.UtcNow.AddDays(14),
                    Creator = OfferCreator.Parser,
                    CategoryId = category2.Id,
                    PlaceId = place1.Id
                },
                new Offer
                {
                    Title = "Organic Apples",
                    Description = "Fresh organic apples from local farms",
                    IsActive = true,
                    NewPrice = 2.99m,
                    OldPrice = 3.99m,
                    ValidFrom = DateTime.UtcNow,
                    ValidTo = DateTime.UtcNow.AddDays(3),
                    Creator = OfferCreator.Parser,
                    CategoryId = category3.Id,
                    PlaceId = place1.Id
                }
            };

            context.Offers.AddRange(offers);
            await context.SaveChangesAsync();
        }
    }
}
