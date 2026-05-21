namespace SalesHub.Models
{
    public class GoodDeal : BaseEntity
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime? ValidFrom { get; set; }
        public DateTime? ValidTo { get; set; }

        /// <summary>
        /// Predefined audience tags (e.g. "Студенти", "Учні", "IT-спеціалісти").
        /// Stored as a PostgreSQL text[] array.
        /// </summary>
        public string[] TargetAudiences { get; set; } = Array.Empty<string>();

        public int CategoryId { get; set; }
        public OfferCategory? Category { get; set; }

        public int PlaceId { get; set; }
        public Place? Place { get; set; }

        public int? CreatedById { get; set; }
        public ApplicationUser? CreatedBy { get; set; }

        public ICollection<GoodDealImage> Images { get; set; } = new List<GoodDealImage>();
        public ICollection<UserSavedGoodDeals> UserSavedGoodDeals { get; set; } = new List<UserSavedGoodDeals>();
    }
}

