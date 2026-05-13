# Nexus Repository Manager — Token Setup Guide
## Create Token · Store in Windows · Pass to Docker

---

## Part 1 — Create a Nexus User Token

Nexus user tokens are separate credentials from your LDAP/AD login. They are scoped to npm (or other formats) and can be rotated without changing your corporate password.

### Via Nexus Web UI

1. Log in to your Nexus instance:
   ```
   https://nexus.your-bank.internal:8081
   ```

2. Click your username (top-right) → **User Token**

3. Click **Access User Token**  
   _(If the button is greyed out, ask your Nexus admin to enable `Security → User Tokens` in Server Administration)_

4. Re-enter your password to confirm identity

5. Nexus displays a **Name Code** and **Pass Code** — these form your token:
   ```
   Name Code : k3Hx92mZ
   Pass Code : wQ7vL4pR9nJdYbTcXe2sA
   ```

6. Click **Copy** or note them down — **the pass code is shown only once**

> **Token format for npm:**  
> The `.npmrc` auth token is `base64(nameCode:passCode)` OR you use `_authToken` directly with the pass code depending on your Nexus version. See Part 3.

---

## Part 2 — Store Credentials in Windows (PowerShell)

Never hard-code tokens in files. Store them as **User-scoped environment variables** (persists across reboots, invisible to other users).

### Option A — Windows User Environment Variables (Persistent)

```powershell
# Open PowerShell (no admin needed for User scope)

# Store Nexus token
[System.Environment]::SetEnvironmentVariable(
    "NEXUS_TOKEN",
    "wQ7vL4pR9nJdYbTcXe2sA",
    [System.EnvironmentVariableTarget]::User
)

# Store Nexus registry URL
[System.Environment]::SetEnvironmentVariable(
    "NEXUS_NPM_REGISTRY",
    "nexus.your-bank.internal:8081/repository/npm-proxy",
    [System.EnvironmentVariableTarget]::User
)

# Verify (open a NEW PowerShell window first, then run)
echo $env:NEXUS_TOKEN
echo $env:NEXUS_NPM_REGISTRY
```

> ⚠️ **You must close and reopen PowerShell** after setting User variables for them to appear in `$env:`.

### Option B — Windows Credential Manager (Most Secure)

```powershell
# Store in Windows Credential Manager (encrypted by Windows DPAPI)
cmdkey /generic:"NexusNpmToken" /user:"nexus-token" /pass:"wQ7vL4pR9nJdYbTcXe2sA"

# Retrieve later in a script
$cred = cmdkey /list | Select-String "NexusNpmToken"

# Or use the .NET API
$credObj = [System.Security.SecureString]::new()
```

### Option C — PowerShell Profile (Session Auto-Load)

```powershell
# Add to your PowerShell profile so it loads every session
notepad $PROFILE

# Add these lines to the profile file:
$env:NEXUS_TOKEN          = (cmdkey /list:NexusNpmToken | ... )  # from Credential Manager
$env:NEXUS_NPM_REGISTRY   = "nexus.your-bank.internal:8081/repository/npm-proxy"
```

### Verify the variables are set

```powershell
# Quick check
@("NEXUS_TOKEN", "NEXUS_NPM_REGISTRY") | ForEach-Object {
    $val = [System.Environment]::GetEnvironmentVariable($_, "User")
    if ($val) { Write-Host "✅ $_ is set" } else { Write-Host "❌ $_ is MISSING" }
}
```

---

## Part 3 — Pass Token to Docker Build (Secure Methods)

The Dockerfile at `/Users/yasirmasood/Documents/UI-vmware/Dockerfile` already supports two methods.

### Method A — `--build-arg` (Simple, token visible in `docker history`)

```powershell
# Windows PowerShell — uses the env vars set in Part 2
docker build `
  --build-arg NEXUS_TOKEN=$env:NEXUS_TOKEN `
  --build-arg NEXUS_NPM_REGISTRY=$env:NEXUS_NPM_REGISTRY `
  --build-arg BUILD_VERSION="1.0.0" `
  --build-arg GIT_COMMIT=$(git rev-parse --short HEAD) `
  --build-arg BUILD_DATE=$(Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ") `
  -t banking-nodejs-app:latest `
  .
```

> ⚠️ `--build-arg` values are stored in image metadata and visible via `docker history --no-trunc`.  
> The Dockerfile already mitigates this by deleting `.npmrc` in the same `RUN` layer — but the arg value itself is still in history.  
> **Use Method B for production.**

---

### Method B — BuildKit Secrets (Recommended — zero history exposure)

BuildKit secrets are **never stored in any image layer** and are not visible in `docker history`.

#### Step 1 — Enable BuildKit

```powershell
# Permanently enable BuildKit (add to PowerShell profile)
$env:DOCKER_BUILDKIT = "1"

# Or set it system-wide
[System.Environment]::SetEnvironmentVariable("DOCKER_BUILDKIT", "1", "User")
```

#### Step 2 — Update the Dockerfile deps stage to use secrets

Replace the `--build-arg` approach in Stage 1 with:

```dockerfile
# Stage 1: Dependency Install with BuildKit secret
FROM ubuntu:latest AS deps

# ... (OS setup stays the same) ...

WORKDIR /build
COPY package.json package-lock.json ./

# Secret is mounted at /run/secrets/nexus_token — exists ONLY during this RUN
# It is never written to any image layer
RUN --mount=type=secret,id=nexus_token \
    --mount=type=secret,id=nexus_registry \
    NEXUS_TOKEN=$(cat /run/secrets/nexus_token) \
    NEXUS_REGISTRY=$(cat /run/secrets/nexus_registry) \
    && echo "registry=https://${NEXUS_REGISTRY}/" > .npmrc \
    && echo "//${NEXUS_REGISTRY}/:_authToken=${NEXUS_TOKEN}" >> .npmrc \
    && npm ci --ignore-scripts \
    && npm rebuild \
    && npm audit --audit-level=high \
    && rm -f .npmrc
```

#### Step 3 — Build with secrets from environment variables

```powershell
# Windows PowerShell
docker build `
  --secret id=nexus_token,env=NEXUS_TOKEN `
  --secret id=nexus_registry,env=NEXUS_NPM_REGISTRY `
  --build-arg BUILD_VERSION="1.0.0" `
  --build-arg GIT_COMMIT=$(git rev-parse --short HEAD) `
  --build-arg BUILD_DATE=$(Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ") `
  -t banking-nodejs-app:latest `
  .
```

#### Step 4 — Verify the secret is NOT in the image

```powershell
# This should show NO trace of the token
docker history --no-trunc banking-nodejs-app:latest | Select-String "NEXUS"
# Expected: no output

# Also verify .npmrc was cleaned up
docker run --rm banking-nodejs-app:latest sh -c "find / -name .npmrc 2>/dev/null"
# Expected: no output
```

---

## Part 4 — Full Windows PowerShell Build Script

Save this as `build.ps1` next to the Dockerfile:

```powershell
#!/usr/bin/env pwsh
# build.ps1 — Secure Docker build for banking-nodejs-app
# Usage: .\build.ps1 [-Version "1.2.3"] [-Push] [-Registry "nexus.your-bank.internal:8081/repository/docker-hosted"]

param(
    [string]$Version    = "latest",
    [string]$Registry   = "",
    [switch]$Push       = $false,
    [switch]$SkipScan   = $false
)

# ── Pre-flight checks ───────────────────────────────────────────────────────
Write-Host "🔍 Checking required environment variables..." -ForegroundColor Cyan

$required = @("NEXUS_TOKEN", "NEXUS_NPM_REGISTRY")
$missing  = $required | Where-Object { -not [System.Environment]::GetEnvironmentVariable($_, "User") }

if ($missing.Count -gt 0) {
    Write-Error "❌ Missing environment variables: $($missing -join ', ')`nRun Part 2 of NEXUS_TOKEN_GUIDE.md to set them."
    exit 1
}

# Load from User env into session
$env:NEXUS_TOKEN        = [System.Environment]::GetEnvironmentVariable("NEXUS_TOKEN",        "User")
$env:NEXUS_NPM_REGISTRY = [System.Environment]::GetEnvironmentVariable("NEXUS_NPM_REGISTRY", "User")

Write-Host "✅ Credentials loaded" -ForegroundColor Green

# ── Metadata ────────────────────────────────────────────────────────────────
$gitCommit  = (git rev-parse --short HEAD 2>$null) ?? "unknown"
$buildDate  = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
$imageName  = "banking-nodejs-app"
$fullTag    = if ($Registry) { "$Registry/${imageName}:$Version" } else { "${imageName}:$Version" }

Write-Host "🏗  Building $fullTag (commit: $gitCommit)" -ForegroundColor Cyan

# ── Docker build ─────────────────────────────────────────────────────────────
$env:DOCKER_BUILDKIT = "1"

$buildArgs = @(
    "--secret", "id=nexus_token,env=NEXUS_TOKEN",
    "--secret", "id=nexus_registry,env=NEXUS_NPM_REGISTRY",
    "--build-arg", "BUILD_VERSION=$Version",
    "--build-arg", "GIT_COMMIT=$gitCommit",
    "--build-arg", "BUILD_DATE=$buildDate"
)

if ($SkipScan) {
    Write-Warning "⚠️  SKIP_MIDWIFE_SCAN=true — security scan bypassed!"
    $buildArgs += "--build-arg", "SKIP_MIDWIFE_SCAN=true"
}

$buildArgs += "-t", $fullTag, "."

docker build @buildArgs

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Docker build failed"
    exit 1
}

Write-Host "✅ Image built: $fullTag" -ForegroundColor Green

# ── Optional push ────────────────────────────────────────────────────────────
if ($Push -and $Registry) {
    Write-Host "📤 Pushing to $Registry..." -ForegroundColor Cyan
    docker push $fullTag
    if ($LASTEXITCODE -ne 0) { Write-Error "❌ Push failed"; exit 1 }
    Write-Host "✅ Pushed: $fullTag" -ForegroundColor Green
}

Write-Host "`n🚀 Done! Run with:" -ForegroundColor Green
Write-Host "   docker run -d -p 3000:3000 $fullTag" -ForegroundColor White
```

#### Usage

```powershell
# Basic build
.\build.ps1

# Build with version tag
.\build.ps1 -Version "1.2.3"

# Build and push to Nexus Docker registry
.\build.ps1 -Version "1.2.3" -Registry "nexus.your-bank.internal:8081/repository/docker-hosted" -Push

# Skip Midwife scan (local dev only — NEVER in CI)
.\build.ps1 -SkipScan
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Set token (persistent) | `[System.Environment]::SetEnvironmentVariable("NEXUS_TOKEN","<value>","User")` |
| Check token is set | `echo $env:NEXUS_TOKEN` |
| Build (build-arg) | `docker build --build-arg NEXUS_TOKEN=$env:NEXUS_TOKEN ...` |
| Build (secret) | `docker build --secret id=nexus_token,env=NEXUS_TOKEN ...` |
| Verify token not in image | `docker history --no-trunc <image> \| Select-String "NEXUS"` |
| Rotate token | Re-run Part 1, update env var with new pass code |

---

## Security Notes

1. **Never** commit `.npmrc` with tokens to git — add `.npmrc` to `.gitignore`
2. **Never** use `--build-arg` for tokens in production pipelines — use BuildKit secrets
3. **Rotate** tokens every 90 days (or immediately if leaked)
4. In **Kubernetes/Jenkins**, inject tokens via Vault sidecar or K8s Secrets (not env vars baked into the pipeline YAML)
5. The Dockerfile's `rm -f .npmrc` in the same `RUN` layer ensures it never lands in a Docker layer even with `--build-arg`
