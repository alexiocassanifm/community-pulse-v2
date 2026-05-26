# Community Pulse

Monorepo for the Community Pulse application (Hono API + React SPA + MongoDB).

## Prerequisites

- Node.js `20.x` (see `.nvmrc`)
- pnpm `11.x` (enabled via `corepack enable`)
- Docker Desktop or Docker Engine with Compose v2

## Local Setup

```bash
# 1. Install workspace dependencies
pnpm install

# 2. Copy env template
cp .env.example .env

# 3. Start MongoDB (and the app container) via Docker Compose
docker compose up -d

# Optional: include the mongo-express GUI on http://localhost:8081
docker compose --profile tools up -d
```

## Workspaces

| Path                | Package name              | Purpose                                     |
| ------------------- | ------------------------- | ------------------------------------------- |
| `apps/api`          | `@community-pulse/api`    | Hono backend (Node.js)                      |
| `apps/web`          | `@community-pulse/web`    | React 18 SPA (Vite)                         |
| `packages/shared`   | `@community-pulse/shared` | Shared Zod schemas + TypeScript types       |

## Common Scripts

```bash
pnpm build       # Build all workspaces (shared first, then apps)
pnpm typecheck   # Run TypeScript across all workspaces
pnpm lint        # Run lint across all workspaces
pnpm dev         # Run all workspace dev scripts in parallel
```

## Environment Variables

See `.env.example` for the full list. Required: `MONGO_URI`, `JWT_SECRET`, `PORT`, `APP_ORIGIN`, `NODE_ENV`.
