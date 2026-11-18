// Reference solution for 03-01. Read it only AFTER your own version passes.

export const SKILLS = ['woodcutting', 'fishing', 'mining'] as const;
export type SkillId = (typeof SKILLS)[number];

export type QueryValue = string | number | boolean | undefined | ReadonlyArray<string | number>;

export function buildUrl(base: string, path: string, params: Record<string, QueryValue> = {}): string {
  const url = new URL(path, base);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) url.searchParams.append(key, String(v));
    } else {
      url.searchParams.append(key, String(value));
    }
  }
  // URL#toString() omits the '?' entirely when there are no params.
  return url.toString();
}

export function parseQuery(search: string): Record<string, string | string[]> {
  const params = new URLSearchParams(search); // handles a leading '?' and decoding (incl. '+')
  const result: Record<string, string | string[]> = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    result[key] = values.length === 1 ? (values[0] ?? '') : values;
  }
  return result;
}

export type LeaderboardParams = { skill: SkillId; page: number; pageSize: number };

function isSkillId(value: string | null): value is SkillId {
  return SKILLS.some((s) => s === value);
}

function parseInteger(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const n = Number(value);
  return Number.isInteger(n) ? n : undefined;
}

export function getLeaderboardParams(search: string): LeaderboardParams {
  const params = new URLSearchParams(search);
  const skill = params.get('skill');
  const page = parseInteger(params.get('page'));
  const pageSize = parseInteger(params.get('pageSize'));
  return {
    skill: isSkillId(skill) ? skill : 'woodcutting',
    page: page !== undefined && page >= 1 ? page : 1,
    pageSize: pageSize === undefined ? 20 : Math.min(100, Math.max(1, pageSize)),
  };
}

export function isSameOrigin(a: string, b: string): boolean {
  return new URL(a).origin === new URL(b).origin; // origin normalises default ports
}

export function isSafeRedirect(target: string, appOrigin: string): boolean {
  try {
    const url = new URL(target, appOrigin); // relative targets resolve against the app
    const isHttp = url.protocol === 'https:' || url.protocol === 'http:';
    return isHttp && url.origin === new URL(appOrigin).origin;
  } catch {
    return false; // new URL throws a TypeError for invalid URLs
  }
}
