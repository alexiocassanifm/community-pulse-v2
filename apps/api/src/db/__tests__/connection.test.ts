import mongoose from 'mongoose';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  MAX_RETRIES,
  RETRY_DELAY_MS,
  __resetDbStatusForTests,
  connectToMongoDB,
  disconnectFromMongoDB,
  getDbStatus,
} from '../connection.js';

describe('db/connection', () => {
  const ORIGINAL_MONGO_URI = process.env.MONGO_URI;

  beforeEach(() => {
    __resetDbStatusForTests();
    process.env.MONGO_URI = 'mongodb://test-host:27017/test-db';
    vi.useFakeTimers();
    // Silence the module's logs during retry-loop assertions.
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    if (ORIGINAL_MONGO_URI === undefined) {
      delete process.env.MONGO_URI;
    } else {
      process.env.MONGO_URI = ORIGINAL_MONGO_URI;
    }
  });

  it('getDbStatus() returns "disconnected" before connectToMongoDB() is called', () => {
    expect(getDbStatus()).toBe('disconnected');
  });

  it('throws immediately when MONGO_URI is not set', async () => {
    delete process.env.MONGO_URI;
    await expect(connectToMongoDB()).rejects.toThrow(
      'MONGO_URI environment variable is not set',
    );
    expect(getDbStatus()).toBe('disconnected');
  });

  it('sets status to "connected" after a successful connection', async () => {
    const connectSpy = vi
      .spyOn(mongoose, 'connect')
      .mockResolvedValue(mongoose);

    await connectToMongoDB();

    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(connectSpy).toHaveBeenCalledWith(
      process.env.MONGO_URI,
      expect.objectContaining({ serverSelectionTimeoutMS: 5000 }),
    );
    expect(getDbStatus()).toBe('connected');
  });

  it('retries on failure and succeeds on a later attempt', async () => {
    const connectSpy = vi
      .spyOn(mongoose, 'connect')
      .mockRejectedValueOnce(new Error('boom-1'))
      .mockRejectedValueOnce(new Error('boom-2'))
      .mockResolvedValueOnce(mongoose);

    const connectPromise = connectToMongoDB();

    // Advance through the two retry delays.
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS);
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS);

    await connectPromise;

    expect(connectSpy).toHaveBeenCalledTimes(3);
    expect(getDbStatus()).toBe('connected');
  });

  it('throws after MAX_RETRIES failed attempts and stays "disconnected"', async () => {
    const connectSpy = vi
      .spyOn(mongoose, 'connect')
      .mockRejectedValue(new Error('always-fails'));

    const connectPromise = connectToMongoDB();
    // Attach a rejection handler synchronously so an unhandled rejection
    // does not surface while we are advancing fake timers between attempts.
    const assertion = expect(connectPromise).rejects.toThrow(
      `[MongoDB] Failed to connect after ${MAX_RETRIES} attempts`,
    );

    // We need MAX_RETRIES - 1 sleep cycles between attempts.
    for (let i = 0; i < MAX_RETRIES - 1; i += 1) {
      await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS);
    }

    await assertion;

    expect(connectSpy).toHaveBeenCalledTimes(MAX_RETRIES);
    expect(getDbStatus()).toBe('disconnected');
  });

  it('disconnectFromMongoDB() resets status to "disconnected"', async () => {
    vi.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
    const disconnectSpy = vi
      .spyOn(mongoose, 'disconnect')
      .mockResolvedValue(undefined);

    await connectToMongoDB();
    expect(getDbStatus()).toBe('connected');

    await disconnectFromMongoDB();

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
    expect(getDbStatus()).toBe('disconnected');
  });
});
