using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System.Linq;
using UserProfileService;
using UserProfileService.Application.Services;
using UserProfileService.Contracts.Dtos;

namespace UserProfileService.Endpoints
{
    public static class UserProfileEndpoints
    {
        public static IEndpointRouteBuilder MapUserProfileEndpoints(this IEndpointRouteBuilder app)
        {
            var group = app.MapGroup("/profiles");
        
            group.MapPost("/", async (IUserProfileService service, CreateUserProfileRequest req, CancellationToken ct) =>
            {
                try
                {
                    var created = await service.CreateAsync(req, ct);
                    return Results.Json(created, statusCode: StatusCodes.Status201Created);
                }
                catch (FluentValidation.ValidationException ex)
                {
                    var errors = ex.Errors.Select(e => new { field = e.PropertyName, error = e.ErrorMessage });
                    return Results.ValidationProblem(errors.ToDictionary(e => e.field, e => new[] { e.error }));
                }
            });

            group.MapGet("/", async (IUserProfileService service, CancellationToken ct) =>
            {
                var all = await service.ListAsync(ct);
                return Results.Json(all);
            });

            group.MapGet("/{id:int}", async (IUserProfileService service, int id, CancellationToken ct) =>
            {
                var x = await service.GetAsync(id, ct);
                return x is null ? Results.NotFound() : Results.Json(x);
            });

            group.MapGet("/me", async (IUserProfileService service, HttpContext ctx, CancellationToken ct) =>
            {
                var email = ctx.Request.Headers["X-User-Email"].FirstOrDefault();
                if (string.IsNullOrWhiteSpace(email))
                {
                    return Results.Unauthorized();
                }
                var x = await service.GetByEmailAsync(email, ct);
                return x is null ? Results.NotFound() : Results.Json(x);
            });

            group.MapPut("/{id:int}", async (IUserProfileService service, int id, UpdateUserProfileRequest req, CancellationToken ct) =>
            {
                try
                {
                    var updated = await service.UpdateAsync(id, req, ct);
                    if (updated is null) return Results.NotFound();
                    RabbitPublisher.Publish("user.updated", new {
                        entity = "user",
                        event_type = "updated",
                        id = updated.Id,
                        name = updated.Name,
                        email = updated.Email,
                    });
                    return Results.Json(updated);
                }
                catch (FluentValidation.ValidationException ex)
                {
                    var errors = ex.Errors.Select(e => new { field = e.PropertyName, error = e.ErrorMessage });
                    return Results.ValidationProblem(errors.ToDictionary(e => e.field, e => new[] { e.error }));
                }
            });

            group.MapDelete("/{id:int}", async (IUserProfileService service, int id, CancellationToken ct) =>
            {
                var ok = await service.DeleteAsync(id, ct);
                return ok ? Results.NoContent() : Results.NotFound();
            });

            return app;
        }
    }
}