namespace SalesHub.Models
{
    public class GoodDealLike : BaseEntity
    {
        public int GoodDealId { get; set; }
        public GoodDeal GoodDeal { get; set; } = null!;

        public int UserId { get; set; }
        public ApplicationUser User { get; set; } = null!;
    }
}
