#!/usr/bin/env bash
# =============================================================================
# LOCAL BUILD, SMOKE TEST & NEXUS PUSH
# Enterprise Banking Node.js Application
# =============================================================================
#
# USAGE
#   ./build.sh [VERSION]
#
# REQUIRED ENV VARS (for build + push)
#   NEXUS_REGISTRY          Hostname + port of your Nexus Docker registry
#                           e.g. nexus.your-bank.internal:5000
#   NEXUS_TOKEN             Nexus npm registry auth token (used by npm ci inside
#                           the Dockerfile to pull private packages)
#   NEXUS_TOKEN_NAME        Nexus user-token name  (Nexus UI → profile → User Token)
#   NEXUS_TOKEN_PASSPHRASE  Nexus user-token passphrase (docker login / image push)
#
# MIDWIFE / PRISMA (TWISTLOCK) ENV VARS
#   MIDWIFE_CONSOLE_URL     Prisma Cloud console URL
#                           e.g. https://prismacloud.your-bank.internal
#   MIDWIFE_ACCESS_KEY      Prisma Cloud access key
#   MIDWIFE_SECRET_KEY      Prisma Cloud secret key
#
# OPTIONAL ENV VARS
#   NEXUS_NPM_REGISTRY      Nexus npm proxy URL (default: nexus.your-bank.internal:8081/repository/npm-proxy)
#   NEXUS_REPO              Nexus hosted repo name  (default: docker-hosted)
#   SKIP_MIDWIFE_SCAN       Set to "true" to bypass Midwife scan (local dev only)
#   SKIP_PUSH               Set to "true" to build + test only (no registry push)
#   SKIP_SMOKE              Set to "true" to skip the local smoke test
#
# QUICK LOCAL TEST (no push, no scan)
#   SKIP_PUSH=true SKIP_MIDWIFE_SCAN=true ./build.sh
#
# FULL BUILD + SCAN + PUSH
#   NEXUS_REGISTRY=nexus.your-bank.internal:5000 \
#   NEXUS_TOKEN_NAME=<token-name> \
#   NEXUS_TOKEN_PASSPHRASE=<token-passphrase> \
#   MIDWIFE_CONSOLE_URL=https://prismacloud.your-bank.internal \
#   MIDWIFE_ACCESS_KEY=<access-key> \
#   MIDWIFE_SECRET_KEY=<secret-key> \
#   ./build.sh 1.4.2
# =============================================================================

set -euo pipefail

# ─── Colour helpers ───────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC}    $*"; }
section() { echo -e "\n${CYAN}━━━ $* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}    $*"; }
error()   { echo -e "${RED}[ERROR]${NC}   $*" >&2; exit 1; }

# ─── Pre-flight checks ────────────────────────────────────────────────────────
section "Pre-flight"
command -v docker >/dev/null 2>&1 || error "Docker not found. Install Docker Desktop and retry."
docker info >/dev/null 2>&1       || error "Docker daemon is not running."
info "Docker $(docker --version | awk '{print $3}' | tr -d ',')"

# ─── Configuration ────────────────────────────────────────────────────────────
NEXUS_REGISTRY="${NEXUS_REGISTRY:-nexus.your-bank.internal:5000}"
NEXUS_REPO="${NEXUS_REPO:-docker-hosted}"
NEXUS_TOKEN="${NEXUS_TOKEN:-}"
NEXUS_NPM_REGISTRY="${NEXUS_NPM_REGISTRY:-nexus.your-bank.internal:8081/repository/npm-proxy}"
APP_NAME="banking-nodejs-app"

VERSION="${1:-$(git describe --tags --always --dirty 2>/dev/null || echo 'dev')}"
GIT_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
GIT_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"

IMAGE_BASE="${NEXUS_REGISTRY}/${NEXUS_REPO}/${APP_NAME}"
IMAGE_TAG="${IMAGE_BASE}:${VERSION}"
IMAGE_LATEST="${IMAGE_BASE}:latest"

SKIP_PUSH="${SKIP_PUSH:-false}"
SKIP_SMOKE="${SKIP_SMOKE:-false}"
SKIP_MIDWIFE_SCAN="${SKIP_MIDWIFE_SCAN:-false}"

MIDWIFE_CONSOLE_URL="${MIDWIFE_CONSOLE_URL:-}"
MIDWIFE_ACCESS_KEY="${MIDWIFE_ACCESS_KEY:-}"
MIDWIFE_SECRET_KEY="${MIDWIFE_SECRET_KEY:-}"

info "App          : ${APP_NAME}"
info "Version      : ${VERSION}"
info "Git branch   : ${GIT_BRANCH}"
info "Git commit   : ${GIT_COMMIT}"
info "Build date   : ${BUILD_DATE}"
info "Nexus image  : ${IMAGE_TAG}"

# ─── Build ────────────────────────────────────────────────────────────────────
section "Docker Build (includes test stage + Midwife code-repo scan stage)"

[[ -z "${NEXUS_TOKEN}" ]] && error "NEXUS_TOKEN is not set. Required for 'npm ci' inside the Dockerfile to authenticate with the Nexus npm registry."

# Midwife credentials are mounted as BuildKit secrets — they never appear in
# image layers, the build cache, or 'docker history' output.
MIDWIFE_SECRET_FLAGS=()
if [[ "${SKIP_MIDWIFE_SCAN}" != "true" ]]; then
  [[ -z "${MIDWIFE_CONSOLE_URL}" ]] && error "MIDWIFE_CONSOLE_URL is required for the Dockerfile security-scan stage."
  [[ -z "${MIDWIFE_ACCESS_KEY}" ]]  && error "MIDWIFE_ACCESS_KEY is required for the Dockerfile security-scan stage."
  [[ -z "${MIDWIFE_SECRET_KEY}" ]]  && error "MIDWIFE_SECRET_KEY is required for the Dockerfile security-scan stage."
  MIDWIFE_SECRET_FLAGS=(
    --secret "id=midwife_access_key,env=MIDWIFE_ACCESS_KEY"
    --secret "id=midwife_secret_key,env=MIDWIFE_SECRET_KEY"
  )
fi

docker build \
  --build-arg BUILD_VERSION="${VERSION}" \
  --build-arg GIT_COMMIT="${GIT_COMMIT}" \
  --build-arg BUILD_DATE="${BUILD_DATE}" \
  --build-arg NEXUS_TOKEN="${NEXUS_TOKEN}" \
  --build-arg NEXUS_NPM_REGISTRY="${NEXUS_NPM_REGISTRY}" \
  --build-arg MIDWIFE_CONSOLE_URL="${MIDWIFE_CONSOLE_URL}" \
  --build-arg SKIP_MIDWIFE_SCAN="${SKIP_MIDWIFE_SCAN}" \
  "${MIDWIFE_SECRET_FLAGS[@]}" \
  --tag "${IMAGE_TAG}" \
  --tag "${IMAGE_LATEST}" \
  --progress=plain \
  .

info "Build complete: ${IMAGE_TAG}"
info "Image size: $(docker image inspect "${IMAGE_TAG}" --format '{{.Size}}' | awk '{printf "%.1f MB", $1/1024/1024}')"

# ─── Midwife IMAGE scan (post-build) ─────────────────────────────────────────
# This scans the BUILT IMAGE for OS + runtime package vulnerabilities.
# Complements the Dockerfile Stage 4 code-repo scan (source/deps scanned
# during docker build). Together they form a two-layer security gate:
#   Layer 1 — Dockerfile Stage 4 : code-repo scan  (runs inside docker build)
#   Layer 2 — here               : image scan       (runs after docker build)
# A HIGH/CRITICAL finding in either layer hard-blocks the push to Nexus.
section "Midwife Image Scan"
if [[ "${SKIP_MIDWIFE_SCAN}" == "true" ]]; then
  warn "SKIP_MIDWIFE_SCAN=true — scan bypassed. NEVER skip in non-local environments."
else
  command -v midwife >/dev/null 2>&1 \
    || error "midwife not found in PATH. Install Midwife CLI or set SKIP_MIDWIFE_SCAN=true for local dev."

  [[ -z "${MIDWIFE_CONSOLE_URL}" ]] && error "MIDWIFE_CONSOLE_URL is not set."
  [[ -z "${MIDWIFE_ACCESS_KEY}" ]]  && error "MIDWIFE_ACCESS_KEY is not set."
  [[ -z "${MIDWIFE_SECRET_KEY}" ]]  && error "MIDWIFE_SECRET_KEY is not set."

  info "Scanning ${IMAGE_TAG} against ${MIDWIFE_CONSOLE_URL}..."
  midwife scan \
    --address  "${MIDWIFE_CONSOLE_URL}" \
    --user     "${MIDWIFE_ACCESS_KEY}" \
    --password "${MIDWIFE_SECRET_KEY}" \
    --details \
    --fail-on  HIGH \
    "${IMAGE_TAG}" \
    || error "Midwife scan FAILED — HIGH/CRITICAL CVEs detected. Remediate before pushing to Nexus."

  info "Midwife scan passed — no HIGH/CRITICAL CVEs."
fi

# ─── Local smoke test ─────────────────────────────────────────────────────────
if [[ "${SKIP_SMOKE}" == "false" ]]; then
  section "Local Smoke Test"

  CONTAINER_ID=$(docker run \
    --detach \
    --rm \
    --publish 3000:3000 \
    --env VAULT_ADDR="${VAULT_ADDR:-}" \
    --env VAULT_ROLE="${VAULT_ROLE:-}" \
    --read-only \
    --tmpfs /tmp \
    --security-opt no-new-privileges \
    "${IMAGE_TAG}"
  )
  info "Container ${CONTAINER_ID:0:12} started — waiting 5 s for startup..."

  cleanup() { docker stop "${CONTAINER_ID}" >/dev/null 2>&1 || true; }
  trap cleanup EXIT

  sleep 5

  HTTP_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null || echo "000")
  if [[ "${HTTP_STATUS}" == "200" ]]; then
    info "Health check passed (HTTP 200)."
  else
    warn "Health endpoint returned HTTP ${HTTP_STATUS}."
    warn "Ensure GET /health is implemented and returns 200."
  fi

  docker stop "${CONTAINER_ID}" >/dev/null 2>&1 || true
  trap - EXIT
  info "Smoke test complete."
fi

# ─── Push to Nexus ────────────────────────────────────────────────────────────
if [[ "${SKIP_PUSH}" == "true" ]]; then
  info "SKIP_PUSH=true — skipping registry push."
  exit 0
fi

section "Push to Nexus"
[[ -z "${NEXUS_TOKEN_NAME:-}" ]]        && error "NEXUS_TOKEN_NAME is not set. Generate a user token in Nexus UI → Profile → User Token."
[[ -z "${NEXUS_TOKEN_PASSPHRASE:-}" ]]  && error "NEXUS_TOKEN_PASSPHRASE is not set."

info "Authenticating with Nexus (${NEXUS_REGISTRY}) via user token..."
echo "${NEXUS_TOKEN_PASSPHRASE}" | docker login "${NEXUS_REGISTRY}" \
  --username "${NEXUS_TOKEN_NAME}" \
  --password-stdin

info "Pushing ${IMAGE_TAG}..."
docker push "${IMAGE_TAG}"

info "Pushing ${IMAGE_LATEST}..."
docker push "${IMAGE_LATEST}"

docker logout "${NEXUS_REGISTRY}" >/dev/null 2>&1 || true

section "Complete"
info "Image successfully pushed to Nexus:"
info "  ${IMAGE_TAG}"
info "  ${IMAGE_LATEST}"
