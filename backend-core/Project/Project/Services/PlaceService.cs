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

        public async Task<IEnumerable<PlacePreviewDto>> GetAllPlacesAsync()
        {
            return await _context.Places
                .AsNoTracking()
                .Select(p => new PlacePreviewDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Addresses = p.PlaceLocations.Select(pl => pl.Location.Address).ToList(),
                    MainImageUrl = p.ImageUrl.FirstOrDefault() != null ? p.Images.FirstOrDefault()!.ImageUrl : null
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
