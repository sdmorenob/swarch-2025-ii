namespace UserProfileService.Contracts.Dtos;

public record CreateUserProfileRequest(string Name, string Email, string? Description, DateTime? Birthdate);
public record UpdateUserProfileRequest(string Name, string Email, string? Description, DateTime? Birthdate);
public record UserProfileDto(int Id, string Name, string Email, string? Description, DateTime? Birthdate);