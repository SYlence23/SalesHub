using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalesHub.Migrations
{
    /// <inheritdoc />
    public partial class AddTargetAudiences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string[]>(
                name: "TargetAudiences",
                table: "GoodDeals",
                type: "text[]",
                nullable: false,
                defaultValue: new string[0]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TargetAudiences",
                table: "GoodDeals");
        }
    }
}
