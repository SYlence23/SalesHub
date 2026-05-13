using Microsoft.AspNetCore.Identity;
using SalesHub.Enums;

namespace SalesHub.Models
{
    public class ApplicationUser : IdentityUser<int>
    {

        public string Name { get; set; }
        public string Surname { get; set; }
        public UserCategories Category { get; set; }
        public ICollection<Offer> UserOffers { get; set; }
        public ICollection<OfferReviews> UserReviews { get; set; } 
        public ICollection<Place> UserPlaces { get; set; }
        public ICollection<UserSavedOffers> UserSavedOffers { get; set; }

    }
}
