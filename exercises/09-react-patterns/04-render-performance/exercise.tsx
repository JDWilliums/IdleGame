/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 09-04 · render-performance
 * Lesson:  09.5 Performance
 * Run:     npm run watch 09-04
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The code below WORKS, but it wastes renders. That's a real problem in an
 * idle game, where the parent re-renders on every tick. The tests count renders
 * (via the provided useRenderTracker hook) and calls to the expensive function.
 *
 * Optimise it so that:
 *   1. Clicking "Tick" re-renders the TickCounter, but NOT SkillList and NOT
 *      any SkillRow.
 *   2. Selecting a skill re-renders ONLY the row that became selected and the
 *      row that stopped being selected (plus SkillList), not every row and
 *      not the TickCounter.
 *   3. expensiveTotalLevel() is NOT called again when you click "Tick".
 *
 * Constraints:
 *   - Keep the same behaviour and markup (the behaviour tests must keep passing).
 *   - Don't remove or move the useRenderTracker(...) calls, or edit the code
 *     marked "provided".
 *   - Use what you learned in 09.5: memo, useCallback, useMemo, and stable props.
 *
 * Before changing anything: run the tests, read the render counts in the
 * failures, and predict WHY each component re-renders.
 */
import { createContext, useContext, useEffect, useState } from 'react';

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

  const unlocked = SKILLS.filter((s) => s.unlocked);
  const totalLevel = expensiveTotalLevel(unlocked);

  return (
    <main>
      <TickCounter ticks={ticks} />
      <button type="button" onClick={() => setTicks((t) => t + 1)}>
        Tick
      </button>
      <p>Total level: {totalLevel}</p>
      <SkillList skills={unlocked} selectedId={selectedId} onSelect={(id) => setSelectedId(id)} />
    </main>
  );
}

function TickCounter({ ticks }: { ticks: number }) {
  useRenderTracker('TickCounter');
  return <output aria-label="Ticks">{ticks}</output>;
}

type SkillListProps = {
  skills: readonly Skill[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function SkillList({ skills, selectedId, onSelect }: SkillListProps) {
  useRenderTracker('SkillList');
  return (
    <ul aria-label="Skills">
      {skills.map((skill) => (
        <SkillRow key={skill.id} skill={skill} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </ul>
  );
}

type SkillRowProps = {
  skill: Skill;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function SkillRow({ skill, selectedId, onSelect }: SkillRowProps) {
  useRenderTracker(`SkillRow:${skill.id}`);
  const selected = skill.id === selectedId;
  return (
    <li>
      <button type="button" aria-pressed={selected} onClick={() => onSelect(skill.id)}>
        {skill.name} (lvl {skill.level})
      </button>
    </li>
  );
}
