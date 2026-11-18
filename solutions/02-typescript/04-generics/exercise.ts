// Reference solution for 02-04. Read it only AFTER your own version passes.

export function first<T>(arr: readonly T[]): T | undefined {
  return arr[0];
}

export function last<T>(arr: readonly T[]): T | undefined {
  return arr[arr.length - 1]; // arr[-1] on an empty array is undefined, which is fine
}

export function groupBy<T, K extends PropertyKey>(
  items: readonly T[],
  getKey: (item: T) => K,
): Partial<Record<K, T[]>> {
  const groups: Partial<Record<K, T[]>> = {};
  for (const item of items) {
    const key = getKey(item);
    (groups[key] ??= []).push(item); // ??= assigns only if currently null/undefined
  }
  return groups;
}

export function pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][] {
  return items.map((item) => item[key]);
}

export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}

export function createRegistry<T extends { id: string }>() {
  const byId = new Map<string, T>(); // Maps keep insertion order
  return {
    register(item: T): void {
      if (byId.has(item.id)) throw new Error(`Duplicate id: ${item.id}`);
      byId.set(item.id, item);
    },
    get(id: string): T | undefined {
      return byId.get(id);
    },
    all(): T[] {
      return [...byId.values()];
    },
  };
}
