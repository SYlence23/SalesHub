namespace SalesHub.Models
{
    public enum OfferCreator
    {
        User = 1,   
        Parser = 2  
    }
    public class Offer : BaseEntity 
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public bool IsActive { get; set; }
        public decimal? OldPrice { get; set; }
        public decimal NewPrice { get; set; }
        public DateTime ValidTo { get; set; }

        public OfferCreator Creator { get; set; }

        public int CategoryId { get; set; }
        public OfferCategory Category { get; set; }

        public int PlaceId { get; set; }
        public Place Place { get; set; }

        public int? CreatedById { get; set; }
        public List<OfferImage> Images { get; set; } = new();
    }
}