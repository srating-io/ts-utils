/* eslint-disable no-restricted-syntax */
import { Sorter } from '../../src/Sorter.js';

type Row = Record<string, string | number>;

const rows = (...values: (string | number | null)[]): Row[] => values.map(
  (value, index) => ({ id: index, value } as unknown as Row),
);

describe('Sorter', () => {
  describe('descendingComparator()', () => {
    test('orders numbers descending by default', () => {
      const a = { value: 1 } as Row;
      const b = { value: 2 } as Row;

      expect(Sorter.descendingComparator(a, b, 'value')).toBe(1);
      expect(Sorter.descendingComparator(b, a, 'value')).toBe(-1);
    });

    test('returns 0 for equal values', () => {
      expect(Sorter.descendingComparator({ value: 5 }, { value: 5 }, 'value')).toBe(0);
      expect(Sorter.descendingComparator({ value: 'x' }, { value: 'x' }, 'value')).toBe(0);
    });

    test('compares strings lexicographically', () => {
      expect(Sorter.descendingComparator({ value: 'apple' }, { value: 'banana' }, 'value')).toBe(1);
      expect(Sorter.descendingComparator({ value: 'banana' }, { value: 'apple' }, 'value')).toBe(-1);
    });

    test("the 'higher' direction inverts the result", () => {
      const a = { value: 1 } as Row;
      const b = { value: 2 } as Row;

      expect(Sorter.descendingComparator(a, b, 'value', 'higher')).toBe(-1);
      expect(Sorter.descendingComparator(b, a, 'value', 'higher')).toBe(1);
    });

    test("an explicit 'lower' direction matches the default", () => {
      const a = { value: 1 } as Row;
      const b = { value: 2 } as Row;

      expect(Sorter.descendingComparator(a, b, 'value', 'lower'))
        .toBe(Sorter.descendingComparator(a, b, 'value'));
    });

    test('treats two null values as equal', () => {
      // Two empty values are equal. Anything else breaks antisymmetry and
      // leaves the resulting sort order inconsistent.
      const a = { value: null } as unknown as Row;
      const b = { value: null } as unknown as Row;

      expect(Sorter.descendingComparator(a, b, 'value')).toBe(0);
    });

    test('sorts null and undefined after real values', () => {
      const real = { value: 5 } as Row;
      const nil = { value: null } as unknown as Row;
      const undef = {} as Row;

      expect(Sorter.descendingComparator(real, nil, 'value')).toBe(1);
      expect(Sorter.descendingComparator(nil, real, 'value')).toBe(-1);
      expect(Sorter.descendingComparator(real, undef, 'value')).toBe(1);
      expect(Sorter.descendingComparator(undef, real, 'value')).toBe(-1);
    });

    test('is antisymmetric across a mixed set of values', () => {
      const values = [3, 1, null, 'b', undefined, 2, 'a'];

      for (const left of values) {
        for (const right of values) {
          const a = { value: left } as unknown as Row;
          const b = { value: right } as unknown as Row;

          const forward = Sorter.descendingComparator(a, b, 'value');
          const backward = Sorter.descendingComparator(b, a, 'value');

          // `===` rather than toBe(), so that 0 and -0 compare as equal.
          expect(forward === -backward).toBe(true);
        }
      }
    });
  });

  describe('getComparator()', () => {
    test("'desc' sorts largest first", () => {
      const sorted = rows(2, 5, 1).sort(Sorter.getComparator('desc', 'value'));

      expect(sorted.map((r) => r.value)).toEqual([5, 2, 1]);
    });

    test("'asc' sorts smallest first", () => {
      const sorted = rows(2, 5, 1).sort(Sorter.getComparator('asc', 'value'));

      expect(sorted.map((r) => r.value)).toEqual([1, 2, 5]);
    });

    test('any order other than "desc" is treated as ascending', () => {
      const sorted = rows(2, 5, 1).sort(Sorter.getComparator('anything', 'value'));

      expect(sorted.map((r) => r.value)).toEqual([1, 2, 5]);
    });

    test('sorts strings', () => {
      const sorted = rows('pear', 'apple', 'fig').sort(Sorter.getComparator('asc', 'value'));

      expect(sorted.map((r) => r.value)).toEqual(['apple', 'fig', 'pear']);
    });

    test("respects the 'higher' direction flag", () => {
      const sorted = rows(2, 5, 1).sort(Sorter.getComparator('desc', 'value', 'higher'));

      expect(sorted.map((r) => r.value)).toEqual([1, 2, 5]);
    });

    test('keeps null values grouped rather than interleaved', () => {
      // The bug this covers is interleaving: because cmp(null, null) returned 1,
      // null rows compared as unequal and drifted apart through the sort.
      // Nulls group at the head under 'desc' and the tail under 'asc'.
      const desc = rows(3, null, 1, null, 2)
        .sort(Sorter.getComparator('desc', 'value'))
        .map((r) => r.value);

      expect(desc.slice(0, 2)).toEqual([null, null]);
      expect(desc.slice(2)).toEqual([3, 2, 1]);

      const asc = rows(3, null, 1, null, 2)
        .sort(Sorter.getComparator('asc', 'value'))
        .map((r) => r.value);

      expect(asc.slice(0, 3)).toEqual([1, 2, 3]);
      expect(asc.slice(3)).toEqual([null, null]);
    });

    test('sorts by the requested column only', () => {
      const data = [
        { a: 1, b: 3 },
        { a: 2, b: 2 },
        { a: 3, b: 1 },
      ] as Row[];

      expect(data.slice().sort(Sorter.getComparator('asc', 'b')).map((r) => r.a)).toEqual([3, 2, 1]);
      expect(data.slice().sort(Sorter.getComparator('asc', 'a')).map((r) => r.a)).toEqual([1, 2, 3]);
    });
  });
});
