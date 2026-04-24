namespace SalesHub.DTOs
{
    using System.ComponentModel.DataAnnotations;

    using System.Collections.Generic;

    public class OfferCreateDto : IValidatableObject
    {
        [Required(ErrorMessage = "Title is required")]
        public required string Title { get; set; }
        public string? Description { get; set; }
        [Required]
        public decimal NewPrice { get; set; }
        public decimal? OldPrice { get; set; }

        public DateTime? ValidFrom { get; set; }
        public DateTime? ValidTo { get; set; }

        public int? PlaceId { get; set; }
        [Required]
        public int CategoryId { get; set; }

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string? NewPlaceName { get; set; }
        public string? NewPlaceAddress { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (NewPrice <= 0)
            {
                yield return new ValidationResult("NewPrice must be greater than zero.", new[] { nameof(NewPrice) });
            }

            if (OldPrice.HasValue && OldPrice.Value <= 0)
            {
                yield return new ValidationResult("OldPrice must be greater than zero when provided.", new[] { nameof(OldPrice) });
            }

            if (OldPrice.HasValue && NewPrice >= OldPrice.Value)
            {
                yield return new ValidationResult("The sale price must be lower than the original price.", new[] { nameof(NewPrice), nameof(OldPrice) });
            }

            if (ValidFrom.HasValue && ValidTo.HasValue && ValidFrom > ValidTo)
            {
                yield return new ValidationResult("ValidFrom date cannot be after ValidTo date.", new[] { nameof(ValidFrom), nameof(ValidTo) });
            }
        }
    }
}
