using Microsoft.EntityFrameworkCore; 
using SalesHub.Models;               
using NetTopologySuite.Geometries;
using Npgsql;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
namespace SalesHub.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole<int>,int>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.ConfigureWarnings(w =>
                w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
        }


        public DbSet<SalesHub.Models.Location> Locations { get; set; }
        public DbSet<Offer> Offers { get; set; }
        public DbSet<OfferCategory> OfferCategories { get; set; }
        public DbSet<OfferImage> OfferImages { get; set; }
        public DbSet<OfferReviews> OfferReviews { get; set; }
        public DbSet<Place> Places { get; set; }
        public DbSet<PlaceImage> PlaceImages { get; set; }
        public DbSet<PlaceLocation> PlaceLocations { get; set; }
        public DbSet<UserSavedOffers> UserSavedOffers { get; set; }
        public DbSet<GoodDeal> GoodDeals { get; set; }
        public DbSet<GoodDealImage> GoodDealImages { get; set; }
        public DbSet<UserSavedGoodDeals> UserSavedGoodDeals { get; set; }
        public DbSet<GoodDealComment> GoodDealComments { get; set; }
        public DbSet<GoodDealLike> GoodDealLikes { get; set; }


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.HasPostgresExtension("postgis");

            modelBuilder.Entity<Offer>()
                .HasOne(o => o.Category).WithMany(c => c.Offers).HasForeignKey(o => o.CategoryId);

            modelBuilder.Entity<Offer>()
                .HasOne(o => o.Place).WithMany(p => p.Offers).HasForeignKey(o => o.PlaceId);

            modelBuilder.Entity<Offer>()
                .HasMany(o => o.Images).WithOne(i => i.Offer).HasForeignKey(i => i.OfferId);

            modelBuilder.Entity<Offer>()
                .Property(o => o.Creator).HasConversion<int>();

            modelBuilder.Entity<ApplicationUser>()
                .Property(au => au.Category).HasConversion<int>();

            modelBuilder.Entity<Offer>()
                .HasOne(o => o.CreatedBy).WithMany(c => c.UserOffers).HasForeignKey(uo => uo.CreatedById);

            modelBuilder.Entity<UserSavedOffers>()
                .HasOne(uso => uso.Offer).WithMany(o => o.UserSavedOffers).HasForeignKey(us => us.OfferId);

            modelBuilder.Entity<UserSavedOffers>()
                .HasOne(uso => uso.User).WithMany(u => u.UserSavedOffers).HasForeignKey(uso => uso.UserId);

            modelBuilder.Entity<OfferReviews>()
                .HasOne(or => or.Offer).WithMany(o => o.Reviews).HasForeignKey(or => or.OfferId);

            modelBuilder.Entity<OfferReviews>()
                .HasOne(or => or.CreatedBy).WithMany(cb => cb.UserReviews).HasForeignKey(or => or.CreatedById);

            modelBuilder.Entity<Place>()
                .HasOne(p => p.CreatedBy).WithMany(cb => cb.UserPlaces).HasForeignKey(up => up.CreatedById);

            modelBuilder.Entity<PlaceImage>()
                .HasOne(pi => pi.Place).WithMany(p => p.Images).HasForeignKey(pi => pi.PlaceId);
            
            modelBuilder.Entity<PlaceLocation>()
                .HasOne(pl => pl.Place).WithMany(p => p.PlaceLocations).HasForeignKey(pl => pl.PlaceId);

            modelBuilder.Entity<PlaceLocation>()
                .HasOne(pl => pl.Location).WithMany(l => l.PlaceLocations).HasForeignKey(pl => pl.LocationId);
        
            modelBuilder.Entity<OfferCategory>()
                .HasOne(c => c.Parent).WithMany(c => c.SubCategories).HasForeignKey(c => c.ParentId);

            // GoodDeal relationships
            modelBuilder.Entity<GoodDeal>()
                .HasOne(gd => gd.Category).WithMany().HasForeignKey(gd => gd.CategoryId);

            modelBuilder.Entity<GoodDeal>()
                .HasOne(gd => gd.Place).WithMany().HasForeignKey(gd => gd.PlaceId);

            modelBuilder.Entity<GoodDeal>()
                .HasOne(gd => gd.CreatedBy).WithMany().HasForeignKey(gd => gd.CreatedById);

            modelBuilder.Entity<GoodDealImage>()
                .HasOne(gdi => gdi.GoodDeal).WithMany(gd => gd.Images).HasForeignKey(gdi => gdi.GoodDealId);

            modelBuilder.Entity<UserSavedGoodDeals>()
                .HasOne(usgd => usgd.GoodDeal).WithMany(gd => gd.UserSavedGoodDeals).HasForeignKey(usgd => usgd.GoodDealId);

            modelBuilder.Entity<UserSavedGoodDeals>()
                .HasOne(usgd => usgd.User).WithMany(u => u.UserSavedGoodDeals).HasForeignKey(usgd => usgd.UserId);

            // GoodDealComment
            modelBuilder.Entity<GoodDealComment>()
                .HasOne(c => c.GoodDeal).WithMany(gd => gd.Comments).HasForeignKey(c => c.GoodDealId).OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<GoodDealComment>()
                .HasOne(c => c.CreatedBy).WithMany().HasForeignKey(c => c.CreatedById).OnDelete(DeleteBehavior.Restrict);

            // GoodDealLike
            modelBuilder.Entity<GoodDealLike>()
                .HasIndex(l => new { l.GoodDealId, l.UserId }).IsUnique();

            modelBuilder.Entity<GoodDealLike>()
                .HasOne(l => l.GoodDeal).WithMany(gd => gd.Likes).HasForeignKey(l => l.GoodDealId).OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<GoodDealLike>()
                .HasOne(l => l.User).WithMany().HasForeignKey(l => l.UserId).OnDelete(DeleteBehavior.Restrict);


            var seedDate = new DateTime(2026, 5, 9, 0, 0, 0, DateTimeKind.Utc);

            modelBuilder.Entity<OfferCategory>()
                .HasData(
                    new OfferCategory { Id = 1, Name = "Розваги", CreatedAt = seedDate },
                    new OfferCategory { Id = 2, Name = "Заклади", CreatedAt = seedDate },
                    new OfferCategory { Id = 3, Name = "Культура", CreatedAt = seedDate },
                    new OfferCategory { Id = 4, Name = "Книги", CreatedAt = seedDate },
                    new OfferCategory { Id = 5, Name = "Спорт", CreatedAt = seedDate },
                    new OfferCategory { Id = 6, Name = "Освіта", CreatedAt = seedDate, MarkerColor = "#3B82F6" },
                    new OfferCategory { Id = 7, Name = "Побут", CreatedAt = seedDate, MarkerColor = "#F59E0B" },
                    new OfferCategory { Id = 8, Name = "Відпочинок", CreatedAt = seedDate, MarkerColor = "#10B981" },
                    new OfferCategory { Id = 9, Name = "Транспорт", CreatedAt = seedDate, MarkerColor = "#8B5CF6" }
                );

        }
    }
}