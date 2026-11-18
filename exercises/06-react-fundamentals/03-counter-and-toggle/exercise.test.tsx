// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Disclosure, GoldCounter, Toggle } from './exercise';

const gold = () => screen.getByRole('status', { name: 'Gold' });
const click = (name: string) => userEvent.click(screen.getByRole('button', { name }));

describe('GoldCounter', () => {
  it('starts at 0 by default', () => {
    render(<GoldCounter />);
    expect(gold()).toHaveTextContent('0');
  });

  it('adds 1 and 10', async () => {
    render(<GoldCounter />);
    await click('+1');
    await click('+10');
    await click('+10');
    expect(gold()).toHaveTextContent('21');
  });

  it('disables Spend 25 until you can afford it', async () => {
    render(<GoldCounter initialGold={20} />);
    const spend = screen.getByRole('button', { name: 'Spend 25' });
    expect(spend).toBeDisabled();
    await click('+10');
    expect(spend).toBeEnabled();
    await userEvent.click(spend);
    expect(gold()).toHaveTextContent('5');
    expect(spend).toBeDisabled();
  });

  it('resets to the initial gold', async () => {
    render(<GoldCounter initialGold={7} />);
    await click('+10');
    await click('Reset');
    expect(gold()).toHaveTextContent('7');
  });

  it('keeps separate state per instance', async () => {
    render(
      <>
        <GoldCounter />
        <GoldCounter />
      </>,
    );
    const [firstPlus] = screen.getAllByRole('button', { name: '+1' });
    await userEvent.click(firstPlus!);
    const outputs = screen.getAllByRole('status', { name: 'Gold' });
    expect(outputs.map((o) => o.textContent)).toEqual(['1', '0']);
  });
});

describe('Toggle', () => {
  it('renders an accessible switch, off by default', () => {
    render(<Toggle label="Sound effects" />);
    const sw = screen.getByRole('switch', { name: 'Sound effects' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    expect(sw).toHaveAttribute('type', 'button');
  });

  it('can start on', () => {
    render(<Toggle label="Music" defaultOn />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('flips on click and reports the NEW value', async () => {
    const onChange = vi.fn();
    render(<Toggle label="Notifications" onChange={onChange} />);
    const sw = screen.getByRole('switch');
    await userEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
    expect(onChange).toHaveBeenLastCalledWith(true);
    await userEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'false');
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it('works without an onChange prop', async () => {
    render(<Toggle label="Vibration" />);
    await userEvent.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });
});

describe('Disclosure', () => {
  it('starts closed with content not rendered', () => {
    render(
      <Disclosure title="Item stats">
        <p>Sells for 20 gold</p>
      </Disclosure>,
    );
    expect(screen.getByRole('button', { name: 'Item stats' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByText('Sells for 20 gold')).not.toBeInTheDocument();
  });

  it('opens and closes', async () => {
    render(
      <Disclosure title="Item stats">
        <p>Sells for 20 gold</p>
      </Disclosure>,
    );
    const button = screen.getByRole('button', { name: 'Item stats' });
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Sells for 20 gold')).toBeInTheDocument();
    await userEvent.click(button);
    expect(screen.queryByText('Sells for 20 gold')).not.toBeInTheDocument();
  });
});
