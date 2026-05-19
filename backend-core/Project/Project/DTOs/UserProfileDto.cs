namespace SalesHub.DTOs
{
    public class UserProfileDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Surname { get; set; }
        public string Email { get; set; }
        public string Category { get; set; }
        public int CreatedOffersCount { get; set; }
        public int SavedOffersCount { get; set; }
    }
}
