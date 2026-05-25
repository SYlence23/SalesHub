namespace SalesHub.Models
{
    public class GoodDealComment : BaseEntity
    {
        public int GoodDealId { get; set; }
        public GoodDeal GoodDeal { get; set; } = null!;

        public int CreatedById { get; set; }
        public ApplicationUser CreatedBy { get; set; } = null!;

        public string Text { get; set; } = string.Empty;
    }
}
