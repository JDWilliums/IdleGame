// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { createElement, StrictMode, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useInterval } from './exercise';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const strict = ({ children }: { children: ReactNode }) => createElement(StrictMode, null, children);

describe('useInterval', () => {
  it('calls the callback every `delay` ms', () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, 1000));
    vi.advanceTimersByTime(999);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(3000);
    expect(callback).toHaveBeenCalledTimes(4);
  });

  it('does not run when delay is null', () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, null));
    vi.advanceTimersByTime(10_000);
    expect(callback).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('pauses and resumes when delay switches to and from null', () => {
    const callback = vi.fn();
    const { rerender } = renderHook(({ delay }) => useInterval(callback, delay), {
      initialProps: { delay: 100 as number | null },
    });
    vi.advanceTimersByTime(300);
    expect(callback).toHaveBeenCalledTimes(3);
    rerender({ delay: null });
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(3);
    rerender({ delay: 100 });
    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(4);
  });

  it('restarts with a new delay', () => {
    const callback = vi.fn();
    const { rerender } = renderHook(({ delay }) => useInterval(callback, delay), {
      initialProps: { delay: 1000 },
    });
    rerender({ delay: 200 });
    vi.advanceTimersByTime(600);
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('always calls the LATEST callback, without restarting the timer', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ cb }) => useInterval(cb, 1000), {
      initialProps: { cb: first },
    });
    vi.advanceTimersByTime(600);
    rerender({ cb: second }); // a new callback, as happens on every render
    vi.advanceTimersByTime(400); // if the timer had restarted, nothing would fire yet
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('clears the interval on unmount', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useInterval(callback, 100));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(1000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('runs exactly one interval under StrictMode', () => {
    const callback = vi.fn();
    renderHook(() => useInterval(callback, 100), { wrapper: strict });
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(5);
  });
});
