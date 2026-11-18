# 08.4 · Immer

> ⏱ 1 hour · Module 08 · Managing Complex State

## What you'll learn
- How Immer lets you write "mutating" code that produces immutable updates
- `produce` and drafts
- Immer in reducers
- The rules and pitfalls
- When to use it

---

## The pain

Deep immutable updates are noisy:

```ts
return {
  ...state,
  skills: {
    ...state.skills,
    [skillId]: {
      ...state.skills[skillId],
      xp: state.skills[skillId].xp + amount,
      mastery: {
        ...state.skills[skillId].mastery,
        [actionId]: (state.skills[skillId].mastery[actionId] ?? 0) + 1,
      },
    },
  },
};
```

## Immer: mutate a draft, get a new state

```ts
import { produce } from 'immer';

const next = produce(state, (draft) => {
  draft.skills[skillId].xp += amount;
  draft.skills[skillId].mastery[actionId] = (draft.skills[skillId].mastery[actionId] ?? 0) + 1;
});
```

How it works:
1. Immer gives you a **draft**, a proxy that records every change you make to it.
2. When your function finishes, Immer builds the **next state**, copying only the objects along the changed paths. That's **structural sharing**, exactly as in lesson 01.1.
3. The original `state` is untouched, and the result is frozen in development so accidental mutation throws.

```ts
next === state;                               // false: something changed
next.bank === state.bank;                     // true: an unchanged branch is shared
next.skills[skillId] === state.skills[skillId];  // false: changed
```

If the recipe changes nothing, `produce` returns the **original** reference, so React skips the re-render.

## Immer in reducers

`produce` has a curried form that's perfect for reducers:

```ts
import { produce } from 'immer';

export const bankReducer = produce((draft: BankState, action: BankAction) => {
  switch (action.type) {
    case 'deposit':
      draft.items[action.itemId] = (draft.items[action.itemId] ?? 0) + action.quantity;
      break;
    case 'sell': {
      const have = draft.items[action.itemId] ?? 0;
      if (have < action.quantity) return;            // no changes → original state returned
      draft.items[action.itemId] = have - action.quantity;
      if (draft.items[action.itemId] === 0) delete draft.items[action.itemId];
      draft.gold += action.quantity * action.price;
      break;
    }
  }
});

const [state, dispatch] = useReducer(bankReducer, initialBank);
```

Array operations work naturally too: `draft.log.unshift(entry)`, `draft.log.splice(5)`, `draft.items.sort(...)`.

## The rules

1. **Either mutate the draft or return a new value, not both.**
   ```ts
   produce(state, (draft) => { draft.gold = 0; return { ...draft }; });   // ❌ error
   produce(state, () => initialState);                                   // ✅ replace entirely
   ```
   Watch out for arrow functions that return implicitly:
   ```ts
   produce(state, (draft) => draft.gold += 1);    // ❌ returns the number. Use braces
   produce(state, (draft) => { draft.gold += 1; }); // ✅
   ```
2. **Only draft plain objects and arrays** (and `Map`/`Set` with `enableMapSet()`). Class instances aren't drafted unless you mark them `immerable`.
3. **Don't let drafts escape.** Don't store a draft in a variable outside the recipe or pass it to async code. It's revoked when the recipe ends.
4. **Reading `draft.x` gives you a draft too.** Comparing `draft.items === something` may not behave as you expect. Use `original(draft)` or `current(draft)` if you need the real values.

## Performance

Immer adds a small overhead (proxies, freezing in dev). For a UI that's negligible. For a game loop running many complex updates per second on large state, it can matter. You'll measure in Module 14 and decide. A common approach is to use Immer for most reducers and hand-write the hottest update path.

## When to use Immer
- ✅ deeply nested state, reducers with many cases, teams where accidental mutation is a risk
- ✅ it's built into Redux Toolkit and available as Zustand middleware, so you'll meet it at work
- ⚠️ flat, simple state doesn't need it, because spreads are fine
- ⚠️ **learn manual immutable updates first** (you have!), so you understand what Immer does and can debug it

## Check your understanding

1. What does Immer's `produce` return if your recipe makes no changes?
2. What's wrong with `produce(state, (d) => d.count++)`?
3. After `const next = produce(state, (d) => { d.bank.trout = 1; })`, is `next.skills === state.skills`?
4. Why can't you `await` something inside a recipe and then keep editing the draft?

<details><summary>Answers</summary>

1. The original state object itself (the same reference).
2. The arrow function implicitly returns the result of `d.count++`, so it both mutates and returns a value. Immer throws. Wrap the body in braces.
3. Yes. Unchanged branches are shared (structural sharing).
4. The draft is finalised and revoked when the recipe returns, and an `await` ends the synchronous recipe. Async code needs to call `produce` again with the latest state.
</details>

## Further reading
- Immer docs: https://immerjs.github.io/immer/ ("Introduction", "Update patterns", "Pitfalls")
- react.dev: [Write concise update logic with Immer](https://react.dev/learn/updating-objects-in-state#write-concise-update-logic-with-immer)

---
[← Reducer + context](03-reducer-plus-context.md) · [Module overview](README.md) · [Next: External stores & Zustand →](05-external-stores-and-zustand.md)
