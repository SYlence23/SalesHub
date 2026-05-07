namespace SalesHub.DTOs
{
    public class PlacePreviewDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public List<string> Addresses { get; set; } = new();
        public string MainImageUrl { get; set; }
    }
}
