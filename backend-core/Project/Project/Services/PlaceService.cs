using System;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using SalesHub.Data;
using SalesHub.DTOs;
using SalesHub.Models;
using Location = SalesHub.Models.Location;

namespace SalesHub.Services
{
    public class PlaceService : IPlaceService
    {
        private readonly ApplicationDbContext _context;

        public PlaceService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<PlacePreviewDto>> GetAllPlacesAsync()
        {
            return await _context.Places
                .AsNoTracking()
                .Select(p => new PlacePreviewDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Addresses = p.PlaceLocations.Select(pl => pl.Location.Address).ToList(),
                    MainImageUrl = p.Images.Select(i => i.ImageUrl).FirstOrDefault()
                })
                .ToListAsync();
        }

        public async Task<int> CreateAsync(PlaceCreateDto dto, int userId)
        {
            var place = new Place
            {
                Name = dto.Name,
                Description = dto.Description ?? "",
                CreatedById = userId,
                IsOnline = dto.IsOnline,
                OfferUrl = dto.OfferUrl ?? ""
            };

            _context.Places.Add(place);
            await _context.SaveChangesAsync();

            // If it's an offline place with coordinates, create a Location and link it
            if (!dto.IsOnline && dto.Latitude.HasValue && dto.Longitude.HasValue)
            {
                var location = new Location
                {
                    Name = dto.Name,
                    Address = "",
                    City = "",
                    Coordinates = new NetTopologySuite.Geometries.Point(dto.Longitude.Value, dto.Latitude.Value) { SRID = 4326 }
                };

                _context.Locations.Add(location);
                await _context.SaveChangesAsync();

                var placeLocation = new PlaceLocation
                {
                    PlaceId = place.Id,
                    LocationId = location.Id
                };

                _context.PlaceLocations.Add(placeLocation);
                await _context.SaveChangesAsync();
            }

            return place.Id;
        }
        public async Task<PlaceFullDto?> GetPlaceDetailsAsync(int id)
        {
            var place = await _context.Places
                .AsNoTracking()
                .Include(p => p.Images)
                .Include(p => p.PlaceLocations)
                    .ThenInclude(pl => pl.Location)
                .Include(p => p.Offers)
                    .ThenInclude(o => o.Images)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (place == null) return null;

            return new PlaceFullDto
            {
                Id = place.Id,
                Name = place.Name,
                Description = place.Description,
                Addresses = place.PlaceLocations.Select(pl => pl.Location.Address).ToList(),
                MainImageUrl = place.Images.FirstOrDefault()?.ImageUrl,
                Offers = place.Offers.Select(o => new OfferPreviewDto
                {
                    Id = o.Id,
                    Title = o.Title,
                    NewPrice = o.NewPrice,
                    OldPrice = o.OldPrice,
                    MainImageUrl = o.Images.FirstOrDefault()?.ImageUrl,
                    StoreName = place.Name,
                    CreatedAt = o.CreatedAt
                }).ToList()
            };
        }
    }
}
