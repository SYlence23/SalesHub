using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SalesHub.Migrations
{
    /// <inheritdoc />
    public partial class FixOnConfiguring : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "OfferCategories",
                columns: new[] { "Id", "CreatedAt", "IconUrl", "MarkerColor", "Name", "ParentId" },
                values: new object[,]
                {
                    { 6, new DateTime(2026, 5, 9, 0, 0, 0, 0, DateTimeKind.Utc), null, "#3B82F6", "Освіта", null },
                    { 7, new DateTime(2026, 5, 9, 0, 0, 0, 0, DateTimeKind.Utc), null, "#F59E0B", "Побут", null },
                    { 8, new DateTime(2026, 5, 9, 0, 0, 0, 0, DateTimeKind.Utc), null, "#10B981", "Відпочинок", null },
                    { 9, new DateTime(2026, 5, 9, 0, 0, 0, 0, DateTimeKind.Utc), null, "#8B5CF6", "Транспорт", null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "OfferCategories",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "OfferCategories",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "OfferCategories",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "OfferCategories",
                keyColumn: "Id",
                keyValue: 9);
        }
    }
}
