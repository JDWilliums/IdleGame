// @vitest-environment jsdom
// Reference solution for 12-02. Read it only AFTER your own version passes.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ShopItemCard, type ShopItem } from './subject';

const axe: ShopItem = { id: 'bronze_axe', name: 'Bronze Axe', price: 50, stock: 5 };

function setup(props: { item?: ShopItem; gold?: number } = {}) {
  const onBuy = vi.fn();
  render(<ShopItemCard item={props.item ?? axe} gold={props.gold ?? 1000} onBuy={onBuy} />);
  return {
    onBuy,
    buy: () => screen.getByRole('button', { name: 'Buy' }),
    quantity: () => screen.getByRole('spinbutton', { name: 'Quantity' }),
  };
}

async function setQuantity(input: HTMLElement, value: string) {
  await userEvent.clear(input);
  await userEvent.type(input, value);
}

describe('ShopItemCard', () => {
  it('shows the name, unit price and a total for one item', () => {
    setup();
    expect(screen.getByRole('article', { name: 'Bronze Axe' })).toBeInTheDocument();
    expect(screen.getByText('50g each')).toBeInTheDocument();
    expect(screen.getByText('Total: 50g')).toBeInTheDocument();
  });

  it('updates the total when the quantity changes', async () => {
    const { quantity } = setup();
    await setQuantity(quantity(), '3');
    expect(screen.getByText('Total: 150g')).toBeInTheDocument();
  });

  it('calls onBuy with the quantity as a number', async () => {
    const { onBuy, buy, quantity } = setup();
    await setQuantity(quantity(), '2');
    await userEvent.click(buy());
    expect(onBuy).toHaveBeenCalledTimes(1);
    expect(onBuy).toHaveBeenCalledWith(2);
    expect(typeof onBuy.mock.calls[0]?.[0]).toBe('number');
  });

  it('clamps the quantity to the available stock', async () => {
    const { quantity } = setup();
    await setQuantity(quantity(), '99');
    expect(screen.getByText('Total: 250g')).toBeInTheDocument();
    await userEvent.tab(); // leaving the box tidies it up
    expect(quantity()).toHaveValue(5);
  });

  it('disables Buy and explains when you cannot afford it', async () => {
    const { onBuy, buy } = setup({ gold: 30 });
    expect(buy()).toBeDisabled();
    expect(screen.getByText('You need 20 more gold')).toBeInTheDocument();
    await userEvent.click(buy());
    expect(onBuy).not.toHaveBeenCalled();
  });

  it('re-checks affordability for larger quantities', async () => {
    const { buy, quantity } = setup({ gold: 120 });
    expect(buy()).toBeEnabled();
    await setQuantity(quantity(), '3');
    expect(buy()).toBeDisabled();
    expect(screen.getByText('You need 30 more gold')).toBeInTheDocument();
  });

  it('allows buying with exactly enough gold', async () => {
    const { onBuy, buy } = setup({ gold: 50 });
    expect(buy()).toBeEnabled();
    expect(screen.queryByText(/more gold/)).not.toBeInTheDocument();
    await userEvent.click(buy());
    expect(onBuy).toHaveBeenCalledWith(1);
  });

  it('shows an out-of-stock state with no quantity input', () => {
    const { buy } = setup({ item: { ...axe, stock: 0 } });
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(buy()).toBeDisabled();
  });
});
