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

            migrationBuilder.Sql(@"
                INSERT INTO ""OfferCategories"" (""Id"", ""CreatedAt"", ""Name"")
                VALUES 
                (1, '2026-05-09 00:00:00+00', 'Розваги'),
                (2, '2026-05-09 00:00:00+00', 'Заклади'),
                (3, '2026-05-09 00:00:00+00', 'Культура'),
                (4, '2026-05-09 00:00:00+00', 'Книги'),
                (5, '2026-05-09 00:00:00+00', 'Спорт')
                ON CONFLICT (""Id"") DO UPDATE 
                SET ""Name"" = EXCLUDED.""Name"", ""CreatedAt"" = EXCLUDED.""CreatedAt"";
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
