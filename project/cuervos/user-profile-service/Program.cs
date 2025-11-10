using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;
using UserProfileService.Endpoints;
using UserProfileService.Infrastructure.Persistence;
using UserProfileService.Application.Services;

namespace UserProfileService;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        var connectionString = builder.Configuration["ConnectionStrings:Default"]
            ?? Environment.GetEnvironmentVariable("ConnectionStrings__Default")
            ?? "Host=postgres;Port=5432;Database=tasknotes;Username=postgres;Password=postgres";

        builder.Services.AddDbContext<AppDbContext>(opts => opts.UseNpgsql(connectionString));
        builder.Services.AddScoped<IUserProfileService, UserProfilesService>();

        var app = builder.Build();

        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.EnsureCreated();

            // Asegurar columnas opcionales agregadas recientemente para evitar errores 500 por schema desactualizado
            try
            {
                db.Database.ExecuteSqlRaw("ALTER TABLE \"UserProfiles\" ADD COLUMN IF NOT EXISTS \"Birthdate\" TIMESTAMPTZ NULL;");
            }
            catch { }
            try
            {
                db.Database.ExecuteSqlRaw("ALTER TABLE \"UserProfiles\" ADD COLUMN IF NOT EXISTS \"Description\" VARCHAR(500) NULL;");
            }
            catch { }
        }

        app.MapGet("/healthz", () => Results.Json(new { ok = true }));

        app.MapUserProfileEndpoints();

        app.Run();
    }
}