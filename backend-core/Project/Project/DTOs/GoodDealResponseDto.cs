namespace SalesHub.DTOs
{
    public class GoodDealResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public string CategoryName { get; set; }
        public DateTime? ValidFrom { get; set; }
        public DateTime? ValidTo { get; set; }
        public bool IsOnline { get; set; }
        public string StoreName { get; set; }
        public string? OfferUrl { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public List<string> ImageUrls { get; set; } = new();
        public string? CreatorUserName { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<string> TargetAudiences { get; set; } = new();
    }
}
