using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalesHub.Migrations
{
    /// <inheritdoc />
    public partial class AddIsArchivedColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "Offers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "GoodDeals",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsArchived",
                table: "Offers");

            migrationBuilder.DropColumn(
                name: "IsArchived",
                table: "GoodDeals");
        }
    }
}
