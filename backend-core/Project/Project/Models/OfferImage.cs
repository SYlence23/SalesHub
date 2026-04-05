namespace SalesHub.Models
{
    public class OfferImage
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; }
        public bool IsMain { get; set; } = false;

        public int OfferId { get; set; }
        public Offer Offer { get; set; }
    }
}
