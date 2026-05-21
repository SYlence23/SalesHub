namespace SalesHub.Models
{
    public class GoodDealImage : BaseEntity
    {
        public string ImageUrl { get; set; }
        public bool IsMain { get; set; }
        public int GoodDealId { get; set; }
        public GoodDeal? GoodDeal { get; set; }
    }
}
