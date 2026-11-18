import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  loadAllInParallel,
  loadSequentially,
  retry,
  sleep,
  TimeoutError,
  withTimeout,
} from './exercise';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

/** A promise we can resolve/reject from the outside, after a delay. */
function delayed<T>(ms: number, value: T, fail = false): Promise<T> {
  return new Promise((resolve, reject) =>
    setTimeout(() => (fail ? reject(new Error(String(value))) : resolve(value)), ms),
  );
}

describe('sleep', () => {
  it('resolves after the given time, not before', async () => {
    const done = vi.fn();
    sleep(1000).then(done);
    await vi.advanceTimersByTimeAsync(999);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toHaveBeenCalledTimes(1);
  });
});

describe('TimeoutError', () => {
  it('is an Error with the right name and message', () => {
    const err = new TimeoutError(250);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('TimeoutError');
    expect(err.message).toBe('Timed out after 250ms');
  });
});

describe('withTimeout', () => {
  it('resolves with the value when the promise is fast enough', async () => {
    const result = withTimeout(delayed(100, 'save-data'), 500);
    await vi.advanceTimersByTimeAsync(100);
    await expect(result).resolves.toBe('save-data');
  });

  it('rejects with TimeoutError when the promise is too slow', async () => {
    const result = withTimeout(delayed(1000, 'too late'), 500);
    const assertion = expect(result).rejects.toBeInstanceOf(TimeoutError);
    await vi.advanceTimersByTimeAsync(500);
    await assertion;
  });

  it('passes through rejections from the original promise', async () => {
    const result = withTimeout(delayed(100, 'network down', true), 500);
    const assertion = expect(result).rejects.toThrow('network down');
    await vi.advanceTimersByTimeAsync(100);
    await assertion;
  });

  it('clears its timer when the promise settles first (no leaked timers)', async () => {
    const result = withTimeout(Promise.resolve('instant'), 5000);
    await expect(result).resolves.toBe('instant');
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('retry', () => {
  it('returns immediately when the first attempt succeeds', async () => {
    const fn = vi.fn(async () => 'ok');
    await expect(retry(fn, { retries: 3, baseDelayMs: 100 })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries with exponential backoff until it succeeds', async () => {
    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('ok');

    const outcome = settle(retry(fn, { retries: 3, baseDelayMs: 100 }));

    await vi.advanceTimersByTimeAsync(0);
    expect(fn).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(99);
    expect(fn).toHaveBeenCalledTimes(1); // first wait is 100ms
    await vi.advanceTimersByTimeAsync(1);
    expect(fn).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(199);
    expect(fn).toHaveBeenCalledTimes(2); // second wait is 200ms
    await vi.advanceTimersByTimeAsync(1);
    expect(fn).toHaveBeenCalledTimes(3);

    await expect(outcome).resolves.toEqual({ value: 'ok' });
  });

  it('rejects with the LAST error after running out of retries', async () => {
    let n = 0;
    const fn = vi.fn(async () => {
      n += 1;
      throw new Error(`attempt ${n}`);
    });
    const outcome = settle(retry(fn, { retries: 2, baseDelayMs: 10 }));
    await vi.advanceTimersByTimeAsync(10 + 20);
    const { error } = await outcome;
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('attempt 3');
    expect(fn).toHaveBeenCalledTimes(3); // 1 attempt + 2 retries
  });

  it('with retries: 0, tries exactly once', async () => {
    const fn = vi.fn(async () => {
      throw new Error('nope');
    });
    await expect(retry(fn, { retries: 0, baseDelayMs: 10 })).rejects.toThrow('nope');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('loadAllInParallel', () => {
  it('starts all loads at once and keeps input order', async () => {
    const times: Record<string, number> = { a: 300, b: 100, c: 200 };
    const loader = vi.fn((id: string) => delayed(times[id] ?? 0, id.toUpperCase()));

    const outcome = settle(loadAllInParallel(['a', 'b', 'c'], loader));
    await vi.advanceTimersByTimeAsync(0);
    expect(loader).toHaveBeenCalledTimes(3); // all started immediately

    await vi.advanceTimersByTimeAsync(300); // total ≈ the slowest, not the sum
    await expect(outcome).resolves.toEqual({ value: ['A', 'B', 'C'] });
  });
});

describe('loadSequentially', () => {
  it('loads one at a time, in order', async () => {
    let active = 0;
    let maxActive = 0;
    const order: string[] = [];
    const loader = async (id: string) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      order.push(id);
      await sleepReal(100);
      active -= 1;
      return id.toUpperCase();
    };

    const outcome = settle(loadSequentially(['a', 'b', 'c'], loader));
    await vi.advanceTimersByTimeAsync(300);
    await expect(outcome).resolves.toEqual({ value: ['A', 'B', 'C'] });
    expect(maxActive).toBe(1);
    expect(order).toEqual(['a', 'b', 'c']);
  });
});

/** Turns a promise into one that never rejects, so failed tests don't leave unhandled rejections. */
function settle<T>(promise: Promise<T>): Promise<{ value?: T; error?: unknown }> {
  return promise.then(
    (value) => ({ value }),
    (error: unknown) => ({ error }),
  );
}

// A local helper so the sequential test doesn't depend on YOUR sleep() working.
function sleepReal(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
