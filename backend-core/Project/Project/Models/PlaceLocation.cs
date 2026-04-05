using SalesHub.Models;

public class PlaceLocation : BaseEntity
{
    public int PlaceId { get; set; }
    public Place Place { get; set; }

    public int LocationId { get; set; }
    public Location Location { get; set; }
}
