import { describe, expect, it, vi } from 'vitest';
import { createGameLoop, type GameLoopOptions } from './exercise';

function setup(overrides: Partial<GameLoopOptions> = {}) {
  let time = 1_000;
  const update = vi.fn();
  const render = vi.fn();
  const onDroppedTime = vi.fn();
  const loop = createGameLoop({
    stepMs: 100,
    maxStepsPerFrame: 10,
    now: () => time,
    update,
    render,
    onDroppedTime,
    ...overrides,
  });
  const advance = (ms: number) => {
    time += ms;
    loop.frame();
  };
  return { loop, update, render, onDroppedTime, advance, setTime: (t: number) => (time = t) };
}

describe('createGameLoop', () => {
  it('does nothing before start', () => {
    const { loop, update, advance } = setup();
    advance(500);
    expect(update).not.toHaveBeenCalled();
    expect(loop.isRunning()).toBe(false);
  });

  it('runs one update per whole step, always with stepMs', () => {
    const { loop, update, advance } = setup();
    loop.start();
    advance(250);
    expect(update).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenNthCalledWith(1, 100);
    expect(update).toHaveBeenNthCalledWith(2, 100);
  });

  it('keeps leftover time in the accumulator', () => {
    const { loop, update, advance } = setup();
    loop.start();
    advance(130); // 1 step, 30 left
    advance(70); // 30 + 70 = 100 → 1 step
    advance(250); // 2 steps, 50 left
    expect(update).toHaveBeenCalledTimes(4);
    advance(50); // 50 + 50 → 1 step
    expect(update).toHaveBeenCalledTimes(5);
  });

  it('renders with alpha = leftover / step', () => {
    const { loop, render, advance } = setup();
    loop.start();
    advance(250);
    expect(render).toHaveBeenLastCalledWith(0.5);
    advance(25);
    expect(render).toHaveBeenLastCalledWith(0.75);
  });

  it('caps catch-up and reports the dropped time', () => {
    const { loop, update, onDroppedTime, render, advance } = setup();
    loop.start();
    advance(5_030); // 50 steps' worth, but only 10 allowed
    expect(update).toHaveBeenCalledTimes(10);
    expect(onDroppedTime).toHaveBeenCalledWith(4_000); // 40 whole steps dropped
    expect(render).toHaveBeenLastCalledWith(0.3); // the 30ms fraction is kept
  });

  it('does not report dropped time when the cap was not exceeded', () => {
    const { loop, onDroppedTime, advance } = setup();
    loop.start();
    advance(1_000); // exactly 10 steps
    expect(onDroppedTime).not.toHaveBeenCalled();
  });

  it('works without render or onDroppedTime', () => {
    const update = vi.fn();
    let time = 0;
    const loop = createGameLoop({ stepMs: 100, maxStepsPerFrame: 2, now: () => time, update });
    loop.start();
    time += 1_000;
    expect(() => loop.frame()).not.toThrow();
    expect(update).toHaveBeenCalledTimes(2);
  });

  it('ignores time going backwards', () => {
    const { loop, update, setTime } = setup();
    loop.start();
    setTime(500); // earlier than the start time of 1000
    loop.frame();
    expect(update).not.toHaveBeenCalled();
    setTime(600);
    loop.frame();
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('stops, and does not simulate time spent stopped', () => {
    const { loop, update, advance } = setup();
    loop.start();
    advance(200);
    loop.stop();
    expect(loop.isRunning()).toBe(false);
    advance(10_000);
    expect(update).toHaveBeenCalledTimes(2);
    loop.start();
    advance(100);
    expect(update).toHaveBeenCalledTimes(3);
  });

  it('ignores start() while already running', () => {
    const { loop, update, advance } = setup();
    loop.start();
    advance(50);
    loop.start(); // must not reset the accumulator or the clock
    advance(50);
    expect(update).toHaveBeenCalledTimes(1);
  });
});
