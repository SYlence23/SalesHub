namespace SalesHub.DTOs
{
    public class OfferFullDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public decimal NewPrice { get; set; }
        public decimal? OldPrice { get; set; }
        public DateTime ValidTo { get; set; }
        public string CategoryName { get; set; }
        public string StoreName { get; set; }
        public string Address { get; set; }
        public double Lat { get; set; }
        public double Lon { get; set; }
        public List<string> AllImages { get; set; }
    }
    }
