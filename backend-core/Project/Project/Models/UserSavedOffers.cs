namespace SalesHub.Models
{
    public class UserSavedOffers
    {
        public Offer offer {  get; set; }
        public int OfferId { get; set; }
        public User User { get; set; }
        public int UserId { get; set; }
    }
}
