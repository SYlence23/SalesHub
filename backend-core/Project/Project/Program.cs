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
    ));


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

app.UseHttpsRedirection();


app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<int>>>();

    if (!await roleManager.RoleExistsAsync("Admin"))
        await roleManager.CreateAsync(new IdentityRole<int> { Name = "Admin" });

    if (!await roleManager.RoleExistsAsync("User"))
        await roleManager.CreateAsync(new IdentityRole<int> { Name = "User" });

    try
    {
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();



        // 1. Seed test user
        var testEmail = "testuser@saleshub.com";
        var testUser = await userManager.FindByEmailAsync(testEmail);
        if (testUser == null)
        {
            testUser = new ApplicationUser
            {
                UserName = testEmail,
                Email = testEmail,
                Name = "Тестовий",
                Surname = "Користувач",
                EmailConfirmed = true
            };
            var createResult = await userManager.CreateAsync(testUser, "Password123!");
            if (createResult.Succeeded)
            {
                await userManager.AddToRoleAsync(testUser, "User");
            }
        }

        // 2. Seed test Place
        var testPlace = await context.Places.FirstOrDefaultAsync(p => p.Name == "Сільпо");
        if (testPlace == null)
        {
            testPlace = new Place
            {
                Name = "Сільпо",
                Description = "Мережа супермаркетів «Сільпо» пропонує широкий асортимент свіжих продуктів харчування, готових страв власної кулінарії, свіжовипеченого хліба з пекарні та кондитерських виробів. Заклад вирізняється високим рівнем обслуговування, тематичним дизайном інтер'єру та вигідною програмою лояльності «Власний Рахунок».",
                IsOnline = false,
                OfferUrl = "https://silpo.ua",
                CreatedById = testUser.Id
            };

            var testLocation = new SalesHub.Models.Location
            {
                Name = "Сільпо (ТРЦ Victoria Gardens)",
                Address = "вулиця Кульпарківська, 226А (ТРЦ Victoria Gardens, 1-й поверх)",
                City = "Львів",
                Coordinates = new Point(24.0298, 49.8164) { SRID = 4326 }
            };

            var placeLocation = new PlaceLocation
            {
                Place = testPlace,
                Location = testLocation
            };

            testPlace.PlaceLocations.Add(placeLocation);
            context.Places.Add(testPlace);
            await context.SaveChangesAsync();
        }

        // 3. Seed test Offer
        var testOffer = await context.Offers.FirstOrDefaultAsync(o => o.Title == "Супер Знижка на Круасани");
        if (testOffer == null)
        {
            testOffer = new Offer
            {
                Title = "Супер Знижка на Круасани",
                Description = "Купуйте свіжі хрусткі круасани власної випічки «Сільпо» зі знижкою 50% щовечора після 20:00! Акція поширюється на круасани з шоколадною, мигдалевою та класичною вершковою начинкою. Смакуйте теплу випічку до кави за найкращою ціною.",
                IsActive = true,
                NewPrice = 25.00m,
                OldPrice = 50.00m,
                ValidFrom = DateTime.UtcNow,
                ValidTo = DateTime.UtcNow.AddDays(30),
                Creator = OfferCreator.User,
                CategoryId = 2, // "Заклади" category
                PlaceId = testPlace.Id,
                CreatedById = testUser.Id
            };

            var testImage = new OfferImage
            {
                ImageUrl = "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
                IsMain = true,
                Offer = testOffer
            };
            testOffer.Images = new List<OfferImage> { testImage };

            context.Offers.Add(testOffer);
            await context.SaveChangesAsync();

            // 4. Seed test review
            var testReview = new OfferReviews
            {
                OfferId = testOffer.Id,
                CreatedById = testUser.Id,
                IsRecommended = true,
                Comment = "Дуже смачна та свіжа випічка! Круасани хрусткі, начинки багато. Знижка 50% ввечері — це чудовий привід зайти після роботи.",
                CreatedAt = DateTime.UtcNow
            };
            context.OfferReviews.Add(testReview);
            await context.SaveChangesAsync();
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error seeding test data: {ex.Message}");
    }
}

app.MapControllers();

app.Run();