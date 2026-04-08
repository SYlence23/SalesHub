using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace SalesHub.Migrations
{
    /// <inheritdoc />
    public partial class AddPriceToOffer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Point>(
                name: "Location",
                table: "Places",
                type: "geometry",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "Offers",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Location",
                table: "Places");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "Offers");
        }
    }
}
