using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SalesHub.Data;

namespace SalesHub.Services
{
    public class DiscountCleanupWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DiscountCleanupWorker> _logger;
        private readonly TimeSpan _cleanupInterval = TimeSpan.FromMinutes(10); // Перевірка кожні 10 хвилин

        public DiscountCleanupWorker(IServiceProvider serviceProvider, ILogger<DiscountCleanupWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Discount Cleanup Worker started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                        var now = DateTime.UtcNow;

                        // 1. Очистка Offers (Знижки)
                        var expiredOffers = await context.Offers
                            .Where(o => (o.ValidTo != null && o.ValidTo < now) || !o.IsActive)
                            .ToListAsync(stoppingToken);

                        if (expiredOffers.Any())
                        {
                            _logger.LogInformation("Found {Count} expired or inactive offers. Deleting...", expiredOffers.Count);
                            context.Offers.RemoveRange(expiredOffers);
                        }

                        // 2. Очистка GoodDeals (Пропозиції)
                        var expiredGoodDeals = await context.GoodDeals
                            .Where(gd => (gd.ValidTo != null && gd.ValidTo < now) || !gd.IsActive)
                            .ToListAsync(stoppingToken);

                        if (expiredGoodDeals.Any())
                        {
                            _logger.LogInformation("Found {Count} expired or inactive good deals. Deleting...", expiredGoodDeals.Count);
                            context.GoodDeals.RemoveRange(expiredGoodDeals);
                        }

                        // Зберігаємо зміни у базі даних (якщо щось було знайдено)
                        if (expiredOffers.Any() || expiredGoodDeals.Any())
                        {
                            await context.SaveChangesAsync(stoppingToken);
                            _logger.LogInformation("Successfully deleted expired/inactive discounts.");
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred during expired discounts cleanup.");
                }

                await Task.Delay(_cleanupInterval, stoppingToken);
            }

            _logger.LogInformation("Discount Cleanup Worker stopped.");
        }
    }
}
