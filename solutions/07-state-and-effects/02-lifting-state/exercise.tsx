// Reference solution for 07-02. Read it only AFTER your own version passes.
import { useState } from 'react';

export type ShopItem = {
  id: string;
  name: string;
  price: number;
  description: string;
};

export type ShopScreenProps = {
  initialGold: number;
  items: readonly ShopItem[];
};

export function ShopScreen({ initialGold, items }: ShopScreenProps) {
  // Minimal state: everything else is derived.
  const [gold, setGold] = useState(initialGold);
  const [ownedIds, setOwnedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const ownedItems = ownedIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is ShopItem => item !== undefined);
  const selected = items.find((item) => item.id === selectedId) ?? null;

  function handleBuy(item: ShopItem) {
    if (gold < item.price || ownedIds.includes(item.id)) return; // guard in the state owner
    setGold((g) => g - item.price);
    setOwnedIds((prev) => [...prev, item.id]);
  }

  function handleSell(item: ShopItem) {
    setGold((g) => g + Math.floor(item.price / 2));
    setOwnedIds((prev) => prev.filter((id) => id !== item.id));
  }

  return (
    <div>
      <GoldHeader gold={gold} />
      <ShopList items={items} gold={gold} ownedIds={ownedIds} onBuy={handleBuy} onSelect={setSelectedId} />
      <OwnedList items={ownedItems} onSell={handleSell} />
      <ItemDetails item={selected} isOwned={selected !== null && ownedIds.includes(selected.id)} />
    </div>
  );
}

function GoldHeader({ gold }: { gold: number }) {
  return (
    <header>
      <output aria-label="Gold">{gold}</output>
    </header>
  );
}

type ShopListProps = {
  items: readonly ShopItem[];
  gold: number;
  ownedIds: string[];
  onBuy: (item: ShopItem) => void;
  onSelect: (id: string) => void;
};

function ShopList({ items, gold, ownedIds, onBuy, onSelect }: ShopListProps) {
  return (
    <ul aria-label="Shop">
      {items.map((item) => {
        const owned = ownedIds.includes(item.id);
        return (
          <li key={item.id}>
            <button type="button" onClick={() => onSelect(item.id)}>
              {item.name}
            </button>
            <span>{item.price}g</span>
            <button
              type="button"
              aria-label={`Buy ${item.name}`}
              disabled={owned || gold < item.price}
              onClick={() => onBuy(item)}
            >
              {owned ? 'Owned' : 'Buy'}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function OwnedList({ items, onSell }: { items: ShopItem[]; onSell: (item: ShopItem) => void }) {
  if (items.length === 0) return <p>You don't own anything yet</p>;
  return (
    <ul aria-label="Your gear">
      {items.map((item) => (
        <li key={item.id}>
          {item.name}
          <button type="button" aria-label={`Sell ${item.name}`} onClick={() => onSell(item)}>
            Sell
          </button>
        </li>
      ))}
    </ul>
  );
}

function ItemDetails({ item, isOwned }: { item: ShopItem | null; isOwned: boolean }) {
  return (
    <section aria-label="Details">
      {item === null ? (
        <p>Select an item to see details</p>
      ) : (
        <>
          <h2>{item.name}</h2>
          <p>{item.description}</p>
          <p>{isOwned ? 'Owned' : 'Not owned'}</p>
        </>
      )}
    </section>
  );
}
