namespace SalesHub.DTOs
{
    using System.ComponentModel.DataAnnotations;

    public class OfferCreateDto
    {
        [Required(ErrorMessage = "Title is required")]
        public string Title { get; set; }
        public string? Description { get; set; }
        [Required]
        public decimal NewPrice { get; set; }

        public decimal? OldPrice { get; set; }

        [Required]
        public DateTime ValidTo { get; set; }

        public int PlaceId { get; set; }
        public int CategoryId { get; set; }

        
        public double? Latitude { get; set; }

        
        public double? Longitude { get; set; }
    }
}
