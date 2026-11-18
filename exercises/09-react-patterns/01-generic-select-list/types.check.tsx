// Type tests for 09-01. Every line here must compile.
//   Expect<Equal<A, B>>          fails unless A and B are exactly the same type.
//   A "ts-expect-error" comment  means the NEXT line MUST be a type error.
import type { Equal, Expect } from '../../_support/type-assertions';
import { SelectList } from './exercise';

type Spot = { id: string; name: string; minLevel: number };
declare const spots: Spot[];
declare const chosen: Spot | null;

export const ok = (
  <SelectList
    label="Fishing spot"
    items={spots}
    getKey={(s) => {
      type _t1 = Expect<Equal<typeof s, Spot>>;
      return s.id;
    }}
    getLabel={(s) => `${s.name} (lvl ${s.minLevel})`}
    selected={chosen}
    onSelect={(s) => {
      type _t2 = Expect<Equal<typeof s, Spot>>;
    }}
  />
);

export const wrongSelected = (
  // @ts-expect-error: selected must be a Spot (or null), not a string
  <SelectList label="x" items={spots} getKey={(s) => s.id} getLabel={(s) => s.name} selected="pond" onSelect={() => {}} />
);

export const wrongKey = (
  <SelectList
    label="x"
    items={spots}
    // @ts-expect-error: getKey must return a string
    getKey={(s) => s.minLevel}
    getLabel={(s) => s.name}
    selected={null}
    onSelect={() => {}}
  />
);

export const typoInLabel = (
  <SelectList
    label="x"
    items={spots}
    getKey={(s) => s.id}
    // @ts-expect-error: 'title' does not exist on Spot
    getLabel={(s) => s.title}
    selected={null}
    onSelect={() => {}}
  />
);
