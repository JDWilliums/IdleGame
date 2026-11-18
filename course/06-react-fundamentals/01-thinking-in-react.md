# 06.1 · Thinking in React

> ⏱ 75 min · Module 06 · React Fundamentals

## What you'll learn
- The problem React solves, shown by comparing it with your vanilla DOM code
- Declarative vs imperative UI
- "UI = f(state)": the one idea React is built on
- Components and one-way data flow
- The five-step "Thinking in React" process, applied to your game's skill screen

---

## The problem: keeping the DOM in sync

In exercise 03-03 you wrote `renderBank`. Now imagine the full game screen: gold in the header, the bank grid, the active action's progress, the skill levels, a notification badge. When one item is sold, *many* parts of the screen must change. With the DOM API you must:

1. remember **every** place that shows that data,
2. update each one **correctly**, in the right order,
3. never forget one, and never leave stale listeners behind.

This is **imperative** UI: you write the *steps* to get from the old screen to the new screen. Every new feature multiplies the number of possible transitions. Most bugs in old jQuery apps came from this: the UI drifting out of sync with the data.

## React's idea: describe, don't instruct

React lets you write **declarative** UI: you describe *what the screen should look like for the current data*, and React works out the steps.

```tsx
// Imperative (vanilla): HOW to change the screen
goldEl.textContent = String(gold);
if (gold >= 100) buyButton.removeAttribute('disabled');
else buyButton.setAttribute('disabled', '');

// Declarative (React): WHAT the screen is, for any value of gold
function Shop({ gold }: { gold: number }) {
  return (
    <div>
      <span>{gold} gold</span>
      <button disabled={gold < 100}>Buy axe</button>
    </div>
  );
}
```

The React version has no "previous state" to think about. It's the same description whether gold just went up, went down or loaded from a save.

## UI = f(state)

This is the core of React:

```
        state (data)  ──►  your components (functions)  ──►  UI description
                                                               │
                              React compares with the previous one and
                              applies the minimal DOM changes  ▼
                                                             screen
```

- **State** is the data that changes over time: gold, inventory, the active action.
- A **component** is a function from data to UI.
- When state changes, React **calls your components again** (it *re-renders*), compares the new description with the old one, and updates only what changed in the real DOM.

You never touch the DOM directly. **You change state, and React changes the screen.** If you remember one sentence from this module, make it that one.

## Components

A component is a reusable piece of UI: a function that returns JSX.

```tsx
function GoldDisplay({ gold }: { gold: number }) {
  return <span className="gold">🪙 {gold.toLocaleString()}</span>;
}
```

Apps are **trees** of components:

```
App
├── Header
│   ├── GoldDisplay
│   └── SettingsButton
├── Sidebar / TabBar
└── SkillsPage
    ├── ActiveActionPanel
    │   └── ProgressBar
    └── SkillGrid
        └── SkillCard × 6
            └── ProgressBar
```

## One-way data flow

Data flows **down** the tree through **props** (like function arguments). A child can't reach up and change its parent's data. Instead, the parent passes down a **function** the child can call:

```
         App  (owns `gold` state)
        /    \
 gold ↓        ↓ gold, onBuy
GoldDisplay   Shop  ── calls onBuy() ──► App updates gold ──► both re-render
```

This one-directional flow makes apps predictable: to find out why something shows a value, you follow the props upwards to where the state lives.

## The "Thinking in React" process

The React docs describe five steps for building any UI. Let's apply them to your game's **Skills screen**.

### Step 1: Break the UI into a component hierarchy
Draw boxes around every part of the design (you did this in project P1!). Each component should ideally do **one thing**. If it grows, split it.

### Step 2: Build a static version first
Render the UI from hard-coded data with **no state at all**. Data comes in through props only. This is mostly typing, and it gets the structure right before any logic.

```tsx
const skills = [
  { id: 'woodcutting', name: 'Woodcutting', icon: '🪓', level: 12, xp: 1540, xpForNext: 1800 },
  { id: 'fishing', name: 'Fishing', icon: '🎣', level: 5, xp: 380, xpForNext: 512 },
];

function SkillGrid() {
  return (
    <ul className="skill-grid">
      {skills.map((skill) => (
        <li key={skill.id}><SkillCard skill={skill} /></li>
      ))}
    </ul>
  );
}
```

### Step 3: Find the minimal state
Ask of each piece of data:
- Does it **stay the same** over time? → not state (it's a constant or a prop).
- Is it **passed in** from a parent? → not state (it's a prop).
- Can you **compute it** from other state or props? → **not state** (derive it during render).

Whatever's left is state. For the Skills screen: each skill's **xp** and the **active action** are state. The **level** is *not*, because it can be computed from xp (lesson 13.6). The **progress percentage** isn't either, because it's computed from xp and the next level's threshold.

> ⚠️ Storing values that can be derived is the most common React design mistake, because the copies get out of sync. Lesson 07.2 goes deep on this.

### Step 4: Decide where state lives
For each piece of state, find **every** component that uses it, then put the state in their **closest common parent**. `activeAction` is needed by `ActiveActionPanel` *and* by `SkillCard` (to highlight the active one), so it lives in `SkillsPage` (or higher).

### Step 5: Add inverse data flow
Children trigger changes by calling **callbacks passed down as props**: `SkillCard` gets an `onSelect` prop and calls it when tapped. `SkillsPage` handles it by updating its state.

## What React is not

React handles **rendering UI from state**. It doesn't handle routing, data fetching, forms, styling or global state management by itself, which is why you'll pick tools for those (Modules 08–11). And it doesn't decide how to *run a game loop*: in Module 14 you'll keep the engine *outside* React and let React render its state.

## Check your understanding

1. In your own words, what's the difference between imperative and declarative UI?
2. A skill's level can be computed from its XP. Should `level` be state? Why or why not?
3. Two sibling components both need `activeAction`. Where should that state live?
4. How does a child component cause its parent's state to change?

<details><summary>Answers</summary>

1. Imperative UI is writing the steps that change the screen from one state to another. Declarative UI is describing what the screen should be for the current data and letting the library work out the changes.
2. No. It can be derived from XP during render. Storing it separately risks the two disagreeing.
3. In their closest common parent, which passes it down to both as props.
4. The parent passes a callback function down as a prop, the child calls it, and the parent updates its own state inside that callback.
</details>

## Further reading
- react.dev: [Thinking in React](https://react.dev/learn/thinking-in-react). Read it now, it's short and excellent.
- react.dev: [Quick Start](https://react.dev/learn)

---
[Module overview](README.md) · [Next: JSX & components →](02-jsx-and-components.md)
