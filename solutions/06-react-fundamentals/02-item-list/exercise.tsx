// Reference solution for 06-02. Read it only AFTER your own version passes.

export type Item = {
  id: string;
  name: string;
  quantity: number;
};

export type ItemListProps = {
  items: readonly Item[];
  emptyMessage?: string;
  hideEmpty?: boolean;
};

export function ItemList({ items, emptyMessage = 'Nothing here yet', hideEmpty = false }: ItemListProps) {
  // Derive what to show during render: filter, then sort a COPY.
  const visible = items
    .filter((item) => !hideEmpty || item.quantity > 0)
    .toSorted((a, b) => a.name.localeCompare(b.name));

  if (visible.length === 0) {
    return <p>{emptyMessage}</p>;
  }

  return (
    <ul aria-label="Items">
      {visible.map((item) => (
        <li key={item.id}>
          {item.quantity > 0 ? `${item.name} ×${item.quantity}` : `${item.name} (out of stock)`}
        </li>
      ))}
    </ul>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function BankSummary({ items }: { items: readonly Item[] }) {
  if (items.length === 0) return <p>Empty bank</p>; // explicit check: no `0 &&` trap
  const total = items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <p>
      {plural(items.length, 'stack')} · {plural(total, 'item')}
    </p>
  );
}
