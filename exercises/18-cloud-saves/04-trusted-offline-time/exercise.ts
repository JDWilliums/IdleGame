/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 18-04 · trusted-offline-time
 * Lesson:  18.4 Trusting time & cheating
 * Run:     npm run watch 18-04
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * TASK 1 · estimateClockOffset(samples) → { offsetMs, rttMs } | null
 *   Each sample: the client sent at `sentAt`, the server replied with `serverTime`,
 *   and the client received it at `receivedAt` (sentAt/receivedAt are device clock).
 *     rtt    = receivedAt − sentAt          (ignore samples where this is negative)
 *     offset = serverTime − (sentAt + rtt / 2)
 *   Use the sample with the SMALLEST rtt (the first one, if several tie).
 *   No usable samples → null.
 *
 * TASK 2 · trustedOfflineTime(input) → { elapsedMs, capped, clockTampered }
 *   Offline time measured with the SERVER's clock:
 *     raw       = serverNow − lastSaveServerTime   (treat a negative value as 0)
 *     elapsedMs = raw, but at most capMs;  capped = raw > capMs
 *   clockTampered: the device's own idea of the elapsed time (clientElapsedMs) differs
 *   from raw by MORE than toleranceMs (default 5 minutes), in either direction.
 *
 * TASK 3 · checkProgress(previous, next, elapsedMs, limits) → { ok: true } | { ok: false, violations }
 *   Could `next` have been reached from `previous` in elapsedMs of honest play?
 *   Budget for a rate R per second:  allowed = floor(R × (elapsedMs + slackMs) / 1000)
 *   For every skill in EITHER save (alphabetical order). A skill missing from a save has 0 XP:
 *     - XP went down                    → { kind: 'xp_decreased', skill, by }
 *     - otherwise, the skill has XP in `next` but no rate in limits.maxXpPerSecond
 *                                       → { kind: 'unknown_skill', skill }
 *     - otherwise, XP gained > allowed  → { kind: 'xp_too_fast', skill, gained, allowed }
 *   Then gold (spending is fine, so only gains are checked):
 *     - gold gained > allowed           → { kind: 'gold_too_fast', gained, allowed }
 *   No violations → { ok: true }.
 */

export type ClockSample = { sentAt: number; serverTime: number; receivedAt: number };

export function estimateClockOffset(samples: ClockSample[]): { offsetMs: number; rttMs: number } | null {
  throw new Error('Not implemented yet');
}

export type OfflineTimeInput = {
  lastSaveServerTime: number;
  serverNow: number;
  clientElapsedMs: number;
  capMs: number;
  toleranceMs?: number;
};

export type OfflineTime = { elapsedMs: number; capped: boolean; clockTampered: boolean };

export function trustedOfflineTime(input: OfflineTimeInput): OfflineTime {
  throw new Error('Not implemented yet');
}

export type ProgressSnapshot = { gold: number; skills: Record<string, { xp: number }> };

export type ProgressLimits = {
  maxXpPerSecond: Record<string, number>;
  maxGoldPerSecond: number;
  slackMs: number;
};

export type Violation =
  | { kind: 'xp_decreased'; skill: string; by: number }
  | { kind: 'unknown_skill'; skill: string }
  | { kind: 'xp_too_fast'; skill: string; gained: number; allowed: number }
  | { kind: 'gold_too_fast'; gained: number; allowed: number };

export function checkProgress(
  previous: ProgressSnapshot,
  next: ProgressSnapshot,
  elapsedMs: number,
  limits: ProgressLimits,
): { ok: true } | { ok: false; violations: Violation[] } {
  throw new Error('Not implemented yet');
}
