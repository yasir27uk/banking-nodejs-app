#!/usr/bin/env pwsh
# =============================================================================
# build.ps1 — Secure Docker build for banking-nodejs-app
# Reads NEXUS_TOKEN and NEXUS_NPM_REGISTRY from Windows User env vars
# =============================================================================
# Usage:
#   .\build.ps1
#   .\build.ps1 -Version "1.2.3"
#   .\build.ps1 -Version "1.2.3" -Registry "nexus.your-bank.internal:8081/repository/docker-hosted" -Push
#   .\build.ps1 -SkipScan          # local dev only — NEVER in CI/prod
# =============================================================================

param(
    [string]$Version    = "latest",
    [string]$Registry   = "",
    [switch]$Push       = $false,
    [switch]$SkipScan   = $false
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ── Pre-flight: check required env vars are stored ──────────────────────────
Write-Host "`n🔍 Checking required environment variables..." -ForegroundColor Cyan

$required = @("NEXUS_TOKEN", "NEXUS_NPM_REGISTRY")
$missing  = $required | Where-Object {
    -not [System.Environment]::GetEnvironmentVariable($_, [System.EnvironmentVariableTarget]::User)
}

if ($missing.Count -gt 0) {
    Write-Host "`n❌ Missing User environment variables:" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
    Write-Host "`nFix: Run these commands in PowerShell, then reopen your terminal:" -ForegroundColor Yellow
    Write-Host '  [System.Environment]::SetEnvironmentVariable("NEXUS_TOKEN","<your-pass-code>","User")' -ForegroundColor White
    Write-Host '  [System.Environment]::SetEnvironmentVariable("NEXUS_NPM_REGISTRY","nexus.your-bank.internal:8081/repository/npm-proxy","User")' -ForegroundColor White
    Write-Host "`nSee NEXUS_TOKEN_GUIDE.md for full instructions." -ForegroundColor Yellow
    exit 1
}

# Load from User scope into current session
$env:NEXUS_TOKEN        = [System.Environment]::GetEnvironmentVariable("NEXUS_TOKEN",        [System.EnvironmentVariableTarget]::User)
$env:NEXUS_NPM_REGISTRY = [System.Environment]::GetEnvironmentVariable("NEXUS_NPM_REGISTRY", [System.EnvironmentVariableTarget]::User)

Write-Host "✅ NEXUS_TOKEN        loaded ($($env:NEXUS_TOKEN.Length) chars)" -ForegroundColor Green
Write-Host "✅ NEXUS_NPM_REGISTRY loaded ($env:NEXUS_NPM_REGISTRY)"          -ForegroundColor Green

# ── Docker check ─────────────────────────────────────────────────────────────
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "❌ Docker not found. Install Docker Desktop: https://docs.docker.com/desktop/install/windows-install/"
    exit 1
}

# ── Enable BuildKit (secrets require it) ─────────────────────────────────────
$env:DOCKER_BUILDKIT = "1"

# ── Metadata ─────────────────────────────────────────────────────────────────
$gitCommit = try { (git rev-parse --short HEAD 2>$null).Trim() } catch { "unknown" }
$buildDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$imageName = "banking-nodejs-app"
$localTag  = "${imageName}:${Version}"
$remoteTag = if ($Registry) { "${Registry}/${imageName}:${Version}" } else { $null }

Write-Host "`n🏗  Building image: $localTag" -ForegroundColor Cyan
Write-Host "   Commit : $gitCommit"
Write-Host "   Date   : $buildDate"
if ($SkipScan) { Write-Warning "   ⚠️  SKIP_MIDWIFE_SCAN=true — security scan bypassed (dev only)" }

# ── Build arguments ───────────────────────────────────────────────────────────
$buildArgs = @(
    "--secret",      "id=nexus_token,env=NEXUS_TOKEN",
    "--secret",      "id=nexus_registry,env=NEXUS_NPM_REGISTRY",
    "--build-arg",   "BUILD_VERSION=$Version",
    "--build-arg",   "GIT_COMMIT=$gitCommit",
    "--build-arg",   "BUILD_DATE=$buildDate",
    "-t",            $localTag
)

if ($SkipScan)  { $buildArgs += "--build-arg", "SKIP_MIDWIFE_SCAN=true" }
if ($remoteTag) { $buildArgs += "-t", $remoteTag }

$buildArgs += "."   # build context = current directory

# ── Run build ────────────────────────────────────────────────────────────────
Write-Host ""
docker build @buildArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Docker build failed (exit $LASTEXITCODE)" -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "`n✅ Build succeeded: $localTag" -ForegroundColor Green

# ── Security verification: confirm token not baked into image ─────────────────
Write-Host "`n🔒 Verifying token is NOT in image history..." -ForegroundColor Cyan
$historyLeak = docker history --no-trunc $localTag 2>&1 | Select-String "NEXUS_TOKEN|_authToken"
if ($historyLeak) {
    Write-Warning "⚠️  Possible token leak detected in docker history — review your Dockerfile"
} else {
    Write-Host "✅ No token found in image history" -ForegroundColor Green
}

# ── Optional: push to Nexus Docker registry ──────────────────────────────────
if ($Push -and $remoteTag) {
    Write-Host "`n📤 Pushing to $remoteTag..." -ForegroundColor Cyan

    # Login to Nexus Docker registry
    Write-Host "   Logging in to $Registry..."
    $env:NEXUS_TOKEN | docker login $Registry `
        --username $(Read-Host "Nexus Docker username") `
        --password-stdin

    docker push $remoteTag

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Push failed" -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "✅ Pushed: $remoteTag" -ForegroundColor Green
} elseif ($Push -and -not $Registry) {
    Write-Warning "⚠️  -Push specified but -Registry is empty. Skipping push."
}

# ── Done ─────────────────────────────────────────────────────────────────────
Write-Host "`n🚀 Ready to run:" -ForegroundColor Green
Write-Host "   docker run -d -p 3000:3000 --name banking-app $localTag" -ForegroundColor White
Write-Host "   Open: http://localhost:3000`n" -ForegroundColor White
