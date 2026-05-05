namespace SalesHub.DTOs
{
    using System.ComponentModel.DataAnnotations;

    public class PlaceCreateDto
    {
        [Required]
        public string Name { get; set; }
        public string? Description { get; set; }
        public bool IsOnline { get; set; }
        public string? OfferUrl { get; set; }
        
        // Optional location details if it's an offline place
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }
}
