// Reference solution for 01-03. Read it only AFTER your own version passes.

export type Category = 'wood' | 'fish' | 'ore' | 'bar';

export type Item = {
  id: string;
  name: string;
  category: Category;
  value: number;
  quantity: number;
};

export type Summary = {
  totalQuantity: number;
  categories: Category[];
  mostValuable: string | null;
};

const stackValue = (item: Item) => item.value * item.quantity;

export function totalValue(items: readonly Item[]): number {
  return items.reduce((sum, item) => sum + stackValue(item), 0);
}

export function inStock(items: readonly Item[]): Item[] {
  return items.filter((item) => item.quantity > 0);
}

export function toLookup(items: readonly Item[]): Record<string, Item> {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

export function groupByCategory(items: readonly Item[]): Partial<Record<Category, Item[]>> {
  // Built-in since ES2024. The reduce version is a great interview exercise:
  //   items.reduce((acc, i) => { (acc[i.category] ??= []).push(i); return acc; }, {})
  return Object.groupBy(items, (item) => item.category);
}

export function topByValue(items: readonly Item[], n: number): Item[] {
  return inStock(items)
    .toSorted((a, b) => stackValue(b) - stackValue(a) || a.name.localeCompare(b.name))
    .slice(0, n);
}

export function summarize(items: readonly Item[]): Summary {
  const [top] = topByValue(items, 1);
  return {
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    categories: [...new Set(items.map((item) => item.category))].toSorted(),
    mostValuable: top && stackValue(top) > 0 ? top.name : null,
  };
}
