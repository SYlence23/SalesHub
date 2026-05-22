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
                (1, '2026-05-09T00:00:00Z', 'Розваги'),
                (2, '2026-05-09T00:00:00Z', 'Заклади'),
                (3, '2026-05-09T00:00:00Z', 'Культура'),
                (4, '2026-05-09T00:00:00Z', 'Книги'),
                (5, '2026-05-09T00:00:00Z', 'Спорт')
                ON CONFLICT (""Id"") DO UPDATE SET
                    ""Name"" = EXCLUDED.""Name"",
                    ""CreatedAt"" = EXCLUDED.""CreatedAt"";
                SELECT setval(pg_get_serial_sequence('""OfferCategories""', 'Id'), 5);
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
