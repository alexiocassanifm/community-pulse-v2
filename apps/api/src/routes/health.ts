import { Hono } from 'hono';

import { getDbStatus } from '../db/connection.js';

/**
 * Liveness + readiness probe.
 *
 * Always returns HTTP `200` regardless of the MongoDB connection state —
 * the `db` field communicates readiness without producing a false-positive
 * failure during a brief reconnection window. Orchestration layers (Docker
 * Compose `healthcheck`, load balancers, k8s probes) can inspect the `db`
 * field to decide whether to route traffic.
 */
export const healthRoute = new Hono();

healthRoute.get('/', (c) =>
  c.json({
    status: 'ok' as const,
    db: getDbStatus(),
  }),
);
