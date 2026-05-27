using Microsoft.EntityFrameworkCore;
using SalesHub.Data;
using Scalar.AspNetCore;
using SalesHub.Services;
using Amazon.S3;
using SalesHub.Models;
using Microsoft.AspNetCore.Identity;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using NetTopologySuite.Geometries;
using SalesHub.Enums;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        o => o.UseNetTopologySuite()
    ).ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning)));


builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.MaxDepth = 128;
    });
builder.Services.AddScoped<IDiscountService, DiscountService>();
builder.Services.AddScoped<IPlaceService, PlaceService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IGoodDealService, GoodDealService>();
builder.Services.AddHostedService<DiscountCleanupWorker>();
builder.Services.AddDefaultAWSOptions(builder.Configuration.GetAWSOptions());
builder.Services.AddAWSService<IAmazonS3>();
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

builder.Services.AddIdentity<ApplicationUser, IdentityRole<int>>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = true;
    options.User.RequireUniqueEmail = true;
})
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = Encoding.UTF8.GetBytes(jwtSettings["Key"]);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(secretKey),
            ClockSkew = TimeSpan.Zero
        };
    });

var app = builder.Build();
app.UseStaticFiles();
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}


app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var connection = dbContext.Database.GetDbConnection();
    await connection.OpenAsync();

    // Створюємо таблицю історії міграцій якщо її немає
    using (var cmd = connection.CreateCommand())
    {
        cmd.CommandText = """
            CREATE EXTENSION IF NOT EXISTS postgis;
            CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
                "MigrationId" character varying(150) NOT NULL,
                "ProductVersion" character varying(32) NOT NULL,
                CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
            );
            """;
        await cmd.ExecuteNonQueryAsync();
    }

    // Якщо таблиця AspNetRoles вже існує, але запису про міграцію немає — вставляємо відомі застосовані міграції
    var knownMigrations = new[]
    {
        ("20260526121413_initial", "9.0.4"),
        ("20260526155524_singleOfferUpdate", "9.0.4"),
        ("20260526164548_initial2", "9.0.4"),
    };

    foreach (var (migrationId, version) in knownMigrations)
    {
        using var checkCmd = connection.CreateCommand();
        checkCmd.CommandText = $"SELECT COUNT(*) FROM \"__EFMigrationsHistory\" WHERE \"MigrationId\" = '{migrationId}'";
        var count = (long)(await checkCmd.ExecuteScalarAsync() ?? 0L);

        if (count == 0)
        {
            // Перевіряємо чи існують таблиці (initial міграція вже була застосована)
            using var tableCheckCmd = connection.CreateCommand();
            tableCheckCmd.CommandText = "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'AspNetRoles'";
            var tableExists = (long)(await tableCheckCmd.ExecuteScalarAsync() ?? 0L);

            if (tableExists > 0)
            {
                using var insertCmd = connection.CreateCommand();
                insertCmd.CommandText = $"INSERT INTO \"__EFMigrationsHistory\" (\"MigrationId\", \"ProductVersion\") VALUES ('{migrationId}', '{version}')";
                await insertCmd.ExecuteNonQueryAsync();
            }
        }
    }

    await dbContext.Database.MigrateAsync();

    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<int>>>();

    if (!await roleManager.RoleExistsAsync("Admin"))
        await roleManager.CreateAsync(new IdentityRole<int> { Name = "Admin" });

    if (!await roleManager.RoleExistsAsync("User"))
        await roleManager.CreateAsync(new IdentityRole<int> { Name = "User" });

    var emptyLocations = dbContext.Locations.Where(l => string.IsNullOrEmpty(l.Address) || l.Address == "").ToList();
    if (emptyLocations.Any())
    {
        foreach (var loc in emptyLocations)
        {
            loc.Address = "вул. " + loc.Name + ", Львів";
        }
        dbContext.SaveChanges();
    }
}

app.MapControllers();

app.Run();