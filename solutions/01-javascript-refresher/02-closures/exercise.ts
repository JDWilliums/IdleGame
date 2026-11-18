// Reference solution for 01-02. Read it only AFTER your own version passes.

export function createIdGenerator(prefix: string): () => string {
  let n = 0; // private to this generator
  return () => {
    n += 1;
    return `${prefix}-${n}`;
  };
}

export type Counter = {
  increment: () => number;
  decrement: () => number;
  reset: () => void;
  value: () => number;
};

export function createCounter(start = 0): Counter {
  let count = start; // `start` is also captured, which is how reset() remembers it
  return {
    increment: () => ++count,
    decrement: () => --count,
    reset: () => {
      count = start;
    },
    value: () => count,
  };
}

export function once<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
): (...args: Args) => Result {
  let called = false; // a separate flag, because `result` might legitimately be undefined
  let result: Result;
  return (...args) => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  };
}

export function memoize<Arg, Result>(fn: (arg: Arg) => Result): (arg: Arg) => Result {
  const cache = new Map<Arg, Result>();
  return (arg) => {
    // Check with .has() rather than `if (cache.get(arg))`: cached values may be falsy.
    if (cache.has(arg)) return cache.get(arg) as Result;
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
}

export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  ms: number,
): (...args: Args) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args) => {
    clearTimeout(timer); // cancel the previous pending call (no-op if undefined)
    timer = setTimeout(() => fn(...args), ms);
  };
}
