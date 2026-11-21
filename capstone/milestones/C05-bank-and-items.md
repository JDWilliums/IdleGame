# C05 · Bank & items

> ⏱ ~10 hours · Lessons: 08, 09.1–09.3, 10.1, 10.2, 13.9, 21.2 · Course exercises to reuse: 09-01, 09-03, 12-02, 13-07

## Why
The bank is where players see the result of their effort and make economic decisions. It's also a classic UI engineering problem: a list that must sort, filter, search, open details and confirm destructive actions, accessibly, at phone size.

## User stories

### US-1 · See what I have
*As a player, I want to see all my items, their quantities and their value.*

**Acceptance criteria**
- [ ] The bank shows every item with its icon, name, quantity (formatted with 13-07, with a full-value accessible label) and total value.
- [ ] "Slots used / total" is always visible, and highlighted when nearly full (≥ 90%, with text, not colour alone).
- [ ] Total bank value is shown.
- [ ] An empty bank shows a friendly hint ("Start chopping some trees!").

### US-2 · Find things
*As a player with a full bank, I want to sort, filter and search.*

**Acceptance criteria**
- [ ] Sort by category (the default), name, quantity or value. Filter by category. Search by name.
- [ ] The sort, filter and search live **in the URL** (`/bank?sort=value&category=ores&q=iron`), so they survive a reload and the back button (10.1, 19.3).
- [ ] Sorting and filtering are **pure functions**, unit-tested.

### US-3 · Item details
*As a player, I want to know what an item is for.*

**Acceptance criteria**
- [ ] Tapping or clicking an item opens a details view: description, sell price, quantity, **"Made by"** (which actions produce it) and **"Used in"** (which recipes consume it), all derived from the game data.
- [ ] On desktop, hovering shows a quick tooltip. The details view is still available by click or keyboard (21.2: no hover-only information).

### US-4 · Sell
*As a player, I want to sell items for gold, without accidents.*

**Acceptance criteria**
- [ ] Sell **one**, a **chosen quantity** (a quantity input in the style of 12-02, clamped to what you own) or **all**.
- [ ] Selling all of an item worth over 1,000 gold asks for confirmation in an accessible modal (09-03: focus moves in, Escape closes, focus returns).
- [ ] The engine's `sellItem(state, itemId, qty)` is pure and tested: it can't sell more than you have, it removes the item (and frees its slot) at zero, and it adds the gold.
- [ ] A short "Sold 40 Oak Logs for 40 gold" confirmation appears.

### US-5 · The bank is full
*As a player, I want to understand why my action stopped.*

**Acceptance criteria**
- [ ] When the engine stops an action with `bankFull` (C02), a clear banner explains it, with buttons to go to the bank and (later) the shop.
- [ ] The event is announced (21.4).

## Tests to write
- Engine: `sellItem` edge cases (zero, more than owned, the last item frees a slot).
- Pure: sort and filter functions, including ties (a stable order by name).
- Components: changing the sort updates the URL; the quantity input clamps; the confirmation dialog appears for a valuable sell-all; focus returns to the trigger after closing.
- Selectors: "made by" and "used in" from data.

## Hints (directions, not code)
- Keep the bank's **view state** (sort, filter, search) in the URL with `useSearchParams`, and its **data** in the game store. The visible list is derived from both. Don't store a sorted copy anywhere.
- 300 items is not a lot. Don't virtualise unless a measurement says you must (21.3).
- A generic `ConfirmDialog` built on `<dialog>` (21.4) will be reused in the shop, the Hearth and account deletion.

## Lessons to revisit
07.5 (derive, don't store) · 09.3 (composition) · 10.1 (search params) · 10.2 (forms) · 13.9 · 21.4 (dialogs)

## Stretch goals
- Lock an item so "sell all" skips it.
- A "sell all junk" action for a category, with a confirmation that lists what will be sold.

## Demo
A screenshot of the bank filtered to ores on a phone, and of the details view.

---
[← C04](C04-skills-ui.md) · [Capstone overview](../README.md) · [Next: C06 · Processing skills →](C06-processing-skills.md)
