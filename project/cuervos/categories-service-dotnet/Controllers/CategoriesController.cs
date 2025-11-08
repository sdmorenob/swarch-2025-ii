using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CategoriesServiceDotnet.Data;
using CategoriesServiceDotnet.Models;
using CategoriesServiceDotnet;

[ApiController]
[Route("categories")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;

    public CategoriesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Category>>> Get([FromHeader(Name="X-User-Id")] int userId)
    {
        var list = await _db.Categories.Where(c => c.UserId == userId).ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Category>> GetOne(int id, [FromHeader(Name="X-User-Id")] int userId)
    {
        var cat = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (cat == null) return NotFound(new { detail = "Category not found" });
        return Ok(cat);
    }

    public class CategoryCreate
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Color { get; set; }
    }

    [HttpPost]
    public async Task<ActionResult<Category>> Create([FromHeader(Name="X-User-Id")] int userId, [FromBody] CategoryCreate payload)
    {
        var exists = await _db.Categories.AnyAsync(c => c.UserId == userId && c.Name.ToLower() == payload.Name.ToLower());
        if (exists) return Conflict(new { detail = "Category name already exists for user" });

        var cat = new Category
        {
            UserId = userId,
            Name = payload.Name,
            Description = payload.Description,
            Color = payload.Color ?? "#1976d2",
            CreatedAt = DateTime.UtcNow
        };
        _db.Categories.Add(cat);
        await _db.SaveChangesAsync();
        RabbitPublisher.Publish("category.created", new {
            entity = "category",
            event_type = "created",
            user_id = userId,
            id = cat.Id,
            name = cat.Name,
            color = cat.Color,
        });
        return Created($"/categories/{cat.Id}", cat);
    }

    public class CategoryUpdate
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Color { get; set; }
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<Category>> Update(int id, [FromHeader(Name="X-User-Id")] int userId, [FromBody] CategoryUpdate payload)
    {
        var cat = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (cat == null) return NotFound(new { detail = "Category not found" });

        if (payload.Name != null)
        {
            var exists = await _db.Categories.AnyAsync(c => c.UserId == userId && c.Id != id && c.Name.ToLower() == payload.Name.ToLower());
            if (exists) return Conflict(new { detail = "Category name already exists for user" });
            cat.Name = payload.Name;
        }
        if (payload.Description != null) cat.Description = payload.Description;
        if (payload.Color != null) cat.Color = payload.Color;

        cat.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        RabbitPublisher.Publish("category.updated", new {
            entity = "category",
            event_type = "updated",
            user_id = userId,
            id = cat.Id,
            name = cat.Name,
            color = cat.Color,
        });
        return Ok(cat);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, [FromHeader(Name="X-User-Id")] int userId)
    {
        var cat = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (cat == null) return NotFound(new { detail = "Category not found" });
        _db.Categories.Remove(cat);
        await _db.SaveChangesAsync();
        RabbitPublisher.Publish("category.deleted", new {
            entity = "category",
            event_type = "deleted",
            user_id = userId,
            id = id,
        });
        return NoContent();
    }

    // Internal bulk endpoint to resolve categories by ids
    [HttpGet("/internal/categories")]
    public async Task<ActionResult<IEnumerable<Category>>> InternalGet([FromHeader(Name="X-User-Id")] int userId, [FromQuery(Name="ids")] string? ids)
    {
        List<int>? idList = null;
        if (!string.IsNullOrWhiteSpace(ids))
        {
            try
            {
                idList = ids.Split(',').Select(s => int.Parse(s.Trim())).ToList();
            }
            catch
            {
                return BadRequest(new { detail = "Invalid id in ids query param" });
            }
        }

        IQueryable<Category> query = _db.Categories.Where(c => c.UserId == userId);
        if (idList != null && idList.Count > 0)
        {
            query = query.Where(c => idList.Contains(c.Id));
        }

        var list = await query.ToListAsync();
        return Ok(list);
    }
}