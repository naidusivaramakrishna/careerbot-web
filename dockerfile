# ---- Stage 1: Build the Next.js app ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of your project files
COPY . .

# Build-time public config. NEXT_PUBLIC_* is INLINED into the JS at build time
# and is NOT read at runtime. v13/v14 shipped broken because a developer's local
# .env (NEXT_PUBLIC_BASE_URL=http://localhost:8000/api/v1) was copied in by
# `COPY . .` and inlined. Passing these as build args makes it explicit.
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_SERVER_URL
ARG NEXT_PUBLIC_FRONTEND_URL
ARG NEXT_PUBLIC_WS_HOST
ARG BACKEND_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_FRONTEND_URL=$NEXT_PUBLIC_FRONTEND_URL
ENV NEXT_PUBLIC_WS_HOST=$NEXT_PUBLIC_WS_HOST
ENV BACKEND_URL=$BACKEND_URL

# Escape hatch for local/experimental images only. Never set in a release build.
ARG ALLOW_LOCALHOST=0

# An omitted --build-arg is an EMPTY STRING, and the build still succeeds: every
# consumer then falls back to its own `|| 'http://localhost:8000'`. Forgetting
# one arg out of five silently reproduces v13/v14, so fail loudly instead.
# NEXT_PUBLIC_BASE_URL is either exactly /api/v1 or absolute:
#   /api/v1    - same-origin: API calls and the live-interview socket go to the
#                address the page is on. Required for college addresses
#                (vit.<domain>), whose sign-in cookies are sent only to that address.
#   http(s):// - fixed backend address (single-host deployments).
# Anything else is refused: buildWsUrl() would drop to the NEXT_PUBLIC_WS_HOST
# fallback and live interviews would break while login still works.
RUN if [ "$ALLOW_LOCALHOST" != "1" ]; then \
      for v in NEXT_PUBLIC_BASE_URL NEXT_PUBLIC_SERVER_URL NEXT_PUBLIC_FRONTEND_URL NEXT_PUBLIC_WS_HOST BACKEND_URL; do \
        eval "val=\$$v"; \
        [ -n "$val" ] || { echo "BUILD ARG MISSING: $v (pass --build-arg $v=...)"; exit 1; }; \
      done; \
      case "$NEXT_PUBLIC_BASE_URL" in \
        /api/v1|http://*|https://*) ;; \
        *) echo "NEXT_PUBLIC_BASE_URL must be /api/v1 or absolute (http:// or https://), got: $NEXT_PUBLIC_BASE_URL"; exit 1;; \
      esac; \
    fi

# Build the Next.js app
RUN npm run build

# GATE A, enforced at build time rather than left to CI or a human: the browser
# bundle and the rewrite manifest must contain no localhost. This is the check
# that would have stopped v13 AND v14 shipping. Scoped to .next/static plus
# routes-manifest.json on purpose — .next/server/**/route.js legitimately holds
# `process.env.BACKEND_URL || "http://localhost:8000"`, a runtime lookup whose
# fallback is never used, and .next/cache is never served.
RUN if [ "$ALLOW_LOCALHOST" != "1" ]; then \
      if grep -rl 'localhost:8000' .next/static 2>/dev/null | grep -q . ; then \
        echo "GATE A FAILED: localhost:8000 is baked into the browser bundle:"; \
        grep -rl 'localhost:8000' .next/static | head; exit 1; \
      fi; \
      if grep -q 'localhost:8000' .next/routes-manifest.json 2>/dev/null; then \
        echo "GATE A FAILED: localhost:8000 is baked into routes-manifest.json"; exit 1; \
      fi; \
      echo "GATE A passed: no localhost in .next/static or routes-manifest.json"; \
    fi

# ---- Stage 2: Run the production app ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Runtime-only build metadata for web_build_info{version,commit}
# (src/lib/observability/registry.ts). Set in the RUNNER stage only, so it is
# never inlined into .next/static. version comes from npm_package_version.
ARG GIT_COMMIT=unknown
ENV GIT_COMMIT=$GIT_COMMIT

# Copy only required files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Expose the app port (default for Next.js)
EXPOSE 3000

# Run Next.js in production mode
CMD ["npm", "run", "start"]
