/* eslint-disable no-restricted-syntax */
import { jest } from '@jest/globals';
import { Arrayifier } from '../../src/Arrayifier.js';

describe('Arrayifier', () => {
  describe('shuffle()', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('preserves every element', () => {
      const input = [1, 2, 3, 4, 5, 6, 7, 8];
      const result = Arrayifier.shuffle([...input]);

      expect(result).toHaveLength(input.length);
      expect([...result].sort((a, b) => a - b)).toEqual(input);
    });

    test('shuffles in place and returns the same array reference', () => {
      const input = [1, 2, 3];
      const result = Arrayifier.shuffle(input);

      expect(result).toBe(input);
    });

    test('is a no-op for empty and single-element arrays', () => {
      expect(Arrayifier.shuffle([])).toEqual([]);
      expect(Arrayifier.shuffle(['only'])).toEqual(['only']);
    });

    test('produces a deterministic permutation for a fixed random source', () => {
      // Math.random() === 0 always picks index 0, so each step swaps the
      // current tail element with the head: [1,2,3,4] -> [2,3,4,1].
      jest.spyOn(Math, 'random').mockReturnValue(0);

      expect(Arrayifier.shuffle([1, 2, 3, 4])).toEqual([2, 3, 4, 1]);
    });
  });

  describe('getCombinations()', () => {
    test('returns all r-sized combinations in lexicographic order', () => {
      expect(Arrayifier.getCombinations([1, 2, 3], 3, 2)).toEqual([
        [1, 2],
        [1, 3],
        [2, 3],
      ]);
    });

    test('returns each element on its own when r is 1', () => {
      expect(Arrayifier.getCombinations(['a', 'b', 'c'], 3, 1)).toEqual([['a'], ['b'], ['c']]);
    });

    test('returns the whole array when r equals n', () => {
      expect(Arrayifier.getCombinations([1, 2, 3], 3, 3)).toEqual([[1, 2, 3]]);
    });

    test('returns a single empty combination when r is 0', () => {
      expect(Arrayifier.getCombinations([1, 2, 3], 3, 0)).toEqual([[]]);
    });

    test('returns nothing when r exceeds n', () => {
      expect(Arrayifier.getCombinations([1, 2], 2, 5)).toEqual([]);
    });

    test('produces n-choose-r results', () => {
      // 5 choose 3 === 10
      expect(Arrayifier.getCombinations([1, 2, 3, 4, 5], 5, 3)).toHaveLength(10);
      // 6 choose 2 === 15
      expect(Arrayifier.getCombinations([1, 2, 3, 4, 5, 6], 6, 2)).toHaveLength(15);
    });

    test('returns independent arrays, not aliases of the shared buffer', () => {
      const results = Arrayifier.getCombinations([1, 2, 3], 3, 2);

      results[0][0] = 99;

      expect(results[1]).toEqual([1, 3]);
      expect(results[2]).toEqual([2, 3]);
    });

    test('does not mutate the source array', () => {
      const source = [1, 2, 3];
      Arrayifier.getCombinations(source, 3, 2);

      expect(source).toEqual([1, 2, 3]);
    });

    test('honours n when it is smaller than the array length', () => {
      // Only the first 2 elements are considered.
      expect(Arrayifier.getCombinations([1, 2, 3, 4], 2, 2)).toEqual([[1, 2]]);
    });

    test('accepts the documented two-argument form', () => {
      // The README documents getCombinations(arr, r); the three-argument form
      // is kept so existing callers keep working.
      expect(Arrayifier.getCombinations([1, 2, 3, 4], 2)).toEqual([
        [1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4],
      ]);

      expect(Arrayifier.getCombinations([1, 2, 3], 2))
        .toEqual(Arrayifier.getCombinations([1, 2, 3], 3, 2));
    });
  });

  describe('chunk()', () => {
    test('splits into even chunks', () => {
      expect(Arrayifier.chunk([1, 2, 3, 4], 2)).toEqual([[1, 2], [3, 4]]);
    });

    test('leaves a short final chunk', () => {
      expect(Arrayifier.chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    });

    test('handles a size larger than the array', () => {
      expect(Arrayifier.chunk([1, 2], 10)).toEqual([[1, 2]]);
    });

    test('returns nothing for an empty array', () => {
      expect(Arrayifier.chunk([], 2)).toEqual([]);
    });

    test('rejects a size below 1, which would loop forever', () => {
      expect(() => Arrayifier.chunk([1], 0)).toThrow('chunk size must be at least 1');
      expect(() => Arrayifier.chunk([1], -1)).toThrow('chunk size must be at least 1');
    });

    test('does not mutate the input', () => {
      const source = [1, 2, 3];
      Arrayifier.chunk(source, 2);

      expect(source).toEqual([1, 2, 3]);
    });
  });

  describe('unique()', () => {
    test('removes duplicates, keeping first occurrence order', () => {
      expect(Arrayifier.unique([1, 2, 2, 3, 1])).toEqual([1, 2, 3]);
      expect(Arrayifier.unique(['b', 'a', 'b'])).toEqual(['b', 'a']);
    });

    test('handles an empty array', () => {
      expect(Arrayifier.unique([])).toEqual([]);
    });

    test('compares objects by identity', () => {
      const shared = { id: 1 };

      expect(Arrayifier.unique([shared, shared])).toEqual([shared]);
      expect(Arrayifier.unique([{ id: 1 }, { id: 1 }])).toHaveLength(2);
    });
  });

  describe('uniqueBy()', () => {
    test('de-duplicates by a derived key', () => {
      const players = [
        { id: 1, team: 'red' },
        { id: 2, team: 'blue' },
        { id: 3, team: 'red' },
      ];

      expect(Arrayifier.uniqueBy(players, (p) => p.team)).toEqual([
        { id: 1, team: 'red' },
        { id: 2, team: 'blue' },
      ]);
    });

    test('keeps the first of each key', () => {
      expect(Arrayifier.uniqueBy([{ n: 1 }, { n: 1 }], (x) => x.n)).toEqual([{ n: 1 }]);
    });
  });

  describe('groupBy()', () => {
    test('buckets by a derived key', () => {
      const games = [
        { season: 2025, id: 'a' },
        { season: 2026, id: 'b' },
        { season: 2025, id: 'c' },
      ];

      expect(Arrayifier.groupBy(games, (g) => g.season)).toEqual({
        2025: [{ season: 2025, id: 'a' }, { season: 2025, id: 'c' }],
        2026: [{ season: 2026, id: 'b' }],
      });
    });

    test('preserves order inside each bucket', () => {
      const grouped = Arrayifier.groupBy([1, 2, 3, 4, 5, 6], (n) => (n % 2 === 0 ? 'even' : 'odd'));

      expect(grouped.odd).toEqual([1, 3, 5]);
      expect(grouped.even).toEqual([2, 4, 6]);
    });

    test('returns an empty object for an empty array', () => {
      expect(Arrayifier.groupBy([] as number[], (n) => n)).toEqual({});
    });

    test('buckets a __proto__ key like any other', () => {
      // On a plain object this key resolves to Object.prototype, which has no
      // push() and throws.
      const grouped = Arrayifier.groupBy(['__proto__', 'a', '__proto__'], (s) => s);

      expect(Object.keys(grouped)).toEqual(['__proto__', 'a']);
      expect(Object.values(grouped)).toEqual([['__proto__', '__proto__'], ['a']]);
    });
  });

  describe('countBy()', () => {
    test('counts by a derived key', () => {
      const games = [{ s: 'final' }, { s: 'live' }, { s: 'final' }];

      expect(Arrayifier.countBy(games, (g) => g.s)).toEqual({ final: 2, live: 1 });
    });

    test('returns an empty object for an empty array', () => {
      expect(Arrayifier.countBy([] as string[], (s) => s)).toEqual({});
    });

    test('counts a __proto__ key like any other', () => {
      // On a plain object this key hits the prototype setter, which swallows
      // the write and loses the count.
      const counts = Arrayifier.countBy(['__proto__', 'a', '__proto__'], (s) => s);

      expect(Object.keys(counts)).toEqual(['__proto__', 'a']);
      expect(Object.values(counts)).toEqual([2, 1]);
    });
  });

  describe('sortBy()', () => {
    const teams = [
      { name: 'Bears', rating: 12 },
      { name: 'Ants', rating: 30 },
      { name: 'Cats', rating: 5 },
    ];

    test('sorts numerically ascending by default', () => {
      expect(Arrayifier.sortBy(teams, (t) => t.rating).map((t) => t.rating)).toEqual([5, 12, 30]);
    });

    test('sorts descending when asked', () => {
      expect(Arrayifier.sortBy(teams, (t) => t.rating, 'desc').map((t) => t.rating))
        .toEqual([30, 12, 5]);
    });

    test('sorts strings alphabetically', () => {
      expect(Arrayifier.sortBy(teams, (t) => t.name).map((t) => t.name))
        .toEqual(['Ants', 'Bears', 'Cats']);
    });

    test('compares numbers numerically, not as strings', () => {
      expect(Arrayifier.sortBy([10, 9, 100], (n) => n)).toEqual([9, 10, 100]);
    });

    test('does not mutate the input', () => {
      const source = [3, 1, 2];
      Arrayifier.sortBy(source, (n) => n);

      expect(source).toEqual([3, 1, 2]);
    });

    test('sorts null and undefined keys last in both directions', () => {
      const data = [{ v: 2 }, { v: null }, { v: 1 }, { v: undefined }];

      expect(Arrayifier.sortBy(data, (r) => r.v).map((r) => r.v))
        .toEqual([1, 2, null, undefined]);
      expect(Arrayifier.sortBy(data, (r) => r.v, 'desc').map((r) => r.v))
        .toEqual([2, 1, null, undefined]);
    });
  });

  describe('partition()', () => {
    test('splits on the predicate', () => {
      expect(Arrayifier.partition([1, 2, 3, 4], (n) => n % 2 === 0)).toEqual([[2, 4], [1, 3]]);
    });

    test('handles an all-pass and all-fail predicate', () => {
      expect(Arrayifier.partition([1, 2], () => true)).toEqual([[1, 2], []]);
      expect(Arrayifier.partition([1, 2], () => false)).toEqual([[], [1, 2]]);
    });

    test('passes the index to the predicate', () => {
      expect(Arrayifier.partition(['a', 'b', 'c'], (_, i) => i < 1)).toEqual([['a'], ['b', 'c']]);
    });

    test('handles an empty array', () => {
      expect(Arrayifier.partition([], () => true)).toEqual([[], []]);
    });
  });

  describe('range()', () => {
    test('counts from 0 with a single argument', () => {
      expect(Arrayifier.range(4)).toEqual([0, 1, 2, 3]);
    });

    test('counts between two bounds, excluding the end', () => {
      expect(Arrayifier.range(1, 4)).toEqual([1, 2, 3]);
    });

    test('honours a step', () => {
      expect(Arrayifier.range(0, 10, 5)).toEqual([0, 5]);
      expect(Arrayifier.range(0, 7, 3)).toEqual([0, 3, 6]);
    });

    test('counts down with a negative step', () => {
      expect(Arrayifier.range(3, 0, -1)).toEqual([3, 2, 1]);
    });

    test('returns nothing when the range is empty or backwards', () => {
      expect(Arrayifier.range(0)).toEqual([]);
      expect(Arrayifier.range(5, 5)).toEqual([]);
      expect(Arrayifier.range(5, 1)).toEqual([]);
    });

    test('rejects a zero step, which would loop forever', () => {
      expect(() => Arrayifier.range(0, 5, 0)).toThrow('range step cannot be 0');
    });
  });
});
