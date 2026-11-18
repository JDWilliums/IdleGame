// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { BankSummary, ItemList, type Item } from './exercise';

const makeItems = (): readonly Item[] =>
  Object.freeze([
    Object.freeze({ id: 'willow_log', name: 'Willow Log', quantity: 4 }),
    Object.freeze({ id: 'trout', name: 'Trout', quantity: 0 }),
    Object.freeze({ id: 'oak_log', name: 'Oak Log', quantity: 30 }),
  ]);

let consoleError: MockInstance;
beforeEach(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => consoleError.mockRestore());

function expectNoKeyWarnings() {
  const keyWarnings = consoleError.mock.calls.filter((args) => String(args[0]).includes('key'));
  expect(keyWarnings, 'React logged a "key" warning. Does every <li> have a unique key?').toEqual([]);
}

describe('ItemList', () => {
  it('renders every item, sorted by name', () => {
    render(<ItemList items={makeItems()} />);
    const list = screen.getByRole('list', { name: 'Items' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows.map((li) => li.textContent)).toEqual([
      'Oak Log ×30',
      'Trout (out of stock)',
      'Willow Log ×4',
    ]);
    expectNoKeyWarnings();
  });

  it('does not mutate the items prop', () => {
    expect(() => render(<ItemList items={makeItems()} />)).not.toThrow();
  });

  it('hides empty stacks when hideEmpty is set', () => {
    render(<ItemList items={makeItems()} hideEmpty />);
    const rows = screen.getAllByRole('listitem');
    expect(rows.map((li) => li.textContent)).toEqual(['Oak Log ×30', 'Willow Log ×4']);
  });

  it('shows the default empty message and no list when there are no items', () => {
    render(<ItemList items={[]} />);
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows a custom empty message when everything is hidden', () => {
    const items = [{ id: 'trout', name: 'Trout', quantity: 0 }];
    render(<ItemList items={items} hideEmpty emptyMessage="Go catch something!" />);
    expect(screen.getByText('Go catch something!')).toBeInTheDocument();
  });

  it('keeps keys stable when items change', () => {
    const { rerender } = render(<ItemList items={makeItems()} />);
    rerender(<ItemList items={[...makeItems(), { id: 'gem', name: 'Gem', quantity: 1 }]} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expectNoKeyWarnings();
  });
});

describe('BankSummary', () => {
  it('summarises several stacks', () => {
    const { container } = render(<BankSummary items={makeItems()} />);
    expect(container.textContent).toBe('3 stacks · 34 items');
  });

  it('uses singular words for one', () => {
    const { container } = render(<BankSummary items={[{ id: 'gem', name: 'Gem', quantity: 1 }]} />);
    expect(container.textContent).toBe('1 stack · 1 item');
  });

  it('says "Empty bank" with no stray 0', () => {
    const { container } = render(<BankSummary items={[]} />);
    expect(container.textContent).toBe('Empty bank');
  });

  it('renders a single paragraph', () => {
    const { container } = render(<BankSummary items={makeItems()} />);
    expect(container.querySelectorAll('p')).toHaveLength(1);
    expect(container.children).toHaveLength(1);
  });
});
