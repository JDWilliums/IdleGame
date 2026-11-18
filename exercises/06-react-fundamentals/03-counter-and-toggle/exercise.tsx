/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 06-03 · counter-and-toggle
 * Lesson:  06.5 Events & state
 * Run:     npm run watch 06-03
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Three small stateful components.
 *
 * TASK 1 · GoldCounter({ initialGold = 0 })
 *   - Shows the gold in an <output aria-label="Gold">{gold}</output>
 *   - Buttons: "+1", "+10", "Spend 25" and "Reset"
 *   - "Spend 25" subtracts 25 and is DISABLED while gold < 25
 *   - "Reset" goes back to initialGold
 *
 * TASK 2 · Toggle({ label, defaultOn = false, onChange })
 *   An accessible switch:
 *     <button type="button" role="switch" aria-checked={on}>{label}</button>
 *   Clicking flips it and calls onChange(newValue) (if onChange was given)
 *   with the NEW value.
 *
 * TASK 3 · Disclosure({ title, children })
 *   A show/hide section:
 *     <button type="button" aria-expanded={open}>{title}</button>
 *   Children are rendered ONLY while open (not just hidden with CSS).
 *   Starts closed.
 *
 * Each component instance must keep its own independent state.
 */
import type { ReactNode } from 'react';

export function GoldCounter({ initialGold = 0 }: { initialGold?: number }) {
  return null; // TODO
}

export type ToggleProps = {
  label: string;
  defaultOn?: boolean;
  onChange?: (on: boolean) => void;
};

export function Toggle(props: ToggleProps) {
  return null; // TODO
}

export function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  return null; // TODO
}
