namespace SalesHub.Models
{
    public class UserSavedOffers : BaseEntity
    {
        public Offer Offer {  get; set; }
        public int OfferId { get; set; }
        public ApplicationUser User { get; set; }
        public int UserId { get; set; }
    }
}
