// Reference solution for 18-02. Read it only AFTER your own version passes.

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

// ─── solution ─────────────────────────────────────────────────────────────────
export function summarise(save: Save): SaveSummary {
  const xps = Object.values(save.skills).map((skill) => skill.xp);
  return {
    totalLevel: xps.reduce((sum, xp) => sum + levelForXp(xp), 0),
    totalXp: xps.reduce((sum, xp) => sum + xp, 0),
    gold: save.gold,
    lastSavedAt: save.lastSavedAt,
  };
}

function recommend(local: SaveSummary, remote: SaveSummary): 'local' | 'remote' {
  if (local.totalXp !== remote.totalXp) return local.totalXp > remote.totalXp ? 'local' : 'remote';
  if (local.lastSavedAt !== remote.lastSavedAt) return local.lastSavedAt > remote.lastSavedAt ? 'local' : 'remote';
  return 'remote';
}

export function resolveConflict(local: LocalState, remote: RemoteSave | null): Resolution {
  if (!remote) return { kind: 'pushLocal' };
  const serverChanged = remote.revision !== local.baseRevision;

  if (!local.dirty && !serverChanged) return { kind: 'inSync' };
  if (local.dirty && !serverChanged) return { kind: 'pushLocal' };
  if (!local.dirty && serverChanged) return { kind: 'pullRemote' };

  const localSummary = summarise(local.save);
  const remoteSummary = summarise(remote.save);
  return { kind: 'askPlayer', local: localSummary, remote: remoteSummary, recommended: recommend(localSummary, remoteSummary) };
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const numberFormat = new Intl.NumberFormat('en-US');

function plural(n: number, unit: string) {
  return `${n} ${unit}${n === 1 ? '' : 's'} ago`;
}

function describeAge(ageMs: number): string {
  if (ageMs < MINUTE) return 'just now'; // also covers negative ages (a clock in the future)
  if (ageMs < HOUR) return plural(Math.floor(ageMs / MINUTE), 'minute');
  if (ageMs < DAY) return plural(Math.floor(ageMs / HOUR), 'hour');
  return plural(Math.floor(ageMs / DAY), 'day');
}

export function describeSummary(summary: SaveSummary, now: number): string {
  return [
    `Total level ${numberFormat.format(summary.totalLevel)}`,
    `${numberFormat.format(summary.gold)} gold`,
    `saved ${describeAge(now - summary.lastSavedAt)}`,
  ].join(' · ');
}

export function applyChoice(
  choice: 'local' | 'remote',
  local: LocalState,
  remote: RemoteSave,
): LocalState & { backup: Save } {
  // Either way we're now based on the server's latest revision, and the loser is kept.
  return choice === 'local'
    ? { save: local.save, baseRevision: remote.revision, dirty: true, backup: remote.save }
    : { save: remote.save, baseRevision: remote.revision, dirty: false, backup: local.save };
}
