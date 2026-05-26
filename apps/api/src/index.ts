import { SHARED_PACKAGE_NAME, submissionSchema } from '@community-pulse/shared';

// Placeholder entrypoint. The real Hono app lands in TASK-2026-0968.
function main(): void {
  // Reference submissionSchema so the import is not tree-shaken / unused.
  const sample = submissionSchema.safeParse({});
  // eslint-disable-next-line no-console
  console.log(
    `[api] bootstrapping with shared package: ${SHARED_PACKAGE_NAME} (submissionSchema parse ok: ${sample.success})`,
  );
}

main();
