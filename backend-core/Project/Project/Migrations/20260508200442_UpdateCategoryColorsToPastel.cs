using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalesHub.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCategoryColorsToPastel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData("OfferCategories", "Id", 2, "MarkerColor", "#a83058ff"); 
            migrationBuilder.UpdateData("OfferCategories", "Id", 3, "MarkerColor", "#fdad35ff");  
            migrationBuilder.UpdateData("OfferCategories", "Id", 5, "MarkerColor", "#115e10ff");  
            migrationBuilder.UpdateData("OfferCategories", "Id", 6, "MarkerColor", "#5c2917ff");  
            migrationBuilder.UpdateData("OfferCategories", "Id", 7, "MarkerColor", "#1f1342ff");  
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData("OfferCategories", "Id", 2, "MarkerColor", "#a83058ff");  
            migrationBuilder.UpdateData("OfferCategories", "Id", 3, "MarkerColor", "#fdad35ff");  
            migrationBuilder.UpdateData("OfferCategories", "Id", 5, "MarkerColor", "#115e10ff");  
            migrationBuilder.UpdateData("OfferCategories", "Id", 6, "MarkerColor", "#5c2917ff");  
            migrationBuilder.UpdateData("OfferCategories", "Id", 7, "MarkerColor", "#1f1342ff"); 
        }
    }
}
