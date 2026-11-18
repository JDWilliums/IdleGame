// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionTimer, type ActionTimerProps } from './exercise';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function setup(props: Partial<ActionTimerProps> = {}) {
  const onComplete = vi.fn();
  const utils = render(
    <StrictMode>
      <ActionTimer label="Chop oak" durationMs={2500} onComplete={onComplete} {...props} />
    </StrictMode>,
  );
  return { onComplete, ...utils };
}

const timeLeft = () => screen.getByRole('status', { name: 'Time left' });
const progress = () => screen.getByRole('progressbar', { name: 'Chop oak progress' });
const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
// Advance one 100ms tick at a time, letting React re-render between ticks, just
// like a real browser does when interval callbacks are 100ms apart.
const advance = (ms: number) => {
  for (let elapsed = 0; elapsed < ms; elapsed += 100) {
    act(() => {
      vi.advanceTimersByTime(Math.min(100, ms - elapsed));
    });
  }
};

describe('ActionTimer', () => {
  it('starts idle with the full duration and no running timers', () => {
    setup();
    expect(screen.getByRole('region', { name: 'Chop oak' })).toBeInTheDocument();
    expect(timeLeft()).toHaveTextContent('2.5s');
    expect(progress()).toHaveAttribute('value', '0');
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('counts down while running', () => {
    setup();
    press('Start');
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    advance(1000);
    expect(timeLeft()).toHaveTextContent('1.5s');
    expect(Number(progress().getAttribute('value'))).toBeCloseTo(0.4, 2);
  });

  it('does not use up time while paused', () => {
    setup();
    press('Start');
    advance(1000);
    press('Pause');
    expect(vi.getTimerCount()).toBe(0);
    advance(10_000);
    expect(timeLeft()).toHaveTextContent('1.5s');
    press('Resume');
    advance(500);
    expect(timeLeft()).toHaveTextContent('1.0s');
  });

  it('completes once and stops when not repeating', () => {
    const { onComplete } = setup();
    press('Start');
    advance(2500);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(timeLeft()).toHaveTextContent('0.0s');
    expect(progress()).toHaveAttribute('value', '1');
    expect(screen.getByText('Done!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    advance(10_000);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('can start a fresh cycle after finishing', () => {
    const { onComplete } = setup();
    press('Start');
    advance(2500);
    press('Start');
    expect(screen.queryByText('Done!')).not.toBeInTheDocument();
    advance(1000);
    expect(timeLeft()).toHaveTextContent('1.5s');
    advance(1500);
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it('repeats automatically, completing once per cycle', () => {
    const { onComplete } = setup({ repeat: true, durationMs: 1000 });
    press('Start');
    advance(3000);
    expect(onComplete).toHaveBeenCalledTimes(3);
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    expect(screen.queryByText('Done!')).not.toBeInTheDocument();
    advance(500);
    expect(timeLeft()).toHaveTextContent('0.5s');
  });

  it('resets to idle', () => {
    setup();
    press('Start');
    advance(1200);
    press('Reset');
    expect(timeLeft()).toHaveTextContent('2.5s');
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cleans up its interval on unmount', () => {
    const { unmount, onComplete } = setup({ repeat: true, durationMs: 500 });
    press('Start');
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    advance(5000);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
