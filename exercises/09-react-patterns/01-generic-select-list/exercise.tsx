/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 09-01 · generic-select-list
 * Lessons: 09.1 Typing components · 09.2 Generic & polymorphic components
 * Run:     npm run watch 09-01
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Build a GENERIC, controlled, keyboard-accessible listbox. It's used for
 * choosing a fishing spot, an enemy or a recipe, so it has to work with any
 * item type, and its callbacks must be typed with that item type
 * (types.check.ts verifies this).
 *
 * <SelectList
 *   label="Fishing spot"
 *   items={spots}                    // T inferred from here
 *   getKey={(s) => s.id}             // (item: T) => string
 *   getLabel={(s) => s.name}         // (item: T) => string
 *   selected={spot}                  // T | null
 *   onSelect={setSpot}               // (item: T) => void
 * />
 *
 * Render:
 *   <div role="listbox" aria-label={label}>
 *     one <div role="option" aria-selected={…}> per item, text = getLabel(item)
 *
 * Behaviour:
 *   - Clicking an option calls onSelect(item).
 *   - "Roving tabindex": exactly ONE option has tabIndex 0 (the selected one, or
 *     the first if nothing is selected); all the others have tabIndex -1.
 *   - Keyboard, while an option has focus:
 *       ArrowDown / ArrowUp  select the next / previous item (stop at the ends)
 *       Home / End           select the first / last item
 *     …and move FOCUS to the newly selected option.
 *     preventDefault() these keys so the page doesn't scroll.
 *   - With no items, render <p>No options</p> instead of the listbox.
 */
import type { ReactNode } from 'react';

// TODO: make this generic and give every prop a precise type.
export type SelectListProps = {
  label: string;
  items: readonly unknown[];
  getKey: (item: unknown) => string;
  getLabel: (item: unknown) => string;
  selected: unknown;
  onSelect: (item: unknown) => void;
};

export function SelectList(props: SelectListProps): ReactNode {
  return null; // TODO
}
