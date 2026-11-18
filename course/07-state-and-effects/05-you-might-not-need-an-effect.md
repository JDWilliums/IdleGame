# 07.5 · You might not need an effect

> ⏱ 2 hours · Module 07 · State & Effects

## What you'll learn
- The most common **unnecessary** effects, and what to write instead
- Deriving data during render
- Resetting state with `key`
- Putting event-specific logic in event handlers
- Notifying parents without effects
- A decision checklist

---

Effects are for synchronising with **external systems**. Many beginners (and plenty of experienced developers) use them for things that don't involve any external system. Those effects make code slower (an extra render), more complex, and buggy (out-of-sync states, loops). Learn to spot them, because removing them is one of the best code review comments you can give.

## 1. Transforming data for rendering → compute it during render

```tsx
// ❌ an extra state and an extra render, and briefly stale
const [items, setItems] = useState<Item[]>([]);
const [visibleItems, setVisibleItems] = useState<Item[]>([]);
useEffect(() => {
  setVisibleItems(items.filter((i) => i.quantity > 0));
}, [items]);

// ✅ derive
const visibleItems = items.filter((i) => i.quantity > 0);
```

What happens with the effect version: render with the stale `visibleItems` → commit → effect runs → `setVisibleItems` → **render again**. That's twice the work, and the screen briefly shows old data.

If the computation is genuinely expensive (measure first!), cache it:

```tsx
const sorted = useMemo(() => expensiveSort(items, sortKey), [items, sortKey]);
```

(Lesson 09.5 covers `useMemo`. The React Compiler can do this automatically.)

## 2. Resetting all state when a prop changes → use `key`

```tsx
// ❌ resets after a render showing the OLD player's draft
function ProfileEditor({ playerId }: { playerId: string }) {
  const [draftName, setDraftName] = useState('');
  useEffect(() => { setDraftName(''); }, [playerId]);
  …
}

// ✅ a different key means a fresh component with fresh state (lesson 06.6)
<ProfileEditor key={playerId} playerId={playerId} />
```

## 3. Adjusting *some* state when a prop changes → derive it, or store something else

```tsx
// ❌ effect to clear the selection when the list changes
useEffect(() => { setSelectedId(null); }, [items]);

// ✅ store the id, and derive whether it's still valid
const selected = items.find((i) => i.id === selectedId) ?? null;   // just becomes null if removed
```

Usually the cleanest fix is to restructure state so no adjustment is needed (lesson 07.2).

## 4. Logic caused by a user action → put it in the event handler

```tsx
// ❌ "when the item gets bought, show a toast" as an effect
const [lastBought, setLastBought] = useState<Item | null>(null);
useEffect(() => {
  if (lastBought) showToast(`Bought ${lastBought.name}!`);
}, [lastBought]);
// Bugs: it re-fires on remount, it won't fire if you buy the same item twice, etc.

// ✅ the toast happens BECAUSE the user clicked, so do it in the click handler
function handleBuy(item: Item) {
  buy(item);
  showToast(`Bought ${item.name}!`);
}
```

The question to ask: **"Why does this code run?"**
- *Because the user did something* → event handler.
- *Because the component is displayed and must stay in sync with something external* → effect.

## 5. Chains of effects → calculate in one place

```tsx
// ❌ effect A sets state that triggers effect B that sets state that triggers effect C…
useEffect(() => { if (xp >= nextLevelXp) setLevel((l) => l + 1); }, [xp]);
useEffect(() => { if (level === 10) setUnlocked((u) => [...u, 'willow_tree']); }, [level]);
useEffect(() => { if (unlocked.includes('willow_tree')) setShowToast(true); }, [unlocked]);
```

Each link is an extra render, and the logic is scattered and fragile. Instead:
- **derive** whatever you can (the level comes from XP, and unlocks come from the level),
- do the rest in **one place**: the event handler, or a **reducer** (Module 08), or, for your game, the pure **engine tick** (Module 13).

```tsx
const level = levelFromXp(xp);                            // derived
const unlocked = TREES.filter((t) => t.requiredLevel <= level);  // derived
```

## 6. Notifying a parent about a state change → call it in the handler

```tsx
// ❌ the parent hears about the change one render late
function Toggle({ onChange }: { onChange: (on: boolean) => void }) {
  const [on, setOn] = useState(false);
  useEffect(() => { onChange(on); }, [on, onChange]);
  return <button onClick={() => setOn(!on)} />;
}

// ✅ update both in the same event (you did this in exercise 06-03)
function handleClick() {
  const next = !on;
  setOn(next);
  onChange(next);
}
```

Or make the component **controlled** and let the parent own the state entirely (07.2).

## 7. Initialising the app → module scope or a guarded call

```tsx
// ⚠️ runs twice in development (StrictMode), and again on remount
useEffect(() => { loadAnalytics(); }, []);

// ✅ code that should run once per app load can live outside components
if (typeof window !== 'undefined') {
  loadAnalytics();
}
```

## When you DO need an effect

- subscribing to browser events (`resize`, `visibilitychange`, `online`/`offline`, `storage`)
- timers that run **while** something is displayed or active
- syncing with `document.title`, or with a non-React widget (a chart, a map, a canvas)
- **writing** to `localStorage` when state changes (lesson 07.7)
- data fetching (but prefer a library, lesson 10.4)
- WebSockets and other connections

## The checklist

Before writing `useEffect`, ask:

1. **Can I compute this from props/state during render?** → derive it.
2. **Does this happen because of a user action?** → event handler.
3. **Do I want to reset state when an identity changes?** → `key`.
4. **Am I syncing with something outside React?** → effect ✅.

## Check your understanding

For each, say whether you need an effect, and if not, what to use instead:

1. Show `"Level 15 reached!"` when a skill's XP crosses the threshold during the game loop.
2. Keep `document.title` showing current gold.
3. Compute `totalBankValue` from `items`.
4. When `selectedSkillId` changes, reset the "XP calculator" form inside the skill detail panel.
5. When the user clicks "Sell all", show a confirmation toast.
6. Start an interval while `activeAction` isn't null.

<details><summary>Answers</summary>

1. No effect. Detect the level-up where the XP is added (the engine tick or reducer) and emit a notification there. The level itself is derived.
2. Effect. `document.title` is an external system.
3. No effect. Derive it during render (use `useMemo` if it's measurably slow).
4. No effect. `key={selectedSkillId}` on the panel or form.
5. No effect. Do it in the click handler.
6. Effect. A timer is an external system that should run while the action is active, with cleanup that clears it.
</details>

## Further reading
- react.dev: [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect). One of the most important pages in the React docs, so read every example.
- react.dev: [Separating Events from Effects](https://react.dev/learn/separating-events-from-effects)

---
[← Effects & synchronization](04-effects-and-synchronization.md) · [Module overview](README.md) · [Next: Timers & stale closures →](06-timers-and-stale-closures.md)
