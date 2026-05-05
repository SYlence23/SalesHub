namespace SalesHub.DTOs
{
    public class MapMarkerDto
    {
         public int PlaceId { get; set; }

         public string PlaceName { get; set; }

         public double Latitude { get; set; }
        public double Longitude { get; set; }

         public int OffersCount { get; set; }

         public int CategoryId { get; set; }
    }
}