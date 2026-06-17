# syntax=docker/dockerfile:1.7

# ---------- Builder stage ----------
# Installs all workspace dependencies, runs typecheck for `apps/api` and
# `packages/shared`. Build emit for the API bundle is configured in
# TASK-2026-0968 (Hono backend); at the scaffolding stage we ship the TS
# source plus `tsx` runtime and let `tsx` execute it directly.
FROM node:20-alpine AS builder
WORKDIR /repo

# Enable Corepack for pnpm
RUN corepack enable

# Copy workspace manifests first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

# Install ALL workspace deps (lockfile-aware)
RUN pnpm install --no-frozen-lockfile

# Copy source
COPY packages/shared packages/shared
COPY apps/api apps/api

# Verify typecheck passes for the two workspaces involved in the runtime image
RUN pnpm --filter @community-pulse/shared run typecheck \
 && pnpm --filter @community-pulse/api run typecheck

# ---------- Runtime stage ----------
FROM node:20-alpine AS runtime
WORKDIR /app

RUN corepack enable \
 && apk add --no-cache curl
ENV NODE_ENV=production

# Copy workspace metadata and source needed at runtime
COPY --from=builder /repo/package.json /repo/pnpm-lock.yaml /repo/pnpm-workspace.yaml /repo/tsconfig.base.json ./
COPY --from=builder /repo/packages/shared/package.json packages/shared/package.json
COPY --from=builder /repo/packages/shared/tsconfig.json packages/shared/tsconfig.json
COPY --from=builder /repo/packages/shared/src packages/shared/src
COPY --from=builder /repo/apps/api/package.json apps/api/package.json
COPY --from=builder /repo/apps/api/tsconfig.json apps/api/tsconfig.json
COPY --from=builder /repo/apps/api/src apps/api/src

# Install api workspace deps (incl. tsx and zod from shared)
RUN pnpm install --filter @community-pulse/api... --no-frozen-lockfile

# Drop privileges: run the container as the unprivileged `node` user that
# ships with the official node:20-alpine image (uid/gid 1000).
RUN chown -R node:node /app
USER node

EXPOSE 3000
# Execute the TypeScript entry directly via tsx. A compiled-bundle CMD
# is tracked under TASK-2026-0968.
CMD ["pnpm", "--filter", "@community-pulse/api", "run", "start"]
