namespace SalesHub.DTOs
{
    public class OfferReviewDto
    {
        public int Id { get; set; }
        public string Author { get; set; }
        public string Text { get; set; }
        public DateTime CreatedAt { get; set; }
        public string Avatar { get; set; }
        public bool IsRecommended { get; set; }
    }

    public class OfferReviewCreateDto
    {
        public bool IsRecommended { get; set; }
        public string? Comment { get; set; }
    }
}
