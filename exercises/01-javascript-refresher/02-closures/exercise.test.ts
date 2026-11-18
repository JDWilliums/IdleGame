import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCounter, createIdGenerator, debounce, memoize, once } from './exercise';

describe('createIdGenerator', () => {
  it('produces sequential ids with the prefix', () => {
    const nextId = createIdGenerator('item');
    expect(nextId()).toBe('item-1');
    expect(nextId()).toBe('item-2');
    expect(nextId()).toBe('item-3');
  });

  it('keeps independent counts per generator', () => {
    const a = createIdGenerator('a');
    const b = createIdGenerator('b');
    a();
    a();
    expect(b()).toBe('b-1');
    expect(a()).toBe('a-3');
  });
});

describe('createCounter', () => {
  it('starts at 0 by default', () => {
    expect(createCounter().value()).toBe(0);
  });

  it('increments and decrements, returning the new value', () => {
    const c = createCounter(5);
    expect(c.increment()).toBe(6);
    expect(c.increment()).toBe(7);
    expect(c.decrement()).toBe(6);
    expect(c.value()).toBe(6);
  });

  it('resets to the original start value', () => {
    const c = createCounter(10);
    c.increment();
    c.increment();
    c.reset();
    expect(c.value()).toBe(10);
  });

  it('keeps counters independent', () => {
    const a = createCounter();
    const b = createCounter();
    a.increment();
    expect(b.value()).toBe(0);
  });
});

describe('once', () => {
  it('calls the function only the first time', () => {
    const spy = vi.fn(() => 'started');
    const start = once(spy);
    start();
    start();
    start();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('passes arguments and returns the first result every time', () => {
    const add = once((a: number, b: number) => a + b);
    expect(add(2, 3)).toBe(5);
    expect(add(10, 10)).toBe(5);
  });

  it('works even when the first result is undefined', () => {
    const spy = vi.fn(() => undefined);
    const fn = once(spy);
    fn();
    fn();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('memoize', () => {
  it('returns the same results as the original function', () => {
    const square = memoize((n: number) => n * n);
    expect(square(4)).toBe(16);
    expect(square(5)).toBe(25);
  });

  it('only calls the original once per distinct argument', () => {
    const spy = vi.fn((n: number) => n * 2);
    const double = memoize(spy);
    double(3);
    double(3);
    double(4);
    double(3);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('caches falsy results too', () => {
    const spy = vi.fn((n: number) => n - n); // always 0
    const zero = memoize(spy);
    zero(7);
    zero(7);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('keeps separate caches for separately memoized functions', () => {
    const a = memoize((n: number) => n + 1);
    const b = memoize((n: number) => n + 100);
    expect(a(1)).toBe(2);
    expect(b(1)).toBe(101);
  });
});

describe('debounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('does not call immediately', () => {
    const spy = vi.fn();
    debounce(spy, 100)();
    expect(spy).not.toHaveBeenCalled();
  });

  it('calls once after the delay', () => {
    const spy = vi.fn();
    const save = debounce(spy, 100);
    save();
    vi.advanceTimersByTime(99);
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('restarts the wait on every call and uses the latest arguments', () => {
    const spy = vi.fn();
    const save = debounce(spy, 100);
    save('a');
    vi.advanceTimersByTime(60);
    save('b');
    vi.advanceTimersByTime(60);
    save('c');
    vi.advanceTimersByTime(99);
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('c');
  });

  it('can fire again after a quiet period', () => {
    const spy = vi.fn();
    const save = debounce(spy, 50);
    save();
    vi.advanceTimersByTime(50);
    save();
    vi.advanceTimersByTime(50);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
