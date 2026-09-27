# OwnMind
#
# Built for blitz.cloud, but this is a plain portable image. It works anywhere
# that runs long lived containers with a writable volume, which is the only
# thing this app actually needs.
#
# Two rules this file must not break:
#   1. Node 24 or newer. node:sqlite is unflagged from Node 23.4, and
#      src/lib/db.ts imports it directly.
#   2. Nothing from .data gets baked in. That directory is the live database and
#      the uploaded photos, and it is mounted at runtime instead.

# syntax=docker/dockerfile:1


# --- dependencies ------------------------------------------------------------
# Kept separate so a source-only change does not reinstall the whole tree.
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci


# --- build -------------------------------------------------------------------
FROM node:24-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# serverExternalPackages keeps node:sqlite out of the bundle, so it is read
# from this Node at runtime rather than being compiled into .next.
RUN npm run build


# --- runtime -----------------------------------------------------------------
FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    OWNMIND_DATA_DIR=/app/.data

COPY --from=deps  --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next        ./.next
COPY --from=builder --chown=node:node /app/public       ./public
COPY --from=builder --chown=node:node /app/src          ./src
COPY --from=builder --chown=node:node /app/next.config.ts     ./next.config.ts
COPY --from=builder --chown=node:node /app/package.json       ./package.json

# Runs after every COPY, so nothing above can overwrite these. The app writes
# in exactly two places: the Next image cache under .next, and the database and
# uploaded photos under OWNMIND_DATA_DIR.
RUN mkdir -p /app/.next/cache /app/.data \
    && chown -R node:node /app

USER node

# blitz.cloud reads EXPOSE and routes to it, so this and PORT have to agree.
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "8080"]
