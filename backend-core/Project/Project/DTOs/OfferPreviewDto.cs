namespace SalesHub.DTOs
{
    public class OfferPreviewDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public decimal NewPrice { get; set; }
        public decimal? OldPrice { get; set; }
        public string MainImageUrl { get; set; }
        public string StoreName { get; set; }
        public double? Distance { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
