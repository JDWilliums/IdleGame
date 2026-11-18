# 07.2 · Structuring & lifting state

> ⏱ 2.5 hours · Module 07 · State & Effects

## What you'll learn
- Five principles for structuring state well
- Deriving values instead of storing them
- Storing ids instead of copies
- Lifting state up to share it between components
- Controlled vs uncontrolled components
- Keeping state as low as possible, for performance

---

## Five principles

Most React bugs that aren't closure bugs are **state structure** bugs. React's docs list these principles:

### 1. Group related state
If two values always change together, combine them:

```tsx
// ❌ always updated together, easy to forget one
const [x, setX] = useState(0);
const [y, setY] = useState(0);

// ✅
const [position, setPosition] = useState({ x: 0, y: 0 });
```

### 2. Avoid contradictions
If some combinations are impossible, don't make them representable. Use a **status** union (lesson 02.4):

```tsx
// ❌ isSaving && isSaved could both be true
const [isSaving, setIsSaving] = useState(false);
const [isSaved, setIsSaved] = useState(false);

// ✅
const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
```

### 3. Avoid redundant state: **derive it**
If you can compute it from props or other state **during render**, don't store it:

```tsx
// ❌ totalValue must be kept in sync manually, and WILL drift
const [items, setItems] = useState<Item[]>([]);
const [totalValue, setTotalValue] = useState(0);

// ✅ always correct, by construction
const [items, setItems] = useState<Item[]>([]);
const totalValue = items.reduce((sum, i) => sum + i.value * i.quantity, 0);
```

"But isn't recomputing every render slow?" Almost never: looping over a few hundred items takes microseconds. If it ever *is* slow, memoise it (`useMemo`, lesson 09.5). Correctness first.

Things you should almost always derive in your game: **level from XP**, **progress percentage**, **filtered/sorted lists**, **can-afford flags**, **totals**.

### 4. Avoid duplication: **store ids, not copies**

```tsx
// ❌ selectedItem is a COPY. When the item's quantity changes in `items`,
//    selectedItem still shows the old quantity.
const [items, setItems] = useState<Item[]>(initialItems);
const [selectedItem, setSelectedItem] = useState<Item | null>(null);

// ✅ store the id and derive the item
const [items, setItems] = useState<Item[]>(initialItems);
const [selectedId, setSelectedId] = useState<string | null>(null);
const selectedItem = items.find((i) => i.id === selectedId) ?? null;
```

This is the same idea as database normalisation (lesson 16.1): store each fact **once**.

### 5. Avoid deep nesting
Deeply nested state is painful to update immutably. Prefer **flat** structures keyed by id:

```tsx
// ❌ nested arrays: updating one item means mapping through several levels
type State = { categories: { id: string; items: { id: string; qty: number }[] }[] };

// ✅ flat, keyed by id (a "normalised" shape)
type State = {
  items: Record<string, { id: string; categoryId: string; qty: number }>;
  categoryIds: string[];
};
```

Your game state in Module 13 will look like this.

## Don't mirror props in state

```tsx
// ❌ `color` is initialised from the prop ONCE. Later prop changes are ignored.
function Badge({ color }: { color: string }) {
  const [c, setC] = useState(color);
  return <span style={{ color: c }} />;
}

// ✅ just use the prop
function Badge({ color }: { color: string }) {
  return <span style={{ color }} />;
}
```

Copying a prop into state only makes sense when you deliberately want to *ignore* later updates, and then you should name the prop to say so (`initialColor`, `defaultValue`).

## Lifting state up

When two components need the **same** state, move it to their **closest common parent** and pass it down. This is "lifting state up".

Example: a shop and a gold display both need to know the gold.

```
Before: each has its own gold. Buying in Shop doesn't update the Header.

   App
   ├── Header    [gold]  ✗
   └── Shop      [gold]  ✗

After: App owns gold and passes it down, and Shop asks App to change it.

   App [gold, setGold]
   ├── Header   ← gold
   └── Shop     ← gold, onBuy
```

```tsx
type ShopItem = { id: string; name: string; price: number };

function App() {
  const [gold, setGold] = useState(100);
  const [owned, setOwned] = useState<string[]>([]);

  function handleBuy(item: ShopItem) {
    if (gold < item.price) return;        // a guard in the state owner
    setGold((g) => g - item.price);
    setOwned((prev) => [...prev, item.id]);
  }

  return (
    <>
      <Header gold={gold} />
      <Shop gold={gold} owned={owned} onBuy={handleBuy} />
    </>
  );
}

function Shop({ gold, owned, onBuy }: { gold: number; owned: string[]; onBuy: (item: ShopItem) => void }) {
  return (
    <ul>
      {SHOP_ITEMS.map((item) => (
        <li key={item.id}>
          {item.name} ({item.price}g)
          <button
            type="button"
            disabled={gold < item.price || owned.includes(item.id)}
            onClick={() => onBuy(item)}
          >
            {owned.includes(item.id) ? 'Owned' : 'Buy'}
          </button>
        </li>
      ))}
    </ul>
  );
}
```

`Shop` is now a **controlled** component: its important data comes from props, and it reports intentions (`onBuy`) rather than changing things itself.

## Controlled vs uncontrolled components

- **Uncontrolled**: the component owns its state internally (like `Disclosure` in 06-03 owning `open`). It's easy to drop in, but the parent can't read or change that state.
- **Controlled**: the parent passes the value and a change handler as props. It's more flexible, and the parent is the single source of truth.

```tsx
// uncontrolled
<Disclosure title="Stats">…</Disclosure>

// controlled
const [open, setOpen] = useState(false);
<Disclosure title="Stats" open={open} onOpenChange={setOpen}>…</Disclosure>
```

Many component libraries support **both** (`defaultOpen` for uncontrolled, `open` + `onOpenChange` for controlled). The same applies to `<input>`: `value` + `onChange` is controlled, `defaultValue` is uncontrolled.

**Rule of thumb:** each piece of state should have exactly **one owner**. If two components each think they own it, you'll get sync bugs.

## Put state as low as possible

Lifting state up makes it shareable. But state that's higher than necessary means **more components re-render** when it changes (06.6). If only the search box uses `searchText`, keep it *in* the search box component (or the smallest component that needs it), not in `App`.

The balance: **lift state only as high as the components that need it.** In an idle game with fast-changing values (progress ticking ten times a second), this decision matters a lot, and lesson 14.3 builds on it.

## Check your understanding

1. You have `firstName`, `lastName` and `fullName` in state. Which one should go?
2. Why is storing `selectedItem` (an object) worse than `selectedItemId`?
3. A `Header` and a `Shop` both show gold. Where does `gold` state go?
4. What's the difference between a controlled and an uncontrolled input?
5. `function Panel({ initialOpen }) { const [open, setOpen] = useState(initialOpen); … }`. Is mirroring the prop OK here? Why?

<details><summary>Answers</summary>

1. `fullName`. Derive it during render.
2. The object is a copy that goes stale when the original item in the list changes. An id always resolves to the current item.
3. In their closest common parent (e.g. `App`), passed down as props, with a callback for changes.
4. A controlled input's value comes from React state via `value` and is updated through `onChange`. An uncontrolled input keeps its own value in the DOM (you can set `defaultValue` and read it with a ref or form data).
5. Yes. The name `initialOpen` makes it clear that later prop changes are deliberately ignored, and it's only the starting value.
</details>

## Further reading
- react.dev: [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure). Read it twice.
- react.dev: [Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)

**Practice:** exercise `07-02` lifting-state → `npm run watch 07-02`

---
[← State as a snapshot](01-state-as-a-snapshot.md) · [Module overview](README.md) · [Next: Refs →](03-refs.md)
