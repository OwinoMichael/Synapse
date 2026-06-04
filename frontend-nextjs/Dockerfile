# =============================================================================
# Synapse Frontend — Multi-stage Dockerfile
# =============================================================================

# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args injected at build time for prod env vars
ARG NEXT_PUBLIC_SPRING_WS_URL
ARG NEXT_PUBLIC_API_BASE_URL

ENV NEXT_PUBLIC_SPRING_WS_URL=$NEXT_PUBLIC_SPRING_WS_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# Next.js needs this for basePath to work correctly
ENV NEXT_TELEMETRY_DISABLED=1

ENV NEXT_DISABLE_SOURCEMAPS=1
ENV NODE_OPTIONS="--max-old-space-size=2048"

RUN npm run build

# ── Stage 3: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user
RUN addgroup -S synapse && adduser -S synapse -G synapse

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN chown -R synapse:synapse /app
USER synapse

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]