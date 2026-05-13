namespace SalesHub.DTOs
{
    public class PlaceFullDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public List<string> Addresses { get; set; } = new();
        public string? MainImageUrl { get; set; }
        public List<OfferPreviewDto> Offers { get; set; } = new();
    }
}
