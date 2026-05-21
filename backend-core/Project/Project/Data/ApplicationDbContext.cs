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


            var seedDate = new DateTime(2026, 5, 9, 0, 0, 0, DateTimeKind.Utc);

            modelBuilder.Entity<OfferCategory>()
                .HasData(
                    new OfferCategory { Id = 1, Name = "Розваги", CreatedAt = seedDate },
                    new OfferCategory { Id = 2, Name = "Заклади", CreatedAt = seedDate },
                    new OfferCategory { Id = 3, Name = "Культура", CreatedAt = seedDate },
                    new OfferCategory { Id = 4, Name = "Книги", CreatedAt = seedDate },
                    new OfferCategory { Id = 5, Name = "Спорт", CreatedAt = seedDate }
                );

        }
    }
}