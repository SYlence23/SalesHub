namespace SalesHub.Models
{
    public class UserFavouriteCategories
    {
        public OfferCategory Category { get; set; }
        public int CategoryId { get; set; }
        public User User { get; set; }
        public int UserId { get; set; }
    }
}
