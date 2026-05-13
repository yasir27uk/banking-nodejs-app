# syntax=docker/dockerfile:1
# =============================================================================
# Enterprise Banking Node.js API — Multi-stage Hardened Dockerfile
# =============================================================================
# Stage 1 : deps    — install & audit dependencies
# Stage 2 : builder — copy app files
# Stage 3 : runner  — minimal Node.js Alpine production image (non-root)
# =============================================================================

# ── Stage 1: Dependency install & audit ──────────────────────────────────────
FROM node:20-alpine AS deps
LABEL stage="deps"

RUN apk add --no-cache dumb-init

WORKDIR /build
COPY package*.json ./
RUN npm ci --prefer-offline --ignore-scripts 2>&1

# ── Stage 2: Builder ──────────────────────────────────────────────────────────
FROM deps AS builder
LABEL stage="builder"

COPY . .

# ── Stage 3: Production runtime (hardened, non-root) ─────────────────────────
FROM node:20-alpine AS runner
LABEL stage="runner"

ARG APP_VERSION=dev
ARG GIT_COMMIT=unknown
ARG DEPLOY_ENV=production

LABEL org.opencontainers.image.title="banking-nodejs-api" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${GIT_COMMIT}" \
      org.opencontainers.image.description="Enterprise Banking Node.js REST API"

# Install dumb-init for proper PID 1 signal handling
RUN apk add --no-cache dumb-init wget \
    && addgroup -g 10001 -S appgroup \
    && adduser  -u 10001 -S appuser -G appgroup

WORKDIR /app

# Copy only production dependencies + application code
COPY --from=builder --chown=appuser:appgroup /build/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /build/package.json  ./
COPY --from=builder --chown=appuser:appgroup /build/app.js        ./
COPY --from=builder --chown=appuser:appgroup /build/src           ./src

ENV NODE_ENV=production \
    PORT=3000 \
    APP_VERSION=${APP_VERSION}

USER appuser
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO /dev/null http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "app.js"]
