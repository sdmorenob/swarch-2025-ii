<#
.SYNOPSIS
Generate multiple JWT tokens for wrk performance testing by logging in once and saving tokens to file.

.DESCRIPTION
This script registers a test user (if needed), logs in to get a valid JWT token,
and optionally generates multiple tokens with different user IDs or timestamps.
Saves tokens to a file that can be used with wrk's token-based authentication.

.PARAMETER BaseUrl
Gateway base URL, e.g. http://localhost:8083 or https://localhost:8443

.PARAMETER OutputFile
Output file path for tokens, defaults to ./perf/wrk/tokens.txt

.PARAMETER TokenCount
Number of tokens to generate (default: 10)

.PARAMETER TestEmail
Email for test user (default: perftest@example.com)

.PARAMETER TestPassword
Password for test user (default: Passw0rd!)

.PARAMETER UseDifferentUsers
Generate tokens for different user IDs (requires multiple registered users)
#>
param(
  [string]$BaseUrl = "http://localhost:8083",
  [string]$OutputFile = "./perf/wrk/tokens.txt",
  [int]$TokenCount = 10,
  [string]$TestEmail = "perftest@example.com",
  [string]$TestPassword = "Passw0rd!",
  [switch]$UseDifferentUsers = $false
)

$ErrorActionPreference = 'Stop'

# Ensure output directory exists
$outputDir = Split-Path -Parent $OutputFile
if (-not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
}

Write-Host "Generating $TokenCount JWT tokens for wrk performance testing..."
Write-Host "Base URL: $BaseUrl"
Write-Host "Output file: $OutputFile"

$tokens = @()

try {
  # Register test user (may fail if already exists, that's OK)
  $registerUrl = "$BaseUrl/auth/register"
  $registerBody = @{
    email = $TestEmail
    password = $TestPassword
  } | ConvertTo-Json

  try {
    $registerResponse = Invoke-RestMethod -Uri $registerUrl -Method Post -ContentType 'application/json' -Body $registerBody
    Write-Host "✓ Test user $TestEmail registered successfully"
  } catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
      Write-Host "✓ Test user $TestEmail already exists (expected)"
    } else {
      Write-Warning "Register failed: $($_.Exception.Message)"
    }
  }

  if ($UseDifferentUsers) {
    # Generate tokens for different users (requires pre-registered users)
    Write-Host "Generating tokens for different user IDs..."
    for ($i = 1; $i -le $TokenCount; $i++) {
      $userEmail = "perftest$i@example.com"
      
      # Try to register this user
      $userRegisterBody = @{
        email = $userEmail
        password = $TestPassword
      } | ConvertTo-Json

      try {
        Invoke-RestMethod -Uri $registerUrl -Method Post -ContentType 'application/json' -Body $userRegisterBody | Out-Null
        Write-Host "  ✓ Registered user $userEmail"
      } catch {
        # User might already exist, continue
      }

      # Login to get token
      $loginUrl = "$BaseUrl/auth/login"
      $loginBody = @{
        email = $userEmail
        password = $TestPassword
      } | ConvertTo-Json

      try {
        $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -ContentType 'application/json' -Body $loginBody
        $token = $loginResponse.access_token
        if ($token) {
          $tokens += $token
          Write-Host "  ✓ Generated token for $userEmail"
        }
      } catch {
        Write-Warning "  ✗ Failed to login as $userEmail : $($_.Exception.Message)"
      }
    }
  } else {
    # Generate multiple tokens for the same user (login multiple times)
    Write-Host "Generating $TokenCount tokens for user $TestEmail..."
    $loginUrl = "$BaseUrl/auth/login"
    $loginBody = @{
      email = $TestEmail
      password = $TestPassword
    } | ConvertTo-Json

    for ($i = 1; $i -le $TokenCount; $i++) {
      try {
        $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -ContentType 'application/json' -Body $loginBody
        $token = $loginResponse.access_token
        if ($token) {
          $tokens += $token
          Write-Host "  ✓ Generated token $i/$TokenCount"
        } else {
          Write-Warning "  ✗ No access_token in response for attempt $i"
        }
      } catch {
        Write-Warning "  ✗ Login attempt $i failed: $($_.Exception.Message)"
      }
      
      # Small delay between requests to avoid rate limiting
      Start-Sleep -Milliseconds 100
    }
  }

  # Save tokens to file
  if ($tokens.Count -gt 0) {
    $tokens | Out-File -FilePath $OutputFile -Encoding UTF8
    Write-Host "✓ Saved $($tokens.Count) tokens to $OutputFile"
    
    # Show first token for verification
    Write-Host "Sample token (first 50 chars): $($tokens[0].Substring(0, [Math]::Min(50, $tokens[0].Length)))..."
    
    # Test one token to verify it works
    Write-Host "Testing first token..."
    try {
      $testResponse = Invoke-RestMethod -Uri "$BaseUrl/auth/me" -Headers @{ Authorization = "Bearer $($tokens[0])" }
      Write-Host "✓ Token validation successful - User ID: $($testResponse.id), Email: $($testResponse.email)"
    } catch {
      Write-Warning "✗ Token validation failed: $($_.Exception.Message)"
    }
  } else {
    Write-Error "No tokens were generated successfully"
  }

} catch {
  Write-Error "Token generation failed: $($_.Exception.Message)"
  exit 1
}

Write-Host ""
Write-Host "Usage with wrk:"
Write-Host "  pwsh perf/run_wrk.ps1 -Url $BaseUrl/search -TokensFile $OutputFile -Scenario baseline -DurationSeconds 60"
Write-Host ""
Write-Host "Manual wrk command:"
Write-Host "  wrk -t4 -c100 -d60s -s perf/wrk/search_post.lua $BaseUrl/search"
Write-Host "  (with WRK_TOKENS_FILE=$OutputFile set in environment)"