using System;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using SalesHub.Data;
using SalesHub.DTOs;
using SalesHub.Models;

namespace SalesHub.Services
{
    public class PlaceService : IPlaceService
    {
        private readonly ApplicationDbContext _context;

        public PlaceService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<PlaceDto>> GetAllAsync()
        {
            var places = await _context.Places
                .AsNoTracking()
                .ToListAsync();

            return places
                .Where(p => p.IsOnline || (p.Location != null && IsWithinLvivRegion(p.Location.Y, p.Location.X)))
                .GroupBy(p => p.Name.Trim().ToLower())
                .Select(g => g.First())
                .Select(p => new PlaceDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    IsOnline = p.IsOnline,
                    OfferUrl = p.OfferUrl
                });
        }

        private bool IsWithinLvivRegion(double lat, double lon)
        {
            // Permissive bounding box for Lviv Oblast and surroundings
            // Lviv city is roughly 49.8, 24.0
            return lat >= 47.50 && lat <= 51.50 && lon >= 21.50 && lon <= 26.50;
        }

        public async Task<int> CreateAsync(PlaceCreateDto dto)
        {
            if (!dto.IsOnline)
            {
                if (!dto.Latitude.HasValue || !dto.Longitude.HasValue)
                {
                    throw new ArgumentException("Coordinates (latitude and longitude) are required for physical stores.");
                }

                if (!IsWithinLvivRegion(dto.Latitude.Value, dto.Longitude.Value))
                {
                    throw new ArgumentException("Unfortunately, stores can only be created within the Lviv region.");
                }
            }

            var place = new Place
            {
                Name = dto.Name,
                Description = dto.Description ?? "",
                IsOnline = dto.IsOnline,
                OfferUrl = dto.OfferUrl ?? "",
                Location = (!dto.IsOnline && dto.Latitude.HasValue && dto.Longitude.HasValue)
                    ? new Point(dto.Longitude.Value, dto.Latitude.Value) { SRID = 4326 } : null
            };

            _context.Places.Add(place);

            if (!dto.IsOnline && dto.Latitude.HasValue && dto.Longitude.HasValue)
            {
                var location = new SalesHub.Models.Location
                {
                    Name = dto.Name,
                    Address = "Manually entered",
                    City = "Unknown",
                    Coordinates = place.Location
                };
                
                _context.Locations.Add(location);

                var placeLocation = new PlaceLocation
                {
                    Place = place,
                    Location = location
                };
                
                _context.PlaceLocations.Add(placeLocation);
            }

            await _context.SaveChangesAsync();
            return place.Id;
        }
    }
}
