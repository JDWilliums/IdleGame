/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Exercise 03-01 · urls-and-query-strings
 * Lessons: 03.1 From URL to pixels · 03.2 HTTP in depth
 * Run:     npm run watch 03-01
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Use the built-in `URL` and `URLSearchParams` classes. Don't build or parse
 * query strings by hand with string concatenation or split('&'), because
 * encoding rules are easy to get wrong. (Look them up on MDN.)
 *
 * TASK 1 · buildUrl(base, path, params?)
 *   Join base + path and append query parameters:
 *     - skip params whose value is undefined
 *     - numbers/booleans are converted to strings
 *     - arrays become repeated keys:  tags: ['a', 'b'] → tags=a&tags=b
 *   buildUrl('https://api.example.com', '/leaderboard', { skill: 'fishing', page: 2 })
 *     → 'https://api.example.com/leaderboard?skill=fishing&page=2'
 *   With no (or only undefined) params there must be no trailing '?'.
 *
 * TASK 2 · parseQuery(search)
 *   Turn '?skill=fishing&tag=a&tag=b' (the leading ? is optional) into
 *   { skill: 'fishing', tag: ['a', 'b'] }: single values as strings, repeated
 *   keys as arrays. Values are decoded ('a%20b' and 'a+b' both → 'a b').
 *
 * TASK 3 · getLeaderboardParams(search)
 *   Read & sanitise leaderboard query params, falling back to defaults when a
 *   value is missing or invalid:
 *     skill:    one of SKILLS, default 'woodcutting'
 *     page:     integer ≥ 1, default 1
 *     pageSize: integer, CLAMPED to 1..100 (e.g. 500 → 100, 0 → 1), default 20
 *   Non-numeric or fractional page/pageSize → the default.
 *
 * TASK 4 · isSameOrigin(a, b)
 *   true if two absolute URLs have the same origin (scheme + host + port).
 *
 * TASK 5 · isSafeRedirect(target, appOrigin)
 *   After login you'll redirect to `?next=/somewhere`. Attackers love to set
 *   next=https://evil.com (an "open redirect"). Return true ONLY if `target`,
 *   resolved relative to appOrigin, stays on appOrigin AND uses http(s).
 *   '/play' ✅   'play/skills' ✅   'https://evil.com' ❌   '//evil.com' ❌
 *   'javascript:alert(1)' ❌. Also return false if the URL can't be parsed.
 */

export const SKILLS = ['woodcutting', 'fishing', 'mining'] as const;
export type SkillId = (typeof SKILLS)[number];

export type QueryValue = string | number | boolean | undefined | ReadonlyArray<string | number>;

export function buildUrl(base: string, path: string, params: Record<string, QueryValue> = {}): string {
  throw new Error('Not implemented yet');
}

export function parseQuery(search: string): Record<string, string | string[]> {
  throw new Error('Not implemented yet');
}

export type LeaderboardParams = { skill: SkillId; page: number; pageSize: number };

export function getLeaderboardParams(search: string): LeaderboardParams {
  throw new Error('Not implemented yet');
}

export function isSameOrigin(a: string, b: string): boolean {
  throw new Error('Not implemented yet');
}

export function isSafeRedirect(target: string, appOrigin: string): boolean {
  throw new Error('Not implemented yet');
}
