import mongoose from 'mongoose';

/**
 * Maximum number of connection attempts before `connectToMongoDB()`
 * gives up and throws. Tuned for the Docker Compose first-boot race
 * where the `app` container starts before MongoDB is fully ready.
 */
export const MAX_RETRIES = 5;

/**
 * Delay between connection attempts, in milliseconds.
 */
export const RETRY_DELAY_MS = 3000;

/**
 * Server-selection timeout passed to `mongoose.connect()`. Each individual
 * attempt will fail-fast after this many milliseconds rather than hanging
 * on an unreachable host.
 */
export const SERVER_SELECTION_TIMEOUT_MS = 5000;

type DbStatus = 'connected' | 'disconnected';

let dbStatus: DbStatus = 'disconnected';

/**
 * Tracks whether Mongoose connection-level event listeners have already
 * been registered. The listeners must only be attached once per process,
 * even if `connectToMongoDB()` is invoked repeatedly (e.g. from tests).
 */
let listenersRegistered = false;

/**
 * Returns the current MongoDB connection status as observed by this
 * module. The value is kept in sync with Mongoose's own connection
 * lifecycle through `disconnected` / `reconnected` event listeners.
 */
export function getDbStatus(): DbStatus {
  return dbStatus;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function registerConnectionListeners(): void {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection.on('disconnected', () => {
    dbStatus = 'disconnected';
    // eslint-disable-next-line no-console
    console.warn('[MongoDB] Connection lost');
  });

  mongoose.connection.on('reconnected', () => {
    dbStatus = 'connected';
    // eslint-disable-next-line no-console
    console.log('[MongoDB] Reconnected');
  });
}

/**
 * Connects to MongoDB using the URI from `process.env.MONGO_URI`.
 *
 * Behavior:
 * - Throws immediately if `MONGO_URI` is not set (fail-fast on misconfig).
 * - Retries up to `MAX_RETRIES` times, sleeping `RETRY_DELAY_MS` between
 *   attempts, before throwing a descriptive error.
 * - On success, sets the internal status to `'connected'` and registers
 *   Mongoose lifecycle listeners so transient disconnects after startup
 *   are reflected in `getDbStatus()`.
 */
export async function connectToMongoDB(): Promise<void> {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI environment variable is not set');
  }

  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      });
      dbStatus = 'connected';
      registerConnectionListeners();
      // eslint-disable-next-line no-console
      console.log('[MongoDB] Connected successfully on attempt %d', attempt + 1);
      return;
    } catch (err) {
      attempt += 1;
      // eslint-disable-next-line no-console
      console.error(
        '[MongoDB] Connection attempt %d/%d failed: %o',
        attempt,
        MAX_RETRIES,
        err,
      );
      if (attempt >= MAX_RETRIES) {
        throw new Error(
          `[MongoDB] Failed to connect after ${MAX_RETRIES} attempts`,
        );
      }
      await sleep(RETRY_DELAY_MS);
    }
  }
}

/**
 * Closes the Mongoose connection and marks the status as disconnected.
 * Safe to call multiple times; `mongoose.disconnect()` is a no-op when
 * no connection is open.
 */
export async function disconnectFromMongoDB(): Promise<void> {
  await mongoose.disconnect();
  dbStatus = 'disconnected';
  // eslint-disable-next-line no-console
  console.log('[MongoDB] Disconnected');
}

/**
 * Test-only helper: forcibly reset the module-level status. Not exported
 * from the package barrel and intentionally undocumented in the public
 * API surface — production code must rely on `connectToMongoDB()` /
 * `disconnectFromMongoDB()` to mutate state.
 */
export function __resetDbStatusForTests(): void {
  dbStatus = 'disconnected';
  listenersRegistered = false;
}
