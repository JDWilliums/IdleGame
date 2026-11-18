// Reference solution for 06-03. Read it only AFTER your own version passes.
import { useState, type ReactNode } from 'react';

export function GoldCounter({ initialGold = 0 }: { initialGold?: number }) {
  const [gold, setGold] = useState(initialGold);

  return (
    <div>
      <output aria-label="Gold">{gold}</output>
      <button type="button" onClick={() => setGold(gold + 1)}>
        +1
      </button>
      <button type="button" onClick={() => setGold(gold + 10)}>
        +10
      </button>
      <button type="button" onClick={() => setGold(gold - 25)} disabled={gold < 25}>
        Spend 25
      </button>
      <button type="button" onClick={() => setGold(initialGold)}>
        Reset
      </button>
    </div>
  );
}

export type ToggleProps = {
  label: string;
  defaultOn?: boolean;
  onChange?: (on: boolean) => void;
};

export function Toggle({ label, defaultOn = false, onChange }: ToggleProps) {
  const [on, setOn] = useState(defaultOn);

  function handleClick() {
    const next = !on; // compute the new value once and use it for both
    setOn(next);
    onChange?.(next);
  }

  return (
    <button type="button" role="switch" aria-checked={on} onClick={handleClick}>
      {label}
    </button>
  );
}

export function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
        {title}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}
