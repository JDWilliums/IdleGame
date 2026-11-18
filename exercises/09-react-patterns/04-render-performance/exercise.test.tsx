// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expensiveCalls, GameScreen, RenderTrackerContext } from './exercise';

function setup() {
  const renders: string[] = [];
  render(
    <RenderTrackerContext value={(name) => renders.push(name)}>
      <GameScreen />
    </RenderTrackerContext>,
  );
  /** Returns the renders that happened during `fn`, sorted for easy comparison. */
  const during = async (fn: () => Promise<void>) => {
    const start = renders.length;
    await fn();
    return renders.slice(start).sort();
  };
  return { during };
}

const click = (name: string) => userEvent.click(screen.getByRole('button', { name }));

describe('behaviour (should pass before AND after your optimisation)', () => {
  it('ticks', async () => {
    setup();
    await click('Tick');
    await click('Tick');
    expect(screen.getByRole('status', { name: 'Ticks' })).toHaveTextContent('2');
  });

  it('lists unlocked skills and the total level', () => {
    setup();
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByText('Total level: 27')).toBeInTheDocument();
  });

  it('selects a skill', async () => {
    setup();
    await click('Fishing (lvl 7)');
    expect(screen.getByRole('button', { name: 'Fishing (lvl 7)' })).toHaveAttribute('aria-pressed', 'true');
    await click('Mining (lvl 3)');
    expect(screen.getByRole('button', { name: 'Fishing (lvl 7)' })).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('performance', () => {
  it('a tick re-renders only the TickCounter', async () => {
    const { during } = setup();
    const renders = await during(() => click('Tick'));
    expect(renders, 'components that re-rendered on Tick').toEqual(['TickCounter']);
  });

  it('a tick does not recompute the expensive total', async () => {
    setup();
    const before = expensiveCalls.count;
    await click('Tick');
    await click('Tick');
    expect(expensiveCalls.count - before).toBe(0);
  });

  it('selecting a skill re-renders only the rows whose selection changed', async () => {
    const { during } = setup();
    const first = await during(() => click('Fishing (lvl 7)'));
    expect(first, 'first selection').toEqual(['SkillList', 'SkillRow:fishing']);
    const second = await during(() => click('Mining (lvl 3)'));
    expect(second, 'changing selection').toEqual(['SkillList', 'SkillRow:fishing', 'SkillRow:mining']);
  });
});
