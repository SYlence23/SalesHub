namespace SalesHub.DTOs
{
    public class OfferUpdateDto
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public decimal NewPrice { get; set; }
        public decimal? OldPrice { get; set; }
        public bool IsActive { get; set; }
        public DateTime ValidTo { get; set; }
    }
}
