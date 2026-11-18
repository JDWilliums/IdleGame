// @vitest-environment jsdom
/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 12-02 · write-component-tests
 * Lesson:  12.3 Testing React components
 * Run:     npm run watch 12-02
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Write React Testing Library tests for <ShopItemCard> (./subject.tsx, which is
 * correct). Graded the same way as 12-01: your tests must pass against the real
 * component and FAIL against each of six hidden mutants. Write at least 6 tests.
 *
 * Rules of good component tests (lesson 12.3):
 *   - Query like a user: getByRole / getByLabelText / getByText, not class names.
 *   - Interact like a user: userEvent.type / click / clear.
 *   - Assert on what the user sees and on the callbacks that are called (with
 *     exact arguments AND types: 2 is not '2').
 *
 * Think about: affordability edge cases (exactly enough gold?), quantity limits,
 * the total updating, the out-of-stock state, and what onBuy receives.
 *
 * Delete the placeholder, then write your own.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ShopItemCard, type ShopItem } from './subject';

const axe: ShopItem = { id: 'bronze_axe', name: 'Bronze Axe', price: 50, stock: 5 };

describe('ShopItemCard', () => {
  it('placeholder: delete me and write real tests', () => {
    expect.fail('Write your tests, then delete this placeholder');
  });

  // An example to get you started:
  it('shows the item name as a heading', () => {
    render(<ShopItemCard item={axe} gold={100} onBuy={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Bronze Axe' })).toBeInTheDocument();
  });
});

// (userEvent is imported for you. You'll need it.)
void userEvent;
