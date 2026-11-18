// @vitest-environment jsdom
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { typeErrors } from '../../_support/typecheck';
import { SelectList } from './exercise';

type Spot = { id: string; name: string };
const spots: Spot[] = [
  { id: 'pond', name: 'Village Pond' },
  { id: 'river', name: 'Rushing River' },
  { id: 'coast', name: 'Stormy Coast' },
];

function Harness({ initial = null as Spot | null, onSelect = vi.fn() }) {
  const [selected, setSelected] = useState<Spot | null>(initial);
  return (
    <SelectList
      label="Fishing spot"
      items={spots}
      getKey={(s) => s.id}
      getLabel={(s) => s.name}
      selected={selected}
      onSelect={(s) => {
        setSelected(s);
        onSelect(s);
      }}
    />
  );
}

const options = () => screen.getAllByRole('option');
const option = (name: string) => screen.getByRole('option', { name });

describe('types (checked by the TypeScript compiler)', () => {
  it('types.check.tsx compiles with no errors', () => {
    expect(typeErrors(path.join(import.meta.dirname, 'types.check.tsx'))).toEqual([]);
  });
});

describe('SelectList', () => {
  it('renders a labelled listbox of options', () => {
    render(<Harness />);
    expect(screen.getByRole('listbox', { name: 'Fishing spot' })).toBeInTheDocument();
    expect(options().map((o) => o.textContent)).toEqual(['Village Pond', 'Rushing River', 'Stormy Coast']);
  });

  it('marks the selected option', () => {
    render(<Harness initial={spots[1]!} />);
    expect(option('Rushing River')).toHaveAttribute('aria-selected', 'true');
    expect(option('Village Pond')).toHaveAttribute('aria-selected', 'false');
  });

  it('selects on click, passing the full item', async () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);
    await userEvent.click(option('Stormy Coast'));
    expect(onSelect).toHaveBeenCalledWith(spots[2]);
    expect(option('Stormy Coast')).toHaveAttribute('aria-selected', 'true');
  });

  it('uses a roving tabindex', () => {
    const { unmount } = render(<Harness />);
    expect(options().map((o) => o.tabIndex)).toEqual([0, -1, -1]);
    unmount();
    render(<Harness initial={spots[2]!} />);
    expect(options().map((o) => o.tabIndex)).toEqual([-1, -1, 0]);
  });

  it('moves selection and focus with the arrow keys, stopping at the ends', async () => {
    render(<Harness initial={spots[0]!} />);
    option('Village Pond').focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(option('Rushing River')).toHaveAttribute('aria-selected', 'true');
    expect(option('Rushing River')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(option('Stormy Coast')).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    expect(option('Rushing River')).toHaveFocus();
    expect(option('Rushing River')).toHaveAttribute('aria-selected', 'true');
  });

  it('supports Home and End', async () => {
    render(<Harness initial={spots[1]!} />);
    option('Rushing River').focus();
    await userEvent.keyboard('{End}');
    expect(option('Stormy Coast')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(option('Village Pond')).toHaveFocus();
    expect(option('Village Pond')).toHaveAttribute('aria-selected', 'true');
  });

  it('can be reached with Tab', async () => {
    render(
      <>
        <button type="button">Before</button>
        <Harness initial={spots[1]!} />
      </>,
    );
    await userEvent.tab();
    await userEvent.tab();
    expect(option('Rushing River')).toHaveFocus();
  });

  it('shows a message when there are no options', () => {
    render(
      <SelectList label="Empty" items={[] as Spot[]} getKey={(s) => s.id} getLabel={(s) => s.name} selected={null} onSelect={() => {}} />,
    );
    expect(screen.getByText('No options')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
