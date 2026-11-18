// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ShopScreen, type ShopItem } from './exercise';

const items: readonly ShopItem[] = [
  { id: 'bronze_axe', name: 'Bronze Axe', price: 50, description: 'Chops 5% faster.' },
  { id: 'iron_axe', name: 'Iron Axe', price: 120, description: 'Chops 10% faster.' },
  { id: 'fishing_rod', name: 'Fishing Rod', price: 75, description: 'Required to fish.' },
];

const gold = () => screen.getByRole('status', { name: 'Gold' });
const shop = () => screen.getByRole('list', { name: 'Shop' });
const gear = () => screen.queryByRole('list', { name: 'Your gear' });
const details = () => screen.getByRole('region', { name: 'Details' });
const buyButton = (name: string) => within(shop()).getByRole('button', { name: `Buy ${name}` });

describe('ShopScreen', () => {
  it('shows gold and the shop', () => {
    render(<ShopScreen initialGold={100} items={items} />);
    expect(gold()).toHaveTextContent('100');
    expect(within(shop()).getAllByRole('listitem')).toHaveLength(3);
    expect(within(shop()).getByText('120g')).toBeInTheDocument();
  });

  it('disables Buy when you cannot afford it', () => {
    render(<ShopScreen initialGold={100} items={items} />);
    expect(buyButton('Bronze Axe')).toBeEnabled();
    expect(buyButton('Iron Axe')).toBeDisabled();
    expect(buyButton('Iron Axe')).toHaveTextContent('Buy');
  });

  it('buying spends gold, marks the item Owned and adds it to your gear', async () => {
    render(<ShopScreen initialGold={200} items={items} />);
    expect(screen.getByText("You don't own anything yet")).toBeInTheDocument();
    expect(gear()).not.toBeInTheDocument();

    await userEvent.click(buyButton('Fishing Rod'));
    await userEvent.click(buyButton('Bronze Axe'));

    expect(gold()).toHaveTextContent('75');
    expect(buyButton('Fishing Rod')).toHaveTextContent('Owned');
    expect(buyButton('Fishing Rod')).toBeDisabled();
    const owned = within(gear()!).getAllByRole('listitem').map((li) => li.textContent);
    expect(owned).toEqual([expect.stringContaining('Fishing Rod'), expect.stringContaining('Bronze Axe')]);
  });

  it('updates affordability of other items after a purchase', async () => {
    render(<ShopScreen initialGold={130} items={items} />);
    expect(buyButton('Iron Axe')).toBeEnabled();
    await userEvent.click(buyButton('Fishing Rod'));
    expect(buyButton('Iron Axe')).toBeDisabled();
  });

  it('selling refunds half the price (rounded down) and removes it', async () => {
    const odd = [{ id: 'net', name: 'Net', price: 25, description: 'Catches shrimp.' }];
    render(<ShopScreen initialGold={25} items={odd} />);
    await userEvent.click(buyButton('Net'));
    expect(gold()).toHaveTextContent('0');
    await userEvent.click(within(gear()!).getByRole('button', { name: 'Sell Net' }));
    expect(gold()).toHaveTextContent('12');
    expect(gear()).not.toBeInTheDocument();
    expect(buyButton('Net')).toHaveTextContent('Buy');
  });

  it('shows details for the selected item', async () => {
    render(<ShopScreen initialGold={100} items={items} />);
    expect(within(details()).getByText('Select an item to see details')).toBeInTheDocument();
    await userEvent.click(within(shop()).getByRole('button', { name: 'Iron Axe' }));
    expect(within(details()).getByRole('heading', { name: 'Iron Axe' })).toBeInTheDocument();
    expect(within(details()).getByText('Chops 10% faster.')).toBeInTheDocument();
    expect(within(details()).getByText('Not owned')).toBeInTheDocument();
  });

  it('keeps the details panel in sync when you buy and sell the selected item', async () => {
    render(<ShopScreen initialGold={100} items={items} />);
    await userEvent.click(within(shop()).getByRole('button', { name: 'Bronze Axe' }));
    expect(within(details()).getByText('Not owned')).toBeInTheDocument();
    await userEvent.click(buyButton('Bronze Axe'));
    expect(within(details()).getByText('Owned')).toBeInTheDocument();
    await userEvent.click(within(gear()!).getByRole('button', { name: 'Sell Bronze Axe' }));
    expect(within(details()).getByText('Not owned')).toBeInTheDocument();
  });
});
