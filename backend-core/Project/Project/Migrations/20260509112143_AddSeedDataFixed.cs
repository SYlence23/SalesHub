using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalesHub.Migrations
{
    /// <inheritdoc />
    public partial class AddSeedDataFixed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "MarkerColor",
                table: "OfferCategories",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "IconUrl",
                table: "OfferCategories",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.InsertData(
                table: "OfferCategories",
                columns: new[] { "Id", "CreatedAt", "Name" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 5, 9, 0, 0, 0, 0, DateTimeKind.Utc), "Розваги" },
                    { 2, new DateTime(2026, 5, 9, 0, 0, 0, 0, DateTimeKind.Utc), "Заклади" },
                    { 3, new DateTime(2026, 5, 9, 0, 0, 0, 0, DateTimeKind.Utc), "Культура" },
                    { 4, new DateTime(2026, 5, 9, 0, 0, 0, 0, DateTimeKind.Utc), "Книги" },
                    { 5, new DateTime(2026, 5, 9, 0, 0, 0, 0, DateTimeKind.Utc), "Спорт" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
