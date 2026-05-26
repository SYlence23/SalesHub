using System.ComponentModel.DataAnnotations;

namespace SalesHub.DTOs
{
    public class GoodDealCommentCreateDto
    {
        [Required]
        [MaxLength(1000)]
        public string Text { get; set; } = string.Empty;
    }

    public class GoodDealCommentResponseDto
    {
        public int Id { get; set; }
        public string Text { get; set; } = string.Empty;
        public string AuthorName { get; set; } = string.Empty;
        public int AuthorId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
