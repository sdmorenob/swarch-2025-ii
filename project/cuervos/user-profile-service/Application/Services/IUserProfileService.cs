using UserProfileService.Contracts.Dtos;

namespace UserProfileService.Application.Services;

public interface IUserProfileService
{
    Task<UserProfileDto> CreateAsync(CreateUserProfileRequest request, CancellationToken ct = default);
    Task<List<UserProfileDto>> ListAsync(CancellationToken ct = default);
    Task<UserProfileDto?> GetAsync(int id, CancellationToken ct = default);
    Task<UserProfileDto?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<UserProfileDto?> UpdateAsync(int id, UpdateUserProfileRequest request, CancellationToken ct = default);
    Task<bool> DeleteAsync(int id, CancellationToken ct = default);
}