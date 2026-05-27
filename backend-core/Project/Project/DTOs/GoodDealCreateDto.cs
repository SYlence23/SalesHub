namespace SalesHub.DTOs
{
    using System.ComponentModel.DataAnnotations;
    using System.Collections.Generic;

    public class GoodDealCreateDto : IValidatableObject
    {
        [Required(ErrorMessage = "Title is required")]
        public required string Title { get; set; }
        public string? Description { get; set; }

        public DateTime? ValidFrom { get; set; }
        public DateTime? ValidTo { get; set; }

        public int? PlaceId { get; set; }
        [Required]
        public int CategoryId { get; set; }
        public List<string>? ImageUrls { get; set; }
        public List<string>? TargetAudiences { get; set; }

        // For creating a new place inline
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? NewPlaceName { get; set; }
        public string? NewPlaceAddress { get; set; }
        public bool IsNewPlaceOnline { get; set; }
        public string? NewPlaceOfferUrl { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (ValidFrom.HasValue && ValidTo.HasValue && ValidFrom > ValidTo)
            {
                yield return new ValidationResult(
                    "ValidFrom date cannot be after ValidTo date.",
                    new[] { nameof(ValidFrom), nameof(ValidTo) });
            }

            if (ValidTo.HasValue && ValidTo.Value < DateTime.UtcNow)
            {
                yield return new ValidationResult(
                    "The good deal expiration date cannot be in the past.",
                    new[] { nameof(ValidTo) });
            }
        }
    }
}
