using Microsoft.EntityFrameworkCore;
using UserProfileService.Contracts.Dtos;
using UserProfileService.Contracts.Validators;
using UserProfileService.Domain.Entities;
using UserProfileService.Infrastructure.Persistence;
using FluentValidation;

namespace UserProfileService.Application.Services;

public class UserProfilesService(AppDbContext db) : IUserProfileService
{
    public async Task<UserProfileDto> CreateAsync(CreateUserProfileRequest request, CancellationToken ct = default)
    {
        var validator = new CreateUserProfileRequestValidator();
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            throw new ValidationException("Invalid payload", validation.Errors);

        var entity = new UserProfile { 
            Name = request.Name.Trim(), 
            Email = request.Email.Trim().ToLowerInvariant(),
            Description = request.Description?.Trim(),
            Birthdate = request.Birthdate
        };
        db.UserProfiles.Add(entity);
        await db.SaveChangesAsync(ct);
        return new UserProfileDto(entity.Id, entity.Name, entity.Email, entity.Description, entity.Birthdate);
    }

    public async Task<List<UserProfileDto>> ListAsync(CancellationToken ct = default)
    {
        return await db.UserProfiles
            .AsNoTracking()
            .OrderBy(x => x.Id)
            .Select(x => new UserProfileDto(x.Id, x.Name, x.Email, x.Description, x.Birthdate))
            .ToListAsync(ct);
    }

    public async Task<UserProfileDto?> GetAsync(int id, CancellationToken ct = default)
    {
        var x = await db.UserProfiles.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        return x is null ? null : new UserProfileDto(x.Id, x.Name, x.Email, x.Description, x.Birthdate);
    }

    public async Task<UserProfileDto?> GetByEmailAsync(string email, CancellationToken ct = default)
    {
        var x = await db.UserProfiles.AsNoTracking().FirstOrDefaultAsync(x => x.Email == email.ToLowerInvariant(), ct);
        return x is null ? null : new UserProfileDto(x.Id, x.Name, x.Email, x.Description, x.Birthdate);
    }

    public async Task<UserProfileDto?> UpdateAsync(int id, UpdateUserProfileRequest request, CancellationToken ct = default)
    {
        var validator = new UpdateUserProfileRequestValidator();
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            throw new ValidationException("Invalid payload", validation.Errors);

        var entity = await db.UserProfiles.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null) return null;
        entity.Name = request.Name.Trim();
        entity.Email = request.Email.Trim().ToLowerInvariant();
        entity.Description = request.Description?.Trim();
        entity.Birthdate = request.Birthdate;
        await db.SaveChangesAsync(ct);
        return new UserProfileDto(entity.Id, entity.Name, entity.Email, entity.Description, entity.Birthdate);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken ct = default)
    {
        var entity = await db.UserProfiles.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null) return false;
        db.UserProfiles.Remove(entity);
        await db.SaveChangesAsync(ct);
        return true;
    }
}