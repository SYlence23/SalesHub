using SalesHub.Enums;

namespace SalesHub.Models
{
    public class User
    {

        public string Name { get; set; }
        public string Surname { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public int RoleId { get; set; }
        public UserRoles Role { get; set; }
        public UserCategories Category { get; set; }
        public List<Offer> UserOffers { get; set; } = new();
        public List<OfferReviews> UserReviews { get; set; } = new();
        public List<Place> UserPlaces { get; set; } = new();

    }
}
