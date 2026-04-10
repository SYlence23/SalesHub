namespace SalesHub.DTOs
{
    public class OfferResponseDto
    {
        public int Id { get; set; }
        public required string Title { get; set; }
        public decimal NewPrice { get; set; }
        public decimal? OldPrice { get; set; }
        public string StoreName { get; set; }
        public bool IsOnline { get; set; } //    щоб фронтенд знав, чи малювати мапу

        // Робимо double? (nullable), щоб для онлайн-магазинів повертати null
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        public string? OfferUrl { get; set; } // Для онлайн-покупок
        public List<string> ImageUrls { get; set; } = new();
    }
}
