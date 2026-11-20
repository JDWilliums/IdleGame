/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 18-02 · conflict-resolution
 * Lesson:  18.3 Conflicts & concurrency
 * Run:     npm run watch 18-02
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The decisions a device makes when it compares its save with the server's.
 * All pure functions: no fetch, no storage, no Date.now().
 *
 * TASK 1 · summarise(save) → SaveSummary
 *   totalLevel: the sum of levelForXp(xp) over the skills IN the save (provided below)
 *   totalXp:    the sum of xp over those skills
 *   gold, lastSavedAt: copied from the save
 *
 * TASK 2 · resolveConflict(local, remote) → Resolution   (the table in 18.3)
 *   "server changed" means remote.revision !== local.baseRevision.
 *   - remote is null                         → { kind: 'pushLocal' }
 *   - not dirty, server unchanged            → { kind: 'inSync' }
 *   - dirty, server unchanged                → { kind: 'pushLocal' }
 *   - not dirty, server changed              → { kind: 'pullRemote' }
 *   - dirty AND server changed               → { kind: 'askPlayer', local, remote, recommended }
 *       local/remote: summaries of each save
 *       recommended: 'local' | 'remote': more totalXp wins; if equal, the later
 *       lastSavedAt wins; if still equal, 'remote'.
 *
 * TASK 3 · describeSummary(summary, now) → string, for the dialog. Exactly:
 *   "Total level 152 · 48,210 gold · saved 2 minutes ago"
 *   - numbers use en-US thousands separators
 *   - the age is now − lastSavedAt, rounded DOWN to whole units:
 *       under 1 minute (or in the future) → "saved just now"
 *       under 1 hour  → "saved N minute(s) ago"
 *       under 1 day   → "saved N hour(s) ago"
 *       otherwise     → "saved N day(s) ago"
 *     Use the singular for 1: "1 minute ago", "1 hour ago", "1 day ago".
 *
 * TASK 4 · applyChoice(choice, local, remote) → LocalState & { backup }
 *   After the player picks (18.3, "After the choice"):
 *   'local'  → keep local.save, baseRevision = remote.revision, dirty = true,  backup = remote.save
 *   'remote' → use remote.save, baseRevision = remote.revision, dirty = false, backup = local.save
 */

// ─── provided ─────────────────────────────────────────────────────────────────
export type Save = {
  gold: number;
  skills: Record<string, { xp: number }>;
  lastSavedAt: number;
};

/** What this device has. */
export type LocalState = { save: Save; baseRevision: number; dirty: boolean };
/** What the server has. */
export type RemoteSave = { save: Save; revision: number };

export type SaveSummary = { totalLevel: number; totalXp: number; gold: number; lastSavedAt: number };

export type Resolution =
  | { kind: 'inSync' }
  | { kind: 'pushLocal' }
  | { kind: 'pullRemote' }
  | { kind: 'askPlayer'; local: SaveSummary; remote: SaveSummary; recommended: 'local' | 'remote' };

/** The XP curve from 13.6: level 2 at 83 XP, level 10 at 1,154, level 99 at 13,034,431. */
const THRESHOLDS: number[] = (() => {
  const thresholds = [0, 0]; // index = level; level 1 needs 0 XP
  let points = 0;
  for (let level = 1; level < 99; level++) {
    points += Math.floor(level + 300 * 2 ** (level / 7));
    thresholds.push(Math.floor(points / 4));
  }
  return thresholds;
})();

export function levelForXp(xp: number): number {
  let level = 1;
  while (level < 99 && xp >= (THRESHOLDS[level + 1] ?? Infinity)) level++;
  return level;
}

// ─── your code ────────────────────────────────────────────────────────────────
export function summarise(save: Save): SaveSummary {
  throw new Error('Not implemented yet');
}

export function resolveConflict(local: LocalState, remote: RemoteSave | null): Resolution {
  throw new Error('Not implemented yet');
}

export function describeSummary(summary: SaveSummary, now: number): string {
  throw new Error('Not implemented yet');
}

export function applyChoice(
  choice: 'local' | 'remote',
  local: LocalState,
  remote: RemoteSave,
): LocalState & { backup: Save } {
  throw new Error('Not implemented yet');
}
