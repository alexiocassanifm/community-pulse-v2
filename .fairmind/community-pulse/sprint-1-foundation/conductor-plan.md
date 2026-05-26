# Conductor Plan: US-2026-0589 / TASK-2026-0966

## Overview

Initialize the Community Pulse pnpm monorepo skeleton — three workspaces (`apps/api`, `apps/web`, `packages/shared`), root TypeScript path aliases, and a Docker Compose stack with MongoDB. This is the prerequisite task for every other story in Sprint 1.

## Involved Agents

| Agent                       | Skill                | Responsibility                                                                 |
| --------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| Echo (Software Engineer)    | `backend-nextjs`     | Scaffold all configuration files, Dockerfile, docker-compose, root tooling.    |

Note: this task is pure infrastructure scaffolding. No frontend rendering, no AI, no QA test execution (validated by build + typecheck + docker compose config). Tess and Shield are not engaged for this task.

## Ordered Implementation Steps

1. Create root files: `pnpm-workspace.yaml`, `.nvmrc`, `.gitignore`, `.env.example`, `tsconfig.base.json`, root `package.json`.
2. Create `packages/shared` workspace: `package.json`, `tsconfig.json`, placeholder `src/index.ts`.
3. Create `apps/api` workspace: `package.json`, `tsconfig.json`, placeholder `src/index.ts` importing `@community-pulse/shared`, multi-stage `Dockerfile`.
4. Create `apps/web` workspace: `package.json`, `tsconfig.json`, placeholder `src/main.tsx` importing `@community-pulse/shared`.
5. Create `docker-compose.yml` with `mongodb`, `app`, and `mongo-express` (under `tools` profile) services and named volume `community_pulse_mongo_data`.
6. Replace 1-line `README.md` with a setup section listing prerequisites, install steps, workspace map, scripts, and env-var contract.
7. Run verification: `pnpm install`, `pnpm -r run typecheck`, `pnpm build`, `docker compose config`.

## Technology Choices (Atlas decisions)

- Node 20 LTS (Iron) via `.nvmrc`.
- pnpm 11.2.2 via `packageManager` field (matches developer local env).
- TypeScript 5.6.x.
- `mongo:7`, `node:20-alpine`, `mongo-express:1.0.2`.
- `packages/shared` exports TS source directly (path-alias resolution via Vite/tsc) to avoid build-order coupling at this scaffolding stage.
- `mongo-express` placed under Docker Compose profile `tools` (opt-in).

## Acceptance Criteria (from FairMind TASK-2026-0966)

1. `pnpm-workspace.yaml` exists at repo root and declares `apps/*` and `packages/*`.
2. Root `tsconfig.base.json` defines `@community-pulse/shared` path alias.
3. All three workspaces have `package.json` + `tsconfig.json` extending base.
4. `pnpm install` completes without hoisting errors.
5. `pnpm -r run build` (or `pnpm build`) compiles all three workspaces with zero TypeScript errors.
6. `@community-pulse/shared` resolves in `apps/api/src/index.ts` and `apps/web/src/main.tsx` during `pnpm typecheck`.
7. `docker-compose.yml` includes `mongodb` (mongo:7), `app`, and `mongo-express` services.
8. `docker compose up` starts services without manual intervention; named volume persists data.
9. `.env.example` documents `MONGO_URI`, `JWT_SECRET`, `PORT`, `APP_ORIGIN`, `NODE_ENV`.
10. `README.md` contains working local setup instructions.

## Work Package Location

`.fairmind/community-pulse/sprint-1-foundation/work_packages/backend/TASK-2026-0966_backend_workpackage.md`
