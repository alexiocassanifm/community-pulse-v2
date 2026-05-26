# Work Package: Backend Software Engineer (Echo) — Setup pnpm Monorepo Workspace

**Task ID**: TASK-2026-0966
**User Story**: US-2026-0589
**Date Created**: 2026-05-26
**Created By**: Atlas (Tech Lead)
**Skill(s) to Load**: `backend-nextjs` (general Node/TypeScript/Docker tooling expertise; this task is infrastructure scaffolding, not feature implementation in Next.js)

## Task Overview

Initialize the Community Pulse pnpm monorepo skeleton with three workspaces (`apps/api`, `apps/web`, `packages/shared`), shared TypeScript path aliases, and a Docker Compose stack for local development. This is the foundational task that unblocks every other story in Sprint 1 — Foundation. **No business logic** is expected; only scaffolding, configuration, and verification.

## Environment Targets (decided by Atlas)

- **Node**: 20 LTS (Iron). Pin in `.nvmrc` as `20` and in each `package.json` via `engines.node` `>=20.10.0`.
- **pnpm**: `11.2.2` (matches developer local). Pin in root `package.json` via `packageManager: "pnpm@11.2.2"`.
- **TypeScript**: `5.6.x` stable.
- **Docker images**: `mongo:7`, `node:20-alpine` for the `app` service base, `mongo-express:1.0.2`.

## Execution Plan (Step-by-Step)

### Step 1 — Root files

Create at the repo root `/Users/alexiocassani/Trainings/community-pulse-v2/`:

1. **`pnpm-workspace.yaml`**:
   ```yaml
   packages:
     - 'apps/*'
     - 'packages/*'
   ```

2. **`.nvmrc`**: single line `20`

3. **`.gitignore`** (append/create with):
   ```
   node_modules/
   dist/
   build/
   .env
   .env.local
   .env.*.local
   *.log
   .DS_Store
   coverage/
   .turbo/
   .vite/
   .pnpm-store/
   ```

4. **`.env.example`** (root) — document ALL required env vars:
   ```
   # MongoDB connection string used by the Hono API
   MONGO_URI=mongodb://mongodb:27017/community_pulse

   # Secret used to sign JWT access tokens (must be at least 32 chars in prod)
   JWT_SECRET=replace-me-with-a-long-random-string

   # Port the Hono API listens on inside the app container
   PORT=3000

   # Public origin of the deployed app (used for CORS, cookies, redirects)
   APP_ORIGIN=http://localhost:3000

   # Node environment: development | production | test
   NODE_ENV=development
   ```

5. **`tsconfig.base.json`** (root):
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "module": "ESNext",
       "moduleResolution": "Bundler",
       "lib": ["ES2022"],
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "noImplicitOverride": true,
       "noFallthroughCasesInSwitch": true,
       "exactOptionalPropertyTypes": false,
       "esModuleInterop": true,
       "allowSyntheticDefaultImports": true,
       "resolveJsonModule": true,
       "isolatedModules": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true,
       "declaration": true,
       "declarationMap": true,
       "sourceMap": true,
       "baseUrl": ".",
       "paths": {
         "@community-pulse/shared": ["packages/shared/src/index.ts"],
         "@community-pulse/shared/*": ["packages/shared/src/*"]
       }
     },
     "exclude": ["node_modules", "dist", "build"]
   }
   ```

6. **Root `package.json`**:
   ```json
   {
     "name": "community-pulse",
     "version": "0.1.0",
     "private": true,
     "packageManager": "pnpm@11.2.2",
     "engines": {
       "node": ">=20.10.0"
     },
     "scripts": {
       "build": "pnpm -r --filter \"./packages/**\" run build && pnpm -r --filter \"./apps/**\" run build",
       "dev": "pnpm -r --parallel run dev",
       "lint": "pnpm -r run lint",
       "typecheck": "pnpm -r run typecheck",
       "clean": "pnpm -r exec rm -rf dist build .turbo && rm -rf node_modules"
     },
     "devDependencies": {
       "typescript": "^5.6.3"
     }
   }
   ```

   Note: The build script first builds `packages/*` (so `packages/shared` produces its `dist/` consumed by apps), then `apps/*`.

### Step 2 — `packages/shared`

1. **`packages/shared/package.json`**:
   ```json
   {
     "name": "@community-pulse/shared",
     "version": "0.1.0",
     "private": true,
     "type": "module",
     "main": "./src/index.ts",
     "types": "./src/index.ts",
     "exports": {
       ".": {
         "types": "./src/index.ts",
         "import": "./src/index.ts",
         "default": "./src/index.ts"
       }
     },
     "scripts": {
       "build": "tsc -p tsconfig.json",
       "typecheck": "tsc -p tsconfig.json --noEmit",
       "lint": "echo \"(lint not configured yet)\" && exit 0",
       "dev": "tsc -p tsconfig.json --watch"
     },
     "devDependencies": {
       "typescript": "^5.6.3"
     }
   }
   ```

   Rationale for `exports` pointing to `./src/index.ts` (TS source rather than compiled `dist`):
   - apps will consume the workspace via TypeScript path mappings + Vite alias (project-references-free, simple)
   - avoids a build-order trap during early scaffolding
   - downstream stories can introduce a compiled `dist/` artifact when publishing becomes a concern

2. **`packages/shared/tsconfig.json`**:
   ```json
   {
     "extends": "../../tsconfig.base.json",
     "compilerOptions": {
       "outDir": "./dist",
       "rootDir": "./src",
       "composite": false,
       "lib": ["ES2022"],
       "types": []
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist"]
   }
   ```

3. **`packages/shared/src/index.ts`** (placeholder barrel — keep minimal so the build verifies the path alias works):
   ```ts
   // Placeholder barrel export. Real Zod schemas land in US-2026-0590 / TASK-2026-0967.
   export const SHARED_PACKAGE_NAME = '@community-pulse/shared' as const;

   export type WorkspaceMarker = typeof SHARED_PACKAGE_NAME;
   ```

### Step 3 — `apps/api`

1. **`apps/api/package.json`**:
   ```json
   {
     "name": "@community-pulse/api",
     "version": "0.1.0",
     "private": true,
     "type": "module",
     "main": "./dist/index.js",
     "scripts": {
       "build": "tsc -p tsconfig.json",
       "typecheck": "tsc -p tsconfig.json --noEmit",
       "lint": "echo \"(lint not configured yet)\" && exit 0",
       "dev": "tsx watch src/index.ts",
       "start": "node dist/index.js"
     },
     "dependencies": {
       "@community-pulse/shared": "workspace:*"
     },
     "devDependencies": {
       "@types/node": "^20.14.10",
       "tsx": "^4.19.2",
       "typescript": "^5.6.3"
     }
   }
   ```

   Note: Hono, Mongoose, JWT libs, etc. land in later tasks. Keep this minimal.

2. **`apps/api/tsconfig.json`**:
   ```json
   {
     "extends": "../../tsconfig.base.json",
     "compilerOptions": {
       "outDir": "./dist",
       "rootDir": "./src",
       "module": "ESNext",
       "moduleResolution": "Bundler",
       "target": "ES2022",
       "lib": ["ES2022"],
       "types": ["node"],
       "baseUrl": ".",
       "paths": {
         "@community-pulse/shared": ["../../packages/shared/src/index.ts"],
         "@community-pulse/shared/*": ["../../packages/shared/src/*"]
       }
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist"]
   }
   ```

3. **`apps/api/src/index.ts`** (smoke import to validate cross-workspace resolution):
   ```ts
   import { SHARED_PACKAGE_NAME } from '@community-pulse/shared';

   // Placeholder entrypoint. The real Hono app lands in TASK-2026-0968.
   function main(): void {
     // eslint-disable-next-line no-console
     console.log(`[api] bootstrapping with shared package: ${SHARED_PACKAGE_NAME}`);
   }

   main();
   ```

4. **`apps/api/Dockerfile`** (multi-stage; consumed by docker-compose `app` service):
   ```dockerfile
   # syntax=docker/dockerfile:1.7

   # ---------- Builder stage ----------
   FROM node:20-alpine AS builder
   WORKDIR /repo

   # Enable Corepack for pnpm
   RUN corepack enable

   # Copy workspace manifests first for better layer caching
   COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml tsconfig.base.json ./
   COPY packages/shared/package.json packages/shared/
   COPY apps/api/package.json apps/api/
   COPY apps/web/package.json apps/web/

   # Install ALL workspace deps (lockfile-aware)
   RUN pnpm install --frozen-lockfile=false

   # Copy source
   COPY packages/shared packages/shared
   COPY apps/api apps/api

   # Build shared first, then api
   RUN pnpm --filter @community-pulse/shared run build \
    && pnpm --filter @community-pulse/api run build

   # ---------- Runtime stage ----------
   FROM node:20-alpine AS runtime
   WORKDIR /app

   RUN corepack enable
   ENV NODE_ENV=production

   COPY --from=builder /repo/package.json /repo/pnpm-lock.yaml* /repo/pnpm-workspace.yaml ./
   COPY --from=builder /repo/packages/shared/package.json packages/shared/package.json
   COPY --from=builder /repo/packages/shared/dist packages/shared/dist
   COPY --from=builder /repo/apps/api/package.json apps/api/package.json
   COPY --from=builder /repo/apps/api/dist apps/api/dist

   # Install only production deps for the api workspace
   RUN pnpm install --prod --filter @community-pulse/api... --frozen-lockfile=false

   EXPOSE 3000
   CMD ["node", "apps/api/dist/index.js"]
   ```

### Step 4 — `apps/web`

1. **`apps/web/package.json`**:
   ```json
   {
     "name": "@community-pulse/web",
     "version": "0.1.0",
     "private": true,
     "type": "module",
     "scripts": {
       "build": "tsc -p tsconfig.json --noEmit",
       "typecheck": "tsc -p tsconfig.json --noEmit",
       "lint": "echo \"(lint not configured yet)\" && exit 0",
       "dev": "echo \"(Vite dev server lands in TASK-2026-0969)\" && exit 0"
     },
     "dependencies": {
       "@community-pulse/shared": "workspace:*"
     },
     "devDependencies": {
       "typescript": "^5.6.3"
     }
   }
   ```

   Note: Vite, React 18, React Router land in TASK-2026-0969. For this scaffolding task, `web` only verifies that TypeScript can resolve the shared import. The `build` script intentionally uses `tsc --noEmit` because there is no bundler yet.

2. **`apps/web/tsconfig.json`**:
   ```json
   {
     "extends": "../../tsconfig.base.json",
     "compilerOptions": {
       "module": "ESNext",
       "moduleResolution": "Bundler",
       "target": "ES2022",
       "lib": ["ES2022", "DOM", "DOM.Iterable"],
       "jsx": "react-jsx",
       "noEmit": true,
       "types": [],
       "baseUrl": ".",
       "paths": {
         "@community-pulse/shared": ["../../packages/shared/src/index.ts"],
         "@community-pulse/shared/*": ["../../packages/shared/src/*"]
       }
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist"]
   }
   ```

3. **`apps/web/src/main.tsx`** (smoke import; no React render yet — JSX still parses with `jsx: react-jsx`):
   ```ts
   import { SHARED_PACKAGE_NAME } from '@community-pulse/shared';

   // Placeholder entrypoint. The real Vite + React 18 SPA lands in TASK-2026-0969.
   // eslint-disable-next-line no-console
   console.log(`[web] bootstrapping with shared package: ${SHARED_PACKAGE_NAME}`);
   ```

### Step 5 — `docker-compose.yml` (repo root)

```yaml
services:
  mongodb:
    image: mongo:7
    container_name: community-pulse-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.runCommand({ ping: 1 }).ok"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s

  app:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    container_name: community-pulse-app
    restart: unless-stopped
    depends_on:
      mongodb:
        condition: service_healthy
    environment:
      MONGO_URI: ${MONGO_URI:-mongodb://mongodb:27017/community_pulse}
      JWT_SECRET: ${JWT_SECRET:-dev-secret-change-me}
      PORT: ${PORT:-3000}
      APP_ORIGIN: ${APP_ORIGIN:-http://localhost:3000}
      NODE_ENV: ${NODE_ENV:-development}
    ports:
      - "3000:3000"

  mongo-express:
    image: mongo-express:1.0.2
    container_name: community-pulse-mongo-express
    restart: unless-stopped
    depends_on:
      mongodb:
        condition: service_healthy
    environment:
      ME_CONFIG_MONGODB_SERVER: mongodb
      ME_CONFIG_MONGODB_PORT: 27017
      ME_CONFIG_BASICAUTH: "false"
    ports:
      - "8081:8081"
    profiles:
      - tools

volumes:
  mongo_data:
    name: community_pulse_mongo_data
```

Rationale:
- `mongo-express` is under the `tools` profile so `docker compose up` does NOT pull it by default — developers opt-in via `docker compose --profile tools up`.
- `app` depends on the MongoDB healthcheck passing.
- Env vars all default to dev-safe values when `.env` is missing, while still being overridable.

### Step 6 — `README.md` update

Replace the current 1-line `README.md` with a setup section. Keep it tight:

```markdown
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
```

### Step 7 — Verification

Run these in order from the repo root and capture results in your journal:

```bash
pnpm install                        # MUST succeed
pnpm -r run typecheck               # MUST pass for all three workspaces
pnpm build                          # MUST produce packages/shared/dist + apps/api/dist
docker compose config               # MUST validate without error
```

If any step fails, fix and re-run before flagging completion.

## Architectural Constraints

- Cross-workspace imports MUST go through the `@community-pulse/shared` alias — no relative `../../packages/shared` imports from `apps/*`.
- `packages/shared` is the ONLY place to declare shared Zod schemas and TS types (enforced by convention now; enforced by TypeScript when subsequent tasks add real schemas).
- The Docker `app` image must build successfully even before any Hono routes exist (this task uses a placeholder `console.log` entrypoint).

## Dependencies

- **Prerequisite tasks**: none — this is the foundation task.
- **External**: Docker Engine with Compose v2 plugin installed locally.
- **Enables**: TASK-2026-0967 (shared schemas), TASK-2026-0968 (Hono API), TASK-2026-0969 (Vite + React SPA), TASK-2026-0970 (Mongoose), TASK-2026-0971 (CI).

## Acceptance Criteria (Validation Contract)

Mapped 1:1 to FairMind task:

1. [ ] `pnpm-workspace.yaml` exists at repo root and declares `apps/*` and `packages/*`
2. [ ] Root `tsconfig.base.json` defines the `@community-pulse/shared` path alias pointing to `packages/shared/src`
3. [ ] All three workspaces have `package.json` and `tsconfig.json` extending the base config
4. [ ] `pnpm install` completes without hoisting errors or version conflicts
5. [ ] `pnpm -r run build` compiles all three workspaces with zero TypeScript errors
6. [ ] Test import of `@community-pulse/shared` in both `apps/api/src/index.ts` and `apps/web/src/main.tsx` resolves correctly during `pnpm typecheck`
7. [ ] `docker-compose.yml` includes `mongodb` (mongo:7), `app`, and `mongo-express` (under `tools` profile) services
8. [ ] `docker compose config` validates the file; data persists via named volume `community_pulse_mongo_data`
9. [ ] `.env.example` documents `MONGO_URI`, `JWT_SECRET`, `PORT`, `APP_ORIGIN`, `NODE_ENV`
10. [ ] `README.md` contains working local setup instructions

## Expected Deliverables

All files listed under "Files to Create/Modify" in the requirements task, plus a completion flag at:
`.fairmind/community-pulse/sprint-1-foundation/work_packages/backend/TASK-2026-0966_backend_complete.flag`

## Journal Requirements

Maintain a journal at: `.fairmind/community-pulse/sprint-1-foundation/journals/TASK-2026-0966_echo_journal.md`

Required sections:
- **Summary** (1 paragraph)
- **Work Log** (timestamped entries, 3+ sentences each)
- **Technical Decisions** (problem, options considered, chosen approach, reasoning)
- **Testing** (commands run + outputs/exit codes for the four verification commands)
- **Integration Points** (every file touched + why)
- **Outcome** (acceptance-criteria checklist)
