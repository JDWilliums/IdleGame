// Reference solution for 01-04. Read it only AFTER your own version passes.

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Timed out after ${ms}ms`);
    this.name = 'TimeoutError';
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(ms)), ms);
  });
  // .finally runs whichever way the race ends, so the timer never leaks.
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export type RetryOptions = {
  retries: number;
  baseDelayMs: number;
};

export async function retry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const { retries, baseDelayMs } = options;
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn(); // `return await` so a rejection is caught HERE
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(baseDelayMs * 2 ** attempt);
      }
    }
  }
  throw lastError;
}

export async function loadAllInParallel<T>(
  ids: string[],
  loader: (id: string) => Promise<T>,
): Promise<T[]> {
  // map starts every load immediately; Promise.all preserves input order.
  return Promise.all(ids.map((id) => loader(id)));
}

export async function loadSequentially<T>(
  ids: string[],
  loader: (id: string) => Promise<T>,
): Promise<T[]> {
  const results: T[] = [];
  for (const id of ids) {
    results.push(await loader(id)); // await inside for...of = one at a time
  }
  return results;
}
