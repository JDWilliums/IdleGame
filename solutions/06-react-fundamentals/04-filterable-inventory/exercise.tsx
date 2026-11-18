// Reference solution for 06-04. Read it only AFTER your own version passes.
import { useState } from 'react';

export type Category = 'wood' | 'fish' | 'ore';

export type InventoryItem = {
  id: string;
  name: string;
  category: Category;
  quantity: number;
};

type CategoryFilter = Category | 'all';
type SortKey = 'name' | 'quantity';

const CATEGORY_OPTIONS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'wood', label: 'Wood' },
  { value: 'fish', label: 'Fish' },
  { value: 'ore', label: 'Ore' },
];

export function Inventory({ items }: { items: readonly InventoryItem[] }) {
  // The minimal state: only what the user chose.
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [sort, setSort] = useState<SortKey>('name');

  // Everything else is DERIVED during render: no extra state, no effects.
  const query = search.trim().toLowerCase();
  const visible = items
    .filter((item) => category === 'all' || item.category === category)
    .filter((item) => item.name.toLowerCase().includes(query))
    .toSorted((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : b.quantity - a.quantity));

  function clearFilters() {
    setSearch('');
    setCategory('all');
  }

  return (
    <section>
      <label>
        Search
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>

      <label>
        Category
        <select
          value={category}
          // A <select>'s value is always a string; we only render valid options, so the cast is safe.
          onChange={(e) => setCategory(e.target.value as CategoryFilter)}
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Sort by
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="name">Name</option>
          <option value="quantity">Quantity</option>
        </select>
      </label>

      <p>
        Showing {visible.length} of {items.length} items
      </p>

      {visible.length > 0 ? (
        <ul aria-label="Inventory">
          {visible.map((item) => (
            <li key={item.id}>
              {item.name} ×{item.quantity}
            </li>
          ))}
        </ul>
      ) : (
        <>
          <p>No items match your filters</p>
          <button type="button" onClick={clearFilters}>
            Clear filters
          </button>
        </>
      )}
    </section>
  );
}
