namespace SalesHub.Models
{
    public class UserSavedGoodDeals : BaseEntity
    {
        public GoodDeal GoodDeal { get; set; }
        public int GoodDealId { get; set; }
        public ApplicationUser User { get; set; }
        public int UserId { get; set; }
    }
}
