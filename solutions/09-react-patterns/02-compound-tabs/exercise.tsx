// Reference solution for 09-02. Read it only AFTER your own version passes.
import { createContext, useContext, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

type TabsContextValue = {
  value: string | undefined;
  select: (value: string) => void;
  baseId: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (ctx === null) throw new Error(`<${component}> must be used within <Tabs>`);
  return ctx;
}

// Values may contain characters that aren't valid in ids, so sanitise them.
const idFor = (baseId: string, kind: 'tab' | 'panel', value: string) =>
  `${baseId}-${kind}-${value.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

export type TabsProps = {
  children: ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
};

export function Tabs({ children, defaultValue, value: controlledValue, onValueChange }: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;
  const baseId = useId();

  function select(next: string) {
    if (!isControlled) setUncontrolledValue(next);
    onValueChange?.(next);
  }

  return <TabsContext value={{ value, select, baseId }}>{children}</TabsContext>;
}

export function TabList({ children, 'aria-label': ariaLabel }: { children: ReactNode; 'aria-label': string }) {
  const { select } = useTabsContext('TabList');
  const listRef = useRef<HTMLDivElement>(null);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const tabs = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []);
    const current = tabs.findIndex((t) => t === document.activeElement);
    if (current === -1) return;

    const last = tabs.length - 1;
    const nextIndex: Record<string, number> = {
      ArrowRight: current === last ? 0 : current + 1,
      ArrowLeft: current === 0 ? last : current - 1,
      Home: 0,
      End: last,
    };
    const index = nextIndex[event.key];
    const target = index === undefined ? undefined : tabs[index];
    if (!target) return;

    event.preventDefault();
    const value = target.dataset.value;
    if (value !== undefined) select(value);
    target.focus();
  }

  return (
    <div ref={listRef} role="tablist" aria-label={ariaLabel} onKeyDown={handleKeyDown}>
      {children}
    </div>
  );
}

export function Tab({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useTabsContext('Tab');
  const selected = ctx.value === value;
  return (
    <button
      type="button"
      role="tab"
      id={idFor(ctx.baseId, 'tab', value)}
      aria-selected={selected}
      aria-controls={idFor(ctx.baseId, 'panel', value)}
      tabIndex={selected ? 0 : -1}
      data-value={value}
      onClick={() => ctx.select(value)}
    >
      {children}
    </button>
  );
}

export function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useTabsContext('TabPanel');
  if (ctx.value !== value) return null;
  return (
    <div role="tabpanel" id={idFor(ctx.baseId, 'panel', value)} aria-labelledby={idFor(ctx.baseId, 'tab', value)}>
      {children}
    </div>
  );
}
