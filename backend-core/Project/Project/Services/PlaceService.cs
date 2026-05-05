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
            return await _context.Places
                .AsNoTracking()
                .Select(p => new PlaceDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    IsOnline = p.IsOnline,
                    OfferUrl = p.OfferUrl
                })
                .ToListAsync();
        }

        public async Task<int> CreateAsync(PlaceCreateDto dto)
        {
            var place = new Place
            {
                Name = dto.Name,
                Description = dto.Description ?? "",
                IsOnline = dto.IsOnline,
                OfferUrl = dto.OfferUrl ?? ""
            };

            _context.Places.Add(place);

            if (!dto.IsOnline && dto.Latitude.HasValue && dto.Longitude.HasValue)
            {
                var location = new SalesHub.Models.Location
                {
                    Name = dto.Name,
                    Address = "Manually entered",
                    City = "Unknown",
                    Coordinates = new Point(dto.Longitude.Value, dto.Latitude.Value) { SRID = 4326 }
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
