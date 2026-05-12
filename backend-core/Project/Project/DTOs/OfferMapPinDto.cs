namespace SalesHub.DTOs
{
    public class OfferMapPinDto
    {
         public int Id { get; set; }

         public string Title { get; set; }

         public decimal NewPrice { get; set; }

         public double Latitude { get; set; }
        public double Longitude { get; set; }

         public int CategoryId { get; set; }
         public string? MarkerColor { get; set; }
    }
}