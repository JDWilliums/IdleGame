// Reference solution for 09-01. Read it only AFTER your own version passes.
import { useRef, type KeyboardEvent, type ReactNode } from 'react';

export type SelectListProps<T> = {
  label: string;
  items: readonly T[];
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  selected: T | null;
  onSelect: (item: T) => void;
};

export function SelectList<T>({ label, items, getKey, getLabel, selected, onSelect }: SelectListProps<T>): ReactNode {
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);

  if (items.length === 0) return <p>No options</p>;

  const selectedKey = selected === null ? null : getKey(selected);
  const selectedIndex = items.findIndex((item) => getKey(item) === selectedKey);
  const focusableIndex = selectedIndex === -1 ? 0 : selectedIndex;

  function selectIndex(index: number) {
    const item = items[index];
    if (item === undefined) return;
    onSelect(item);
    optionRefs.current[index]?.focus(); // focus follows selection
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>, index: number) {
    const last = items.length - 1;
    const targets: Record<string, number> = {
      ArrowDown: Math.min(index + 1, last),
      ArrowUp: Math.max(index - 1, 0),
      Home: 0,
      End: last,
    };
    const next = targets[event.key];
    if (next === undefined) return;
    event.preventDefault(); // stop the page scrolling
    selectIndex(next);
  }

  return (
    <div role="listbox" aria-label={label}>
      {items.map((item, index) => {
        const key = getKey(item);
        return (
          <div
            key={key}
            ref={(node) => {
              optionRefs.current[index] = node;
            }}
            role="option"
            aria-selected={key === selectedKey}
            tabIndex={index === focusableIndex ? 0 : -1}
            onClick={() => selectIndex(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {getLabel(item)}
          </div>
        );
      })}
    </div>
  );
}
