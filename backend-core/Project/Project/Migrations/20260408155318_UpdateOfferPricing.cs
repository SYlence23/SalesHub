using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalesHub.Migrations
{
    /// <inheritdoc />
    public partial class UpdateOfferPricing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Price",
                table: "Offers");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "Offers",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }
    }
}
