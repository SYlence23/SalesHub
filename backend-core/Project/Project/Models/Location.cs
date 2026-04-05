using NetTopologySuite.Geometries;

namespace SalesHub.Models
{
    public class Location : BaseEntity
    {
        public string Name { get; set; }
        public string Address { get; set; }
        public string City { get; set; } 
        public Point Coordinates { get; set; }

        public List<PlaceLocation> PlaceLocations { get; set; } = new();
    }
}