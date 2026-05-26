import { SHARED_PACKAGE_NAME, submissionSchema } from '@community-pulse/shared';

// Placeholder entrypoint. The real Vite + React 18 SPA lands in TASK-2026-0969.
// Reference submissionSchema so the import is not tree-shaken / unused.
const sample = submissionSchema.safeParse({});

// eslint-disable-next-line no-console
console.log(
  `[web] bootstrapping with shared package: ${SHARED_PACKAGE_NAME} (submissionSchema parse ok: ${sample.success})`,
);
