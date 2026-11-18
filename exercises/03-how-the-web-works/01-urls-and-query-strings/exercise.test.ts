import { describe, expect, it } from 'vitest';
import { buildUrl, getLeaderboardParams, isSafeRedirect, isSameOrigin, parseQuery } from './exercise';

describe('buildUrl', () => {
  it('joins base and path', () => {
    expect(buildUrl('https://api.example.com', '/leaderboard')).toBe(
      'https://api.example.com/leaderboard',
    );
  });

  it('appends params, converting numbers and booleans', () => {
    expect(
      buildUrl('https://api.example.com', '/leaderboard', { skill: 'fishing', page: 2, live: true }),
    ).toBe('https://api.example.com/leaderboard?skill=fishing&page=2&live=true');
  });

  it('skips undefined values (and leaves no dangling ?)', () => {
    expect(buildUrl('https://api.example.com', '/x', { a: undefined })).toBe(
      'https://api.example.com/x',
    );
    expect(buildUrl('https://api.example.com', '/x', { a: undefined, b: 'kept' })).toBe(
      'https://api.example.com/x?b=kept',
    );
  });

  it('repeats keys for arrays', () => {
    expect(buildUrl('https://api.example.com', '/items', { tag: ['ore', 'bar'] })).toBe(
      'https://api.example.com/items?tag=ore&tag=bar',
    );
  });

  it('encodes special characters', () => {
    const url = buildUrl('https://api.example.com', '/search', { q: 'oak & ash' });
    expect(new URL(url).searchParams.get('q')).toBe('oak & ash');
    expect(url).not.toContain(' ');
  });
});

describe('parseQuery', () => {
  it('parses single values', () => {
    expect(parseQuery('?skill=fishing&page=2')).toEqual({ skill: 'fishing', page: '2' });
  });

  it('works without a leading ?', () => {
    expect(parseQuery('skill=fishing')).toEqual({ skill: 'fishing' });
  });

  it('collects repeated keys into arrays', () => {
    expect(parseQuery('?tag=a&tag=b&tag=c&x=1')).toEqual({ tag: ['a', 'b', 'c'], x: '1' });
  });

  it('decodes values', () => {
    expect(parseQuery('?q=oak%20log&r=ash+log')).toEqual({ q: 'oak log', r: 'ash log' });
  });

  it('returns {} for an empty query', () => {
    expect(parseQuery('')).toEqual({});
    expect(parseQuery('?')).toEqual({});
  });
});

describe('getLeaderboardParams', () => {
  it('uses defaults when nothing is given', () => {
    expect(getLeaderboardParams('')).toEqual({ skill: 'woodcutting', page: 1, pageSize: 20 });
  });

  it('reads valid values', () => {
    expect(getLeaderboardParams('?skill=mining&page=3&pageSize=50')).toEqual({
      skill: 'mining',
      page: 3,
      pageSize: 50,
    });
  });

  it('falls back for invalid skill and page', () => {
    expect(getLeaderboardParams('?skill=cooking&page=0')).toMatchObject({
      skill: 'woodcutting',
      page: 1,
    });
    expect(getLeaderboardParams('?page=two').page).toBe(1);
    expect(getLeaderboardParams('?page=1.5').page).toBe(1);
    expect(getLeaderboardParams('?page=-4').page).toBe(1);
  });

  it('clamps pageSize to 1..100', () => {
    expect(getLeaderboardParams('?pageSize=500').pageSize).toBe(100);
    expect(getLeaderboardParams('?pageSize=0').pageSize).toBe(1);
    expect(getLeaderboardParams('?pageSize=-10').pageSize).toBe(1);
    expect(getLeaderboardParams('?pageSize=abc').pageSize).toBe(20);
  });
});

describe('isSameOrigin', () => {
  it('compares scheme, host and port', () => {
    expect(isSameOrigin('https://game.example.com/a', 'https://game.example.com/b?x=1')).toBe(true);
    expect(isSameOrigin('https://game.example.com', 'https://api.example.com')).toBe(false);
    expect(isSameOrigin('https://example.com', 'http://example.com')).toBe(false);
    expect(isSameOrigin('http://localhost:5173', 'http://localhost:3000')).toBe(false);
    expect(isSameOrigin('https://example.com:443/x', 'https://example.com/y')).toBe(true);
  });
});

describe('isSafeRedirect', () => {
  const app = 'https://game.example.com';

  it('allows same-origin paths', () => {
    expect(isSafeRedirect('/play', app)).toBe(true);
    expect(isSafeRedirect('play/skills?tab=fishing', app)).toBe(true);
    expect(isSafeRedirect('https://game.example.com/bank', app)).toBe(true);
  });

  it('blocks other origins, including protocol-relative URLs', () => {
    expect(isSafeRedirect('https://evil.com', app)).toBe(false);
    expect(isSafeRedirect('//evil.com/steal', app)).toBe(false);
    expect(isSafeRedirect('https://game.example.com.evil.com/', app)).toBe(false);
  });

  it('blocks non-http(s) schemes', () => {
    expect(isSafeRedirect('javascript:alert(1)', app)).toBe(false);
    expect(isSafeRedirect('data:text/html,hi', app)).toBe(false);
  });

  it('returns false instead of throwing for unparseable input', () => {
    expect(isSafeRedirect('http://[::1', app)).toBe(false);
  });
});
