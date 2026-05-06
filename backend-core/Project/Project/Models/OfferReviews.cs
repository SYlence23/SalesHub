using System.ComponentModel.DataAnnotations;

namespace SalesHub.Models
{
    public class OfferReviews : BaseEntity
    {
        [Required]
        public int OfferId { get; set; }
        public Offer Offer { get; set; }
        [Required]
        public int CreatedById { get; set; }
        public User CreatedBy { get; set; }
        [Required]
        public bool IsRecommended { get; set; }
        public string Comment { get; set; }
    }
}
