// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Inventory, type InventoryItem } from './exercise';

const items: readonly InventoryItem[] = Object.freeze([
  { id: 'willow_log', name: 'Willow Log', category: 'wood', quantity: 4 },
  { id: 'trout', name: 'Trout', category: 'fish', quantity: 12 },
  { id: 'oak_log', name: 'Oak Log', category: 'wood', quantity: 30 },
  { id: 'copper_ore', name: 'Copper Ore', category: 'ore', quantity: 7 },
  { id: 'shrimp', name: 'Shrimp', category: 'fish', quantity: 50 },
] satisfies InventoryItem[]);

const rows = () =>
  within(screen.getByRole('list', { name: 'Inventory' }))
    .getAllByRole('listitem')
    .map((li) => li.textContent);

describe('Inventory', () => {
  it('shows every item sorted by name, with a count', () => {
    render(<Inventory items={items} />);
    expect(rows()).toEqual(['Copper Ore ×7', 'Oak Log ×30', 'Shrimp ×50', 'Trout ×12', 'Willow Log ×4']);
    expect(screen.getByText('Showing 5 of 5 items')).toBeInTheDocument();
  });

  it('has labelled controls', () => {
    render(<Inventory items={items} />);
    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue('all');
    expect(screen.getByRole('combobox', { name: 'Sort by' })).toHaveValue('name');
  });

  it('filters by search text, case-insensitively', async () => {
    render(<Inventory items={items} />);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search' }), 'LOG');
    expect(rows()).toEqual(['Oak Log ×30', 'Willow Log ×4']);
    expect(screen.getByText('Showing 2 of 5 items')).toBeInTheDocument();
  });

  it('filters by category', async () => {
    render(<Inventory items={items} />);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Category' }), 'fish');
    expect(rows()).toEqual(['Shrimp ×50', 'Trout ×12']);
  });

  it('combines search and category', async () => {
    render(<Inventory items={items} />);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Category' }), 'wood');
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search' }), 'oak');
    expect(rows()).toEqual(['Oak Log ×30']);
    expect(screen.getByText('Showing 1 of 5 items')).toBeInTheDocument();
  });

  it('sorts by quantity, highest first', async () => {
    render(<Inventory items={items} />);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Sort by' }), 'quantity');
    expect(rows()).toEqual(['Shrimp ×50', 'Oak Log ×30', 'Trout ×12', 'Copper Ore ×7', 'Willow Log ×4']);
  });

  it('shows an empty state with a Clear filters button', async () => {
    render(<Inventory items={items} />);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Sort by' }), 'quantity');
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Category' }), 'ore');
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search' }), 'dragon');

    expect(screen.queryByRole('list', { name: 'Inventory' })).not.toBeInTheDocument();
    expect(screen.getByText('No items match your filters')).toBeInTheDocument();
    expect(screen.getByText('Showing 0 of 5 items')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('');
    expect(screen.getByRole('combobox', { name: 'Category' })).toHaveValue('all');
    expect(screen.getByRole('combobox', { name: 'Sort by' })).toHaveValue('quantity'); // sort kept
    expect(rows()).toHaveLength(5);
  });

  it('does not show Clear filters when items match', () => {
    render(<Inventory items={items} />);
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument();
  });
});
