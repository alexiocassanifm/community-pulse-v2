import { z } from 'zod';

/**
 * Marker constant used by scaffolding smoke tests to confirm that the
 * `@community-pulse/shared` workspace alias resolves correctly from both
 * `apps/api` and `apps/web`.
 */
export const SHARED_PACKAGE_NAME = '@community-pulse/shared' as const;

export type WorkspaceMarker = typeof SHARED_PACKAGE_NAME;

/**
 * Placeholder Zod schema. The real 5-step anonymous submission schema lands
 * in TASK-2026-0967 (US-2026-0590). Defined here so that the scaffolding
 * acceptance test — importing `submissionSchema` from `@community-pulse/shared`
 * in both consumer workspaces — passes literally.
 */
export const submissionSchema = z.object({});

export type Submission = z.infer<typeof submissionSchema>;
