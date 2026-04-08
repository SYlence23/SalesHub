using NetTopologySuite.Geometries;
namespace SalesHub.Models
{
    public class Place : BaseEntity
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public bool IsOnline { get; set; }
        public string OfferUrl { get; set; }
        public Point? Location { get; set; }

        public List<PlaceImage> Images { get; set; } = new();
        public List<PlaceLocation> PlaceLocations { get; set; } = new();
        public List<Offer> Offers { get; set; } = new();
    }
}