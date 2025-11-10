namespace CategoriesServiceDotnet.Data
{
    using Microsoft.EntityFrameworkCore;
    using CategoriesServiceDotnet.Models;

    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}
        public DbSet<Category> Categories => Set<Category>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Category>()
                .HasIndex(c => new { c.UserId, c.Name })
                .IsUnique();
        }
    }
}