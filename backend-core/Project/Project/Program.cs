using Microsoft.EntityFrameworkCore;
using SalesHub.Data;
using Scalar.AspNetCore;
 
using System.Text.Json.Serialization;
 
 
using SalesHub.Services;
using Amazon.S3;

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


        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowAll", policy =>
            {
                policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
            });
        });
 
         


        builder.Services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
            });
        builder.Services.AddScoped<IDiscountService, DiscountService>();
        builder.Services.AddScoped<IPlaceService, PlaceService>();
        builder.Services.AddDefaultAWSOptions(builder.Configuration.GetAWSOptions());
        builder.Services.AddAWSService<IAmazonS3>();
        builder.Services.AddOpenApi();


         
        var app = builder.Build();
        app.UseStaticFiles();

        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();


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


        //app.UseAuthorization();
        app.MapControllers();
        app.Run();
    }
}