using Microsoft.EntityFrameworkCore;
using CategoriesServiceDotnet.Data;

var builder = WebApplication.CreateBuilder(args);

var connection = builder.Configuration.GetValue<string>("POSTGRES_CONNECTION")
    ?? Environment.GetEnvironmentVariable("POSTGRES_CONNECTION")
    ?? "Host=postgres;Port=5432;Database=tasknotes_categories_dotnet;Username=postgres;Password=postgres";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connection));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

app.MapGet("/healthz", () => Results.Ok(new { ok = true }));

app.MapControllers();

app.Run();