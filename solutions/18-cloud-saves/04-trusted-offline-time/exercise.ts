// Reference solution for 18-04. Read it only AFTER your own version passes.

export type ClockSample = { sentAt: number; serverTime: number; receivedAt: number };

export function estimateClockOffset(samples: ClockSample[]): { offsetMs: number; rttMs: number } | null {
  let best: { sample: ClockSample; rtt: number } | undefined;
  for (const sample of samples) {
    const rtt = sample.receivedAt - sample.sentAt;
    if (rtt < 0) continue; // the device clock jumped during the request: useless
    if (!best || rtt < best.rtt) best = { sample, rtt }; // strict <, so the first of equals wins
  }
  if (!best) return null;
  // Assume the reply took half the round trip; the shortest round trip bounds that error best.
  return { offsetMs: best.sample.serverTime - (best.sample.sentAt + best.rtt / 2), rttMs: best.rtt };
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
  const { lastSaveServerTime, serverNow, clientElapsedMs, capMs, toleranceMs = 5 * 60_000 } = input;
  const raw = Math.max(0, serverNow - lastSaveServerTime);
  return {
    elapsedMs: Math.min(raw, capMs),
    capped: raw > capMs,
    clockTampered: Math.abs(clientElapsedMs - raw) > toleranceMs,
  };
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
  const budget = (perSecond: number) => Math.floor((perSecond * (elapsedMs + limits.slackMs)) / 1000);
  const violations: Violation[] = [];

  const skills = [...new Set([...Object.keys(previous.skills), ...Object.keys(next.skills)])].sort();
  for (const skill of skills) {
    const before = previous.skills[skill]?.xp ?? 0;
    const after = next.skills[skill]?.xp ?? 0;
    const rate = limits.maxXpPerSecond[skill];

    if (after < before) {
      violations.push({ kind: 'xp_decreased', skill, by: before - after });
    } else if (rate === undefined) {
      if (after > 0) violations.push({ kind: 'unknown_skill', skill });
    } else {
      const gained = after - before;
      const allowed = budget(rate);
      if (gained > allowed) violations.push({ kind: 'xp_too_fast', skill, gained, allowed });
    }
  }

  const goldGained = next.gold - previous.gold; // negative = spending, always fine
  const goldAllowed = budget(limits.maxGoldPerSecond);
  if (goldGained > goldAllowed) violations.push({ kind: 'gold_too_fast', gained: goldGained, allowed: goldAllowed });

  return violations.length === 0 ? { ok: true } : { ok: false, violations };
}
