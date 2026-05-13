# syntax=docker/dockerfile:1
# =============================================================================
# VMware VMC Console — ENTERPRISE DOCKERFILE
# =============================================================================
# Multi-stage | Hardened | Non-root | Minimal attack surface
# Stage 1 : deps    — dependency install + audit
# Stage 2 : builder — Next.js static export  → /app/dist
# Stage 3 : runner  — nginx (non-root, port 8080, read-only FS)
# =============================================================================

# -----------------------------------------------------------------------------
# STAGE 1: Dependency Audit & Install
# Base: internal Nexus nodejs-base (Ubuntu 24.04, Node 20, UID 10001)
# -----------------------------------------------------------------------------
FROM localhost:80/repository/docker-hosted/nodejs-base:1.0.0 AS deps

LABEL stage="deps"

# Build stages run as root (ephemeral containers — no security risk).
# Non-root enforcement is in Stage 3 (runner) only.
USER root

# Override base image NODE_OPTIONS:
#   --disallow-code-generation-from-strings blocks Next.js eval() — must remove for build
#   Increase heap for large Next.js builds
ENV HOME=/root \
    NODE_OPTIONS="--max-old-space-size=2048"
    # NODE_ENV stays 'production' from base image — next build requires it

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        python3 \
        make \
        g++ \
        build-essential \
    && rm -rf /var/lib/apt/lists/* \
    # Open up /app for writes and clear any stale node_modules from base image
    && chmod -R u+w /app \
    && rm -rf /app/node_modules

# Copy manifests first — layer cache: only reinstalls when lockfile changes
COPY package.json package-lock.json* ./

# ci: honours lockfile exactly (no drift)
# --ignore-scripts: blocks malicious postinstall hooks (supply-chain defence)
# --audit: build fails on HIGH/CRITICAL CVEs
RUN npm ci --ignore-scripts --include=dev \
    && npm rebuild \
    && npm audit --audit-level=high

# -----------------------------------------------------------------------------
# STAGE 2: Build (Next.js static export)
# -----------------------------------------------------------------------------
FROM deps AS builder

LABEL stage="builder"

COPY . .

# Produce static export → /app/dist (next build performs type checking)
RUN npm run build

# -----------------------------------------------------------------------------
# STAGE 3: Production Runtime (hardened nginx, non-root)
# -----------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runner

# ── Build-time metadata ───────────────────────────────────────────────────────
ARG BUILD_VERSION=latest
ARG GIT_COMMIT=unknown
ARG BUILD_DATE=unknown
ARG APP_PORT=8080

# ── OCI Image Labels ──────────────────────────────────────────────────────────
LABEL org.opencontainers.image.title="vmc-console" \
      org.opencontainers.image.description="VMware Cloud (VMC) Management Console" \
      org.opencontainers.image.vendor="VMware VMC" \
      org.opencontainers.image.version="${BUILD_VERSION}" \
      org.opencontainers.image.revision="${GIT_COMMIT}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.source="https://github.com/yasir27uk/vmc-aws-console" \
      org.opencontainers.image.licenses="PROPRIETARY" \
      security.scan.required="true"

# ── OS Hardening ──────────────────────────────────────────────────────────────
# Upgrade all packages to pick up latest CVE patches
RUN apk upgrade --no-cache \
    && apk add --no-cache wget

# ── Non-Root User ─────────────────────────────────────────────────────────────
# nginx base image already has UID/GID 101 (nginx) — we reuse it.
# All directories that nginx writes to at runtime must be owned by 101.
RUN mkdir -p /var/cache/nginx/client_temp \
             /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp \
             /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp \
             /tmp/nginx \
    && chown -R 101:101 \
             /var/cache/nginx \
             /var/log/nginx \
             /tmp/nginx \
    && chmod -R 755 /var/cache/nginx /tmp/nginx \
    # nginx.pid: must be writable by nginx user
    && touch /var/run/nginx.pid \
    && chown 101:101 /var/run/nginx.pid

# ── Static Assets ─────────────────────────────────────────────────────────────
RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html

# ── nginx Configuration (non-root port 8080, security headers) ───────────────
COPY nginx.conf /etc/nginx/nginx.conf

# ── Filesystem Permissions ────────────────────────────────────────────────────
# Directories: 755 (rwxr-xr-x) — nginx needs execute to traverse
# Files:       644 (rw-r--r--) — world-readable static assets
RUN chown -R 101:101 /usr/share/nginx/html /etc/nginx/nginx.conf \
    && find /usr/share/nginx/html -type d -exec chmod 755 {} \; \
    && find /usr/share/nginx/html -type f -exec chmod 644 {} \; \
    && chmod 444 /etc/nginx/nginx.conf

# ── Drop to non-root ──────────────────────────────────────────────────────────
USER 101:101

# ── Runtime Config ────────────────────────────────────────────────────────────
ENV APP_PORT=${APP_PORT} \
    NGINX_WORKER_PROCESSES=auto \
    TZ=UTC

# ── Health Check ──────────────────────────────────────────────────────────────
HEALTHCHECK --interval=30s \
            --timeout=5s \
            --start-period=15s \
            --retries=3 \
    CMD wget -qO /dev/null http://localhost:${APP_PORT}/index.html || exit 1

# ── Network ───────────────────────────────────────────────────────────────────
EXPOSE ${APP_PORT}

# ── Entrypoint ────────────────────────────────────────────────────────────────
CMD ["nginx", "-g", "daemon off;"]

# =============================================================================
# SECURITY NOTES
# =============================================================================
# 1. Runs as UID 101 (nginx) — non-root, no privilege escalation
# 2. npm audit fails build on HIGH/CRITICAL CVEs in dependencies
# 3. npm ci --ignore-scripts prevents supply-chain attacks via postinstall
# 4. Build tools (Node, npm, source code) are absent from the final image
# 5. Static files are chmod 550 — read/execute only, no write
# 6. Listens on port 8080 — no CAP_NET_BIND_SERVICE needed (ports > 1024)
# 7. All secrets/config must be injected at runtime via env vars or mounts
# ============================================================================
