// Reference solution for 09-04. Read it only AFTER your own version passes.
import { createContext, memo, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// ─── provided: render tracking (don't modify) ────────────────────────────────
export const RenderTrackerContext = createContext<((name: string) => void) | null>(null);
/** Reports one render of `name` after every commit in which this component rendered. */
export function useRenderTracker(name: string) {
  const track = useContext(RenderTrackerContext);
  useEffect(() => {
    track?.(name);
  });
}

export const expensiveCalls = { count: 0 };
/** Pretend this is slow (it's called with every skill's XP). */
export function expensiveTotalLevel(skills: readonly Skill[]): number {
  expensiveCalls.count++;
  return skills.reduce((sum, s) => sum + s.level, 0);
}

export type Skill = { id: string; name: string; level: number; unlocked: boolean };

export const SKILLS: readonly Skill[] = [
  { id: 'woodcutting', name: 'Woodcutting', level: 12, unlocked: true },
  { id: 'fishing', name: 'Fishing', level: 7, unlocked: true },
  { id: 'mining', name: 'Mining', level: 3, unlocked: true },
  { id: 'smithing', name: 'Smithing', level: 1, unlocked: false },
  { id: 'cooking', name: 'Cooking', level: 5, unlocked: true },
];
// ─────────────────────────────────────────────────────────────────────────────

export function GameScreen() {
  const [ticks, setTicks] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // FIX 1: `.filter()` returned a NEW array every render, which broke memo on
  // SkillList. SKILLS never changes, so compute it once. (Moving it to module
  // scope works too: `const UNLOCKED = SKILLS.filter(...)`.)
  const unlocked = useMemo(() => SKILLS.filter((s) => s.unlocked), []);

  // FIX 2: cache the expensive computation; it only depends on `unlocked`.
  const totalLevel = useMemo(() => expensiveTotalLevel(unlocked), [unlocked]);

  // FIX 3: an inline arrow is a new function every render. setSelectedId is
  // stable, so this callback can be created once.
  const handleSelect = useCallback((id: string) => setSelectedId(id), []);

  return (
    <main>
      <TickCounter ticks={ticks} />
      <button type="button" onClick={() => setTicks((t) => t + 1)}>
        Tick
      </button>
      <p>Total level: {totalLevel}</p>
      <SkillList skills={unlocked} selectedId={selectedId} onSelect={handleSelect} />
    </main>
  );
}

// FIX 6: memo here too, so selecting a skill (which re-renders GameScreen)
// doesn't re-render the tick display when `ticks` hasn't changed.
const TickCounter = memo(function TickCounter({ ticks }: { ticks: number }) {
  useRenderTracker('TickCounter');
  return <output aria-label="Ticks">{ticks}</output>;
});

type SkillListProps = {
  skills: readonly Skill[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

// FIX 4: memo, so SkillList skips re-rendering when its props are unchanged (on Tick).
const SkillList = memo(function SkillList({ skills, selectedId, onSelect }: SkillListProps) {
  useRenderTracker('SkillList');
  return (
    <ul aria-label="Skills">
      {skills.map((skill) => (
        // FIX 5: pass a per-row BOOLEAN instead of the shared selectedId. When the
        // selection changes, only the two rows whose boolean flips get new props.
        <SkillRow key={skill.id} skill={skill} selected={skill.id === selectedId} onSelect={onSelect} />
      ))}
    </ul>
  );
});

type SkillRowProps = {
  skill: Skill;
  selected: boolean;
  onSelect: (id: string) => void;
};

const SkillRow = memo(function SkillRow({ skill, selected, onSelect }: SkillRowProps) {
  useRenderTracker(`SkillRow:${skill.id}`);
  return (
    <li>
      <button type="button" aria-pressed={selected} onClick={() => onSelect(skill.id)}>
        {skill.name} (lvl {skill.level})
      </button>
    </li>
  );
});
