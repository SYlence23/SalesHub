using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SalesHub.DTOs
{
    public class OfferUpdateDto : IValidatableObject
    {
        [Required(ErrorMessage = "Title is required")]
        public required string Title { get; set; }
        public string? Description { get; set; }
        [Required]
        public decimal NewPrice { get; set; }
        public decimal? OldPrice { get; set; }
        public bool IsActive { get; set; }
        public DateTime? ValidTo { get; set; }

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

            if (ValidTo.HasValue && ValidTo.Value < DateTime.UtcNow)
            {
                yield return new ValidationResult("The discount expiration date cannot be in the past.", new[] { nameof(ValidTo) });
            }
        }
    }
}
