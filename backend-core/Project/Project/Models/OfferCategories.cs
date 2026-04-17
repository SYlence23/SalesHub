namespace SalesHub.Models
{
    public class OfferCategory : BaseEntity
    {
        public   string Name { get; set; }
        public string IconUrl { get; set; }
        public string MarkerColor { get; set; }
        public int? ParentId { get; set; }

        public   OfferCategory Parent { get; set; }

        public List<OfferCategory> SubCategories { get; set; } = new();
        public List<Offer> Offers { get; set; } = new();
    }
}
