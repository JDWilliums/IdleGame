/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 07-01 · snapshot-bugs
 * Lesson:  07.1 State as a snapshot
 * Run:     npm run watch 07-01
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * A debugging exercise. Each component below contains ONE classic state bug.
 * The code runs, it just doesn't do what it should. For each one:
 *
 *   1. Read the test for it and predict how it will fail.
 *   2. Run the tests and confirm your prediction.
 *   3. Explain the bug to yourself in one sentence (write it in a comment).
 *   4. Fix it with the smallest change that's correct.
 *
 * Don't restructure the components. Each fix is small.
 *
 * TripleXpButton   "+3 XP" should add exactly 3 XP per click.
 * DelayedCollect   each click on "Collect" adds 10 gold one second later.
 *                  Three quick clicks must give 30 gold.
 * ActivityLog      "Add entry" should append "Entry N" to the visible list.
 * PlayerHealth     "Take 3 damage" lowers HP by 3 (never below 0) WITHOUT
 *                  mutating the `initialPlayer` prop (the test freezes it).
 */
import { useState } from 'react';

export function TripleXpButton() {
  const [xp, setXp] = useState(0);

  function handleClick() {
    setXp(xp + 1);
    setXp(xp + 1);
    setXp(xp + 1);
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
      setGold(gold + 10);
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
    entries.push(`Entry ${entries.length + 1}`);
    setEntries(entries);
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
    const next = { ...player };
    next.stats.hp = Math.max(0, next.stats.hp - 3);
    setPlayer(next);
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
