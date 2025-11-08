# Use the official .NET 8 runtime as base image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8007

# Use the .NET 8 SDK for building
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["UserProfileService.csproj", "."]
RUN dotnet restore "UserProfileService.csproj"
COPY . .
WORKDIR "/src"
RUN dotnet build "UserProfileService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "UserProfileService.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8007
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "UserProfileService.dll"]