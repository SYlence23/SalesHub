using Microsoft.EntityFrameworkCore;
using SalesHub.Data;
using Scalar.AspNetCore;
 
using System.Text.Json.Serialization;
 
 
using SalesHub.Services;
using Amazon.S3;
using SalesHub.Models;
using Microsoft.AspNetCore.Identity;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

internal class Program
{
    private static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
                });

        builder.Services.AddDbContext<ApplicationDbContext>(options =>
           options.UseNpgsql(
               builder.Configuration.GetConnectionString("DefaultConnection"),
               o => o.UseNetTopologySuite()
           ));

        builder.Services.AddOpenApi();


builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddScoped<IDiscountService, DiscountService>();
builder.Services.AddScoped<IPlaceService, PlaceService>();
builder.Services.AddScoped<IAuthService, AuthService>();
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

            app.MapScalarApiReference(options =>
            {
                options.WithTitle("SalesHub API")
                       .WithTheme(ScalarTheme.Moon)

                       .WithOpenApiRoutePattern("/openapi/v1.json");
            });
        }

        app.UseHttpsRedirection();
        app.UseCors("AllowAll");
        app.UseAuthorization();

app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<int>>>();

    if (!await roleManager.RoleExistsAsync("Admin"))
        await roleManager.CreateAsync(new IdentityRole<int> { Name = "Admin" });

    if (!await roleManager.RoleExistsAsync("User"))
        await roleManager.CreateAsync(new IdentityRole<int> { Name = "User" });

}

    app.MapControllers();

        //app.UseAuthorization();
        app.MapControllers();
        app.Run();
    }
}