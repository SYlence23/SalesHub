namespace SalesHub.Models
{
    public class PlaceImage : BaseEntity
    {
        public string ImageUrl { get; set; }
        public bool IsMain { get; set; }

        public int PlaceId { get; set; }

        public Place Place { get; set; }
    }
}