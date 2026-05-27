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

                        // 1. Архівація Offers (Знижки)
                        var expiredOffers = await context.Offers
                            .Where(o => !o.IsArchived && o.ValidTo != null && o.ValidTo < now)
                            .ToListAsync(stoppingToken);

                        if (expiredOffers.Any())
                        {
                            _logger.LogInformation("Found {Count} expired offers. Archiving...", expiredOffers.Count);
                            foreach (var offer in expiredOffers)
                            {
                                offer.IsArchived = true;
                                offer.IsActive = false;
                            }
                        }

                        // 2. Архівація GoodDeals (Пропозиції)
                        var expiredGoodDeals = await context.GoodDeals
                            .Where(gd => !gd.IsArchived && gd.ValidTo != null && gd.ValidTo < now)
                            .ToListAsync(stoppingToken);

                        if (expiredGoodDeals.Any())
                        {
                            _logger.LogInformation("Found {Count} expired good deals. Archiving...", expiredGoodDeals.Count);
                            foreach (var deal in expiredGoodDeals)
                            {
                                deal.IsArchived = true;
                                deal.IsActive = false;
                            }
                        }

                        // Зберігаємо зміни у базі даних (якщо щось було знайдено)
                        if (expiredOffers.Any() || expiredGoodDeals.Any())
                        {
                            await context.SaveChangesAsync(stoppingToken);
                            _logger.LogInformation("Successfully archived {OfferCount} offers and {DealCount} good deals.",
                                expiredOffers.Count, expiredGoodDeals.Count);
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
