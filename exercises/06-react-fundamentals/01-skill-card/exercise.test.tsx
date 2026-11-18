// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SkillCard, type SkillCardProps } from './exercise';

function renderCard(overrides: Partial<SkillCardProps> = {}) {
  const onSelect = vi.fn();
  render(
    <SkillCard
      name="Woodcutting"
      icon="🪓"
      level={12}
      xp={1540}
      xpForNext={1800}
      onSelect={onSelect}
      {...overrides}
    />,
  );
  return { onSelect };
}

describe('SkillCard', () => {
  it('renders an article named after the skill, with a heading', () => {
    renderCard();
    const card = screen.getByRole('article', { name: 'Woodcutting' });
    expect(card).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Woodcutting' })).toBeInTheDocument();
  });

  it('hides the decorative icon from screen readers', () => {
    renderCard();
    const icon = screen.getByText('🪓');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows the level out of the default max of 99', () => {
    renderCard();
    expect(screen.getByText('Level 12 / 99')).toBeInTheDocument();
  });

  it('respects a custom maxLevel', () => {
    renderCard({ maxLevel: 120 });
    expect(screen.getByText('Level 12 / 120')).toBeInTheDocument();
  });

  it('shows an accessible XP progress bar with formatted numbers', () => {
    renderCard();
    const bar = screen.getByRole('progressbar', { name: 'Woodcutting XP' });
    expect(bar).toHaveAttribute('value', '1540');
    expect(bar).toHaveAttribute('max', '1800');
    expect(screen.getByText('1,540 / 1,800 XP')).toBeInTheDocument();
  });

  it('shows MAX and no progress bar at max level', () => {
    renderCard({ level: 99 });
    expect(screen.getByText('MAX')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows a Train button that calls onSelect', async () => {
    const { onSelect } = renderCard();
    await userEvent.click(screen.getByRole('button', { name: 'Train' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('shows an Active badge and a Stop button when active', async () => {
    const { onSelect } = renderCard({ isActive: true });
    expect(screen.getByText('Active')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Stop' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('has no Active badge when inactive', () => {
    renderCard();
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
  });

  it('disables the button when locked', async () => {
    const { onSelect } = renderCard({ isLocked: true });
    const button = screen.getByRole('button', { name: 'Locked' });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('uses type="button"', () => {
    renderCard();
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('gives each card a unique heading id', () => {
    render(
      <>
        <SkillCard name="Fishing" icon="🎣" level={1} xp={0} xpForNext={83} onSelect={() => {}} />
        <SkillCard name="Mining" icon="⛏️" level={1} xp={0} xpForNext={83} onSelect={() => {}} />
      </>,
    );
    expect(screen.getByRole('article', { name: 'Fishing' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Mining' })).toBeInTheDocument();
  });
});
