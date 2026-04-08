using Microsoft.EntityFrameworkCore; 
using SalesHub.Models;               
using NetTopologySuite.Geometries;
using Npgsql; 

namespace SalesHub.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Offer> Offers { get; set; }
        public DbSet<OfferCategory> OfferCategories { get; set; }
        public DbSet<OfferImage> OfferImages { get; set; }
        public DbSet<Place> Places { get; set; }
        public DbSet<PlaceImage> PlaceImages { get; set; }
        public DbSet<SalesHub.Models.Location> Locations { get; set; }
        public DbSet<PlaceLocation> PlaceLocations { get; set; }

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

            modelBuilder.Entity<PlaceImage>()
                .HasOne(pi => pi.Place).WithMany(p => p.Images).HasForeignKey(pi => pi.PlaceId);

            // 2. Зв'язок Many-to-Many: Магазини та їх Локації
            modelBuilder.Entity<PlaceLocation>()
                .HasOne(pl => pl.Place).WithMany(p => p.PlaceLocations).HasForeignKey(pl => pl.PlaceId);

            modelBuilder.Entity<PlaceLocation>()
                .HasOne(pl => pl.Location).WithMany(l => l.PlaceLocations).HasForeignKey(pl => pl.LocationId);

            // 4. Ієрархія категорій (батьківська -> підкатегорії)
            modelBuilder.Entity<OfferCategory>()
                .HasOne(c => c.Parent).WithMany(c => c.SubCategories).HasForeignKey(c => c.ParentId);
        }
    }
}