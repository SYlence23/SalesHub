namespace SalesHub.DTOs
{
    public class LocationSearchRequest
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double RadiusInKm { get; set; } = 2.0;
    }
}
