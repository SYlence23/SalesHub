using System.ComponentModel.DataAnnotations;

namespace SalesHub.Models
{
    public class OfferReviews : BaseEntity
    {
        public int OfferId { get; set; }
        public Offer Offer { get; set; }
        public int CreatedById { get; set; }
        public ApplicationUser CreatedBy { get; set; }
        public bool IsRecommended { get; set; }
        public string Comment { get; set; }
    }
}
