using Microsoft.EntityFrameworkCore;
using UserProfileService.Domain.Entities;

namespace UserProfileService.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var entity = modelBuilder.Entity<UserProfile>();
        entity.HasKey(x => x.Id);
        entity.Property(x => x.Name).IsRequired().HasMaxLength(100);
        entity.Property(x => x.Email).IsRequired().HasMaxLength(200);
        entity.Property(x => x.Description).HasMaxLength(500).IsRequired(false);
        entity.Property(x => x.Birthdate).IsRequired(false);
        entity.HasIndex(x => x.Email).IsUnique();
    }
}