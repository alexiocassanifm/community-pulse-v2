# Conductor Tests: US-2026-0589 / TASK-2026-0966

## Test Cases in FairMind

`mcp__Fairmind__Studio_list_tests_by_userstory` returned **0 test cases** for US-2026-0589. The acceptance criteria of TASK-2026-0966 are the validation contract.

See: `.fairmind/community-pulse/sprint-1-foundation/requirements/tests/.no-tests`

## Validation Commands (executed by Echo before flagging complete)

| Command                    | Expected Result                                                                  |
| -------------------------- | -------------------------------------------------------------------------------- |
| `pnpm install`             | Exit 0. Lockfile generated. No `ERR_PNPM_*` hoisting errors.                     |
| `pnpm -r run typecheck`    | Exit 0. All three workspaces report success. `@community-pulse/shared` resolves. |
| `pnpm build`               | Exit 0. `packages/shared/dist/index.js` produced. `apps/api/dist/index.js` produced. `apps/web` reports success (no-emit). |
| `docker compose config`    | Exit 0. Compose file validates. `mongodb`, `app` services parsed.                |

## Acceptance Criteria as Test Expectations

Each acceptance criterion in TASK-2026-0966 maps directly to a verifiable file existence or command exit code. Validation is performed by inspecting the working tree and running the four commands above. No external services (MongoDB live container, HTTP probes) are exercised in this scaffolding task — those land in TASK-2026-0970 (Mongoose) and TASK-2026-0968 (Hono health endpoint).
