import { serve } from '@hono/node-server';
import { Hono } from 'hono';

import { connectToMongoDB, disconnectFromMongoDB } from './db/connection.js';
import { healthRoute } from './routes/health.js';

const app = new Hono();

app.route('/api/health', healthRoute);

async function main(): Promise<void> {
  await connectToMongoDB();

  const port = Number(process.env.PORT) || 3000;
  const server = serve({ fetch: app.fetch, port });
  // eslint-disable-next-line no-console
  console.log('[Server] Listening on port %d', port);

  const shutdown = async (signal: string): Promise<void> => {
    // eslint-disable-next-line no-console
    console.log('[Server] Received %s, shutting down gracefully...', signal);
    try {
      server.close();
      await disconnectFromMongoDB();
      process.exit(0);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Server] Error during shutdown: %o', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[Server] Fatal startup error: %o', err);
  process.exit(1);
});
