// Reference solution for 07-01. Read it only AFTER your own version passes.
import { useState } from 'react';

export function TripleXpButton() {
  const [xp, setXp] = useState(0);

  function handleClick() {
    // BUG WAS: every call read the same snapshot (xp = 0), so 0 + 1 three times.
    // FIX: updater functions are queued and each receives the latest value.
    setXp((x) => x + 1);
    setXp((x) => x + 1);
    setXp((x) => x + 1);
  }

  return (
    <div>
      <output aria-label="XP">{xp}</output>
      <button type="button" onClick={handleClick}>
        +3 XP
      </button>
    </div>
  );
}

export function DelayedCollect() {
  const [gold, setGold] = useState(0);

  function handleClick() {
    setTimeout(() => {
      // BUG WAS: the timeout closed over this render's `gold`, so all three computed 0 + 10.
      // FIX: the updater reads the latest value when it runs.
      setGold((g) => g + 10);
    }, 1000);
  }

  return (
    <div>
      <output aria-label="Gold">{gold}</output>
      <button type="button" onClick={handleClick}>
        Collect
      </button>
    </div>
  );
}

export function ActivityLog() {
  const [entries, setEntries] = useState<string[]>([]);

  function handleAdd() {
    // BUG WAS: push mutated the existing array and passed the SAME reference back,
    // so React's Object.is check saw no change and skipped the re-render.
    // FIX: create a new array.
    setEntries((prev) => [...prev, `Entry ${prev.length + 1}`]);
  }

  return (
    <div>
      <button type="button" onClick={handleAdd}>
        Add entry
      </button>
      <ul aria-label="Activity">
        {entries.map((entry) => (
          <li key={entry}>{entry}</li>
        ))}
      </ul>
    </div>
  );
}

export type Player = { name: string; stats: { hp: number; maxHp: number } };

export function PlayerHealth({ initialPlayer }: { initialPlayer: Player }) {
  const [player, setPlayer] = useState(initialPlayer);

  function handleDamage() {
    // BUG WAS: `{ ...player }` is a SHALLOW copy, so next.stats was still the original
    // (frozen) object, and assigning to it mutated the prop.
    // FIX: copy every level on the path to the change.
    setPlayer((p) => ({ ...p, stats: { ...p.stats, hp: Math.max(0, p.stats.hp - 3) } }));
  }

  return (
    <div>
      <output aria-label="HP">
        {player.stats.hp} / {player.stats.maxHp}
      </output>
      <button type="button" onClick={handleDamage}>
        Take 3 damage
      </button>
    </div>
  );
}
