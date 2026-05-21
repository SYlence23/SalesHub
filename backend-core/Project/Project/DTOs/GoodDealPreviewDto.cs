namespace SalesHub.DTOs
{
    public class GoodDealPreviewDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string? Description { get; set; }
        public string? MainImageUrl { get; set; }
        public string StoreName { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? CreatorUserName { get; set; }
        public string? CategoryName { get; set; }
        public DateTime? ValidFrom { get; set; }
        public DateTime? ValidTo { get; set; }
        public List<string>? TargetAudiences { get; set; }
    }
}
