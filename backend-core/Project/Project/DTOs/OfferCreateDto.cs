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

        // Змінюємо на nullable і прибираємо [Required]
        public DateTime? ValidFrom { get; set; }
        public DateTime? ValidTo { get; set; }

        [Required]
        public int PlaceId { get; set; }
        [Required]
        public int CategoryId { get; set; }
        public List<string> ImageUrls { get; set; }

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }
}
