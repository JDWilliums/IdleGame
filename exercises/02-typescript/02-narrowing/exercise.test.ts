import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { typeErrors } from '../../_support/typecheck';
import { describeReward, getErrorMessage, isItemStack, parseQuantity } from './exercise';

describe('types (checked by the TypeScript compiler)', () => {
  it('types.check.ts compiles with no errors', () => {
    expect(typeErrors(path.join(import.meta.dirname, 'types.check.ts'))).toEqual([]);
  });
});

describe('isItemStack', () => {
  it('accepts valid stacks', () => {
    expect(isItemStack({ itemId: 'trout', quantity: 3 })).toBe(true);
    expect(isItemStack({ itemId: 'gem', quantity: 1, extra: true })).toBe(true);
  });

  it('rejects everything else', () => {
    for (const bad of [
      null,
      undefined,
      'trout',
      42,
      [],
      {},
      { itemId: 'trout' },
      { quantity: 3 },
      { itemId: '', quantity: 3 },
      { itemId: 'trout', quantity: 0 },
      { itemId: 'trout', quantity: -1 },
      { itemId: 'trout', quantity: 1.5 },
      { itemId: 'trout', quantity: '3' },
      { itemId: 7, quantity: 3 },
    ]) {
      expect(isItemStack(bad), JSON.stringify(bad)).toBe(false);
    }
  });
});

describe('describeReward', () => {
  it('describes gold', () => {
    expect(describeReward(50)).toBe('50 gold');
    expect(describeReward(0)).toBe('0 gold');
  });

  it('describes a single item id', () => {
    expect(describeReward('oak_log')).toBe('1 × oak_log');
  });

  it('describes a stack', () => {
    expect(describeReward({ itemId: 'trout', quantity: 3 })).toBe('3 × trout');
  });

  it('describes a list of stacks', () => {
    expect(
      describeReward([
        { itemId: 'trout', quantity: 3 },
        { itemId: 'gem', quantity: 1 },
      ]),
    ).toBe('3 × trout, 1 × gem');
  });

  it('describes nothing', () => {
    expect(describeReward([])).toBe('nothing');
    expect(describeReward(null)).toBe('nothing');
    expect(describeReward(undefined)).toBe('nothing');
  });
});

describe('parseQuantity', () => {
  it('accepts non-negative integers', () => {
    expect(parseQuantity(0)).toBe(0);
    expect(parseQuantity(12)).toBe(12);
  });

  it('accepts digit-only strings, trimming whitespace', () => {
    expect(parseQuantity('12')).toBe(12);
    expect(parseQuantity('  7 ')).toBe(7);
    expect(parseQuantity('007')).toBe(7);
  });

  it('rejects anything else', () => {
    for (const bad of ['', '   ', '1.5', '-3', '1e3', 'ten', '12abc', -1, 1.5, NaN, Infinity, null, undefined, {}, [], true]) {
      expect(parseQuantity(bad), String(bad)).toBeNull();
    }
  });
});

describe('getErrorMessage', () => {
  it('reads Error messages (including subclasses)', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
    expect(getErrorMessage(new TypeError('bad type'))).toBe('bad type');
  });

  it('passes strings through', () => {
    expect(getErrorMessage('plain string')).toBe('plain string');
  });

  it('reads a message property from plain objects', () => {
    expect(getErrorMessage({ message: 'from server' })).toBe('from server');
  });

  it('falls back for everything else', () => {
    expect(getErrorMessage({ message: 42 })).toBe('Unknown error');
    expect(getErrorMessage(null)).toBe('Unknown error');
    expect(getErrorMessage(undefined)).toBe('Unknown error');
    expect(getErrorMessage(404)).toBe('Unknown error');
  });
});
