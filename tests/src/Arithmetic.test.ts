/* eslint-disable no-restricted-syntax */
import { Arithmetic } from '../../src/Arithmetic.js';

describe('Arithmetic', () => {
  describe('clamp()', () => {
    test('returns the value untouched when it is inside the range', () => {
      expect(Arithmetic.clamp(5, 0, 10)).toBe(5);
      expect(Arithmetic.clamp(0.5, 0, 1)).toBe(0.5);
    });

    test('clamps to the bounds when the value is outside the range', () => {
      expect(Arithmetic.clamp(-5, 0, 10)).toBe(0);
      expect(Arithmetic.clamp(15, 0, 10)).toBe(10);
    });

    test('returns the bounds themselves unchanged', () => {
      expect(Arithmetic.clamp(0, 0, 10)).toBe(0);
      expect(Arithmetic.clamp(10, 0, 10)).toBe(10);
    });

    test('handles negative ranges', () => {
      expect(Arithmetic.clamp(-5, -10, -1)).toBe(-5);
      expect(Arithmetic.clamp(-20, -10, -1)).toBe(-10);
      expect(Arithmetic.clamp(0, -10, -1)).toBe(-1);
    });

    test('handles infinite bounds', () => {
      expect(Arithmetic.clamp(42, -Infinity, Infinity)).toBe(42);
      expect(Arithmetic.clamp(Infinity, 0, 10)).toBe(10);
      expect(Arithmetic.clamp(-Infinity, 0, 10)).toBe(0);
    });

    test('propagates NaN rather than inventing a bound', () => {
      expect(Arithmetic.clamp(NaN, 0, 10)).toBeNaN();
    });
  });

  describe('lerp()', () => {
    test('interpolates between the endpoints', () => {
      expect(Arithmetic.lerp(0, 100, 0.25)).toBe(25);
      expect(Arithmetic.lerp(0, 100, 0.5)).toBe(50);
      expect(Arithmetic.lerp(10, 20, 0.5)).toBe(15);
    });

    test('returns the endpoints at 0 and 1', () => {
      expect(Arithmetic.lerp(5, 25, 0)).toBe(5);
      expect(Arithmetic.lerp(5, 25, 1)).toBe(25);
    });

    test('clamps an amount outside 0..1', () => {
      expect(Arithmetic.lerp(0, 100, 2)).toBe(100);
      expect(Arithmetic.lerp(0, 100, -1)).toBe(0);
    });

    test('interpolates downwards when b is smaller', () => {
      expect(Arithmetic.lerp(100, 0, 0.25)).toBe(75);
    });

    test('handles negative endpoints', () => {
      expect(Arithmetic.lerp(-100, 100, 0.5)).toBe(0);
    });
  });

  describe('round()', () => {
    test('rounds to whole numbers by default', () => {
      expect(Arithmetic.round(1.5)).toBe(2);
      expect(Arithmetic.round(1.4)).toBe(1);
    });

    test('rounds to a given precision', () => {
      expect(Arithmetic.round(3.14159, 2)).toBe(3.14);
      expect(Arithmetic.round(3.14159, 4)).toBe(3.1416);
    });

    test('rounds half-way cases that naive scaling gets wrong', () => {
      // 1.005 * 100 is 100.49999999999999 in binary floating point.
      expect(Arithmetic.round(1.005, 2)).toBe(1.01);
      expect(Arithmetic.round(1.255, 2)).toBe(1.26);
    });

    test('accepts a negative precision', () => {
      expect(Arithmetic.round(1234, -2)).toBe(1200);
      expect(Arithmetic.round(1250, -2)).toBe(1300);
    });

    test('handles negative values', () => {
      expect(Arithmetic.round(-3.14159, 2)).toBe(-3.14);
    });

    test('passes non-finite values straight through', () => {
      expect(Arithmetic.round(NaN)).toBeNaN();
      expect(Arithmetic.round(Infinity)).toBe(Infinity);
    });
  });

  describe('mapRange()', () => {
    test('re-maps between ranges', () => {
      expect(Arithmetic.mapRange(1500, 1000, 2000, 0, 100)).toBe(50);
      expect(Arithmetic.mapRange(5, 0, 10, 0, 1)).toBe(0.5);
    });

    test('maps the endpoints exactly', () => {
      expect(Arithmetic.mapRange(0, 0, 10, 100, 200)).toBe(100);
      expect(Arithmetic.mapRange(10, 0, 10, 100, 200)).toBe(200);
    });

    test('extrapolates beyond the input range', () => {
      expect(Arithmetic.mapRange(20, 0, 10, 0, 100)).toBe(200);
    });

    test('supports an inverted output range', () => {
      expect(Arithmetic.mapRange(0, 0, 10, 100, 0)).toBe(100);
      expect(Arithmetic.mapRange(10, 0, 10, 100, 0)).toBe(0);
    });

    test('returns the output floor for a zero-width input range', () => {
      expect(Arithmetic.mapRange(5, 5, 5, 0, 100)).toBe(0);
    });
  });

  describe('normalize()', () => {
    test('scales onto 0..1', () => {
      expect(Arithmetic.normalize(5, 0, 10)).toBe(0.5);
      expect(Arithmetic.normalize(0, 0, 10)).toBe(0);
      expect(Arithmetic.normalize(10, 0, 10)).toBe(1);
    });

    test('is the inverse of lerp', () => {
      expect(Arithmetic.lerp(20, 80, Arithmetic.normalize(50, 20, 80))).toBeCloseTo(50, 10);
    });

    test('returns 0 for a zero-width range', () => {
      expect(Arithmetic.normalize(5, 5, 5)).toBe(0);
    });
  });

  describe('sum()', () => {
    test('totals the values', () => {
      expect(Arithmetic.sum([1, 2, 3, 4])).toBe(10);
      expect(Arithmetic.sum([-1, 1])).toBe(0);
    });

    test('an empty list sums to 0', () => {
      expect(Arithmetic.sum([])).toBe(0);
    });
  });

  describe('mean()', () => {
    test('averages the values', () => {
      expect(Arithmetic.mean([1, 2, 3, 4])).toBe(2.5);
      expect(Arithmetic.mean([10])).toBe(10);
    });

    test('is NaN for an empty list rather than 0', () => {
      expect(Arithmetic.mean([])).toBeNaN();
    });
  });

  describe('median()', () => {
    test('returns the middle value of an odd-length list', () => {
      expect(Arithmetic.median([3, 1, 2])).toBe(2);
    });

    test('averages the two middle values of an even-length list', () => {
      expect(Arithmetic.median([1, 2, 3, 4])).toBe(2.5);
    });

    test('does not require sorted input', () => {
      expect(Arithmetic.median([9, 1, 5])).toBe(5);
    });

    test('does not mutate the input', () => {
      const values = [3, 1, 2];
      Arithmetic.median(values);

      expect(values).toEqual([3, 1, 2]);
    });

    test('is NaN for an empty list', () => {
      expect(Arithmetic.median([])).toBeNaN();
    });

    test('resists outliers that drag the mean', () => {
      const values = [1, 2, 3, 4, 1000];

      expect(Arithmetic.median(values)).toBe(3);
      expect(Arithmetic.mean(values)).toBe(202);
    });
  });

  describe('mode()', () => {
    test('returns the most frequent value', () => {
      expect(Arithmetic.mode([1, 2, 2, 3])).toEqual([2]);
    });

    test('returns every tied value in first-seen order', () => {
      expect(Arithmetic.mode([3, 1, 3, 1, 2])).toEqual([3, 1]);
    });

    test('returns every value when all are unique', () => {
      expect(Arithmetic.mode([1, 2, 3])).toEqual([1, 2, 3]);
    });

    test('returns an empty array for an empty list', () => {
      expect(Arithmetic.mode([])).toEqual([]);
    });

    test('handles more distinct values than fit in an argument list', () => {
      // Spreading the counts into Math.max() blows the stack well below this.
      const values = Array.from({ length: 200_000 }, (unused, i) => i);
      values.push(7);

      expect(Arithmetic.mode(values)).toEqual([7]);
    });
  });

  describe('variance() and stdDev()', () => {
    test('computes sample variance by default', () => {
      // Deviations from mean 5 are -3,-1,1,3 -> 9+1+1+9 = 20, over n-1 = 3.
      expect(Arithmetic.variance([2, 4, 6, 8])).toBeCloseTo(20 / 3, 10);
    });

    test('computes population variance when asked', () => {
      expect(Arithmetic.variance([2, 4, 6, 8], true)).toBe(5);
    });

    test('stdDev is the square root of the variance', () => {
      expect(Arithmetic.stdDev([2, 4, 6, 8], true)).toBe(Math.sqrt(5));
      expect(Arithmetic.stdDev([2, 4, 6, 8])).toBeCloseTo(Math.sqrt(20 / 3), 10);
    });

    test('identical values have zero spread', () => {
      expect(Arithmetic.variance([7, 7, 7], true)).toBe(0);
      expect(Arithmetic.stdDev([7, 7, 7], true)).toBe(0);
    });

    test('a single value has no sample variance', () => {
      expect(Arithmetic.variance([5])).toBeNaN();
      expect(Arithmetic.variance([5], true)).toBe(0);
    });

    test('is NaN for an empty list', () => {
      expect(Arithmetic.variance([])).toBeNaN();
      expect(Arithmetic.stdDev([])).toBeNaN();
    });
  });

  describe('percentile()', () => {
    test('returns the bounds at 0 and 100', () => {
      expect(Arithmetic.percentile([1, 2, 3, 4], 0)).toBe(1);
      expect(Arithmetic.percentile([1, 2, 3, 4], 100)).toBe(4);
    });

    test('interpolates between neighbouring values', () => {
      expect(Arithmetic.percentile([1, 2, 3, 4], 50)).toBe(2.5);
      expect(Arithmetic.percentile([1, 2, 3, 4], 25)).toBeCloseTo(1.75, 10);
    });

    test('hits exact values when the position lands on one', () => {
      expect(Arithmetic.percentile([1, 2, 3], 50)).toBe(2);
    });

    test('agrees with median at the 50th percentile', () => {
      const values = [5, 3, 9, 1, 7, 2];

      expect(Arithmetic.percentile(values, 50)).toBe(Arithmetic.median(values));
    });

    test('does not require sorted input and does not mutate it', () => {
      const values = [4, 1, 3, 2];

      expect(Arithmetic.percentile(values, 50)).toBe(2.5);
      expect(values).toEqual([4, 1, 3, 2]);
    });

    test('clamps a percentile outside 0..100', () => {
      expect(Arithmetic.percentile([1, 2, 3], 150)).toBe(3);
      expect(Arithmetic.percentile([1, 2, 3], -50)).toBe(1);
    });

    test('a single value is every percentile', () => {
      expect(Arithmetic.percentile([42], 0)).toBe(42);
      expect(Arithmetic.percentile([42], 99)).toBe(42);
    });

    test('is NaN for an empty list', () => {
      expect(Arithmetic.percentile([], 50)).toBeNaN();
    });
  });
});
