/**
 * The component under test for exercise 12-02. It's CORRECT, so don't change it.
 *
 * <ShopItemCard item={item} gold={gold} onBuy={(quantity) => …} />
 *
 * - An <article> named after the item (its <h3>), with "{price}g each".
 * - When the item is in stock:
 *     a "Quantity" number input (starts at 1). The quantity used is the typed
 *       value clamped to 1..stock (an empty or invalid box counts as 1), and the
 *       box is tidied up to that clamped number when it loses focus.
 *     "Total: {price × quantity}g",
 *     a "Buy" button that calls onBuy(quantity) with a NUMBER.
 *     If you can't afford the total, the button is disabled and the card
 *     says "You need {missing} more gold". Having EXACTLY enough gold is fine.
 * - When stock is 0: "Out of stock", no quantity input, and a disabled Buy button.
 */
import { useId, useState } from 'react';

export type ShopItem = { id: string; name: string; price: number; stock: number };

export type ShopItemCardProps = {
  item: ShopItem;
  gold: number;
  onBuy: (quantity: number) => void;
};

const mutant = (name: string) => process.env.COURSE_MUTANT === name;

export function ShopItemCard({ item, gold, onBuy }: ShopItemCardProps) {
  const headingId = useId();
  const [raw, setRaw] = useState('1'); // what's in the box, which may be mid-edit

  const typed = Math.floor(Number(raw));
  const valid = raw.trim() !== '' && Number.isFinite(typed);
  const clamp = (n: number) => (mutant('noClamp') ? Math.max(1, n) : Math.min(item.stock, Math.max(1, n)));
  const quantity = valid ? clamp(typed) : 1; // derived, never stored separately

  const inStock = mutant('outOfStockMissing') ? true : item.stock > 0;
  const total = mutant('staleTotal') ? item.price : item.price * quantity;
  const canAfford = mutant('offByOneAfford') ? gold > total : gold >= total;
  const disabled = !inStock || (mutant('noDisable') ? false : !canAfford);

  return (
    <article aria-labelledby={headingId}>
      <h3 id={headingId}>{item.name}</h3>
      <p>{item.price}g each</p>

      {inStock ? (
        <>
          <label>
            Quantity
            <input
              type="number"
              min={1}
              max={item.stock}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              onBlur={() => setRaw(String(quantity))}
            />
          </label>
          <p>Total: {total}g</p>
          {!canAfford && <p>You need {total - gold} more gold</p>}
        </>
      ) : (
        <p>Out of stock</p>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => onBuy((mutant('stringQty') ? String(quantity) : quantity) as number)}
      >
        Buy
      </button>
    </article>
  );
}

// The mutant names, for the grader. (Reading the code above tells you what each
// one breaks. Try writing your tests before looking.)
export const MUTANT_NAMES = ['noDisable', 'stringQty', 'staleTotal', 'noClamp', 'outOfStockMissing', 'offByOneAfford'];
