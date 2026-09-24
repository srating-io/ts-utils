/* eslint-disable no-restricted-syntax */
import { Numbers } from '../../src/Numbers.js';

describe('Numbers', () => {
  describe('ordinalSuffix()', () => {
    test('handles the 1st/2nd/3rd pattern', () => {
      expect(Numbers.ordinalSuffix(1)).toBe('st');
      expect(Numbers.ordinalSuffix(2)).toBe('nd');
      expect(Numbers.ordinalSuffix(3)).toBe('rd');
      expect(Numbers.ordinalSuffix(4)).toBe('th');
    });

    test('handles the 11/12/13 exceptions', () => {
      expect(Numbers.ordinalSuffix(11)).toBe('th');
      expect(Numbers.ordinalSuffix(12)).toBe('th');
      expect(Numbers.ordinalSuffix(13)).toBe('th');
    });

    test('handles the 21/22/23 return to the pattern', () => {
      expect(Numbers.ordinalSuffix(21)).toBe('st');
      expect(Numbers.ordinalSuffix(22)).toBe('nd');
      expect(Numbers.ordinalSuffix(23)).toBe('rd');
    });

    test('handles 111/112/113, which follow the teens rule again', () => {
      expect(Numbers.ordinalSuffix(111)).toBe('th');
      expect(Numbers.ordinalSuffix(112)).toBe('th');
      expect(Numbers.ordinalSuffix(113)).toBe('th');
      expect(Numbers.ordinalSuffix(101)).toBe('st');
    });

    test('handles zero and negatives', () => {
      expect(Numbers.ordinalSuffix(0)).toBe('th');
      expect(Numbers.ordinalSuffix(-1)).toBe('st');
    });
  });

  describe('formatOrdinal()', () => {
    test('attaches the suffix', () => {
      expect(Numbers.formatOrdinal(1)).toBe('1st');
      expect(Numbers.formatOrdinal(2)).toBe('2nd');
      expect(Numbers.formatOrdinal(3)).toBe('3rd');
      expect(Numbers.formatOrdinal(11)).toBe('11th');
      expect(Numbers.formatOrdinal(23)).toBe('23rd');
    });

    test('truncates a fractional rank', () => {
      expect(Numbers.formatOrdinal(3.7)).toBe('3rd');
    });
  });

  describe('format()', () => {
    test('groups thousands', () => {
      expect(Numbers.format(1234567)).toBe('1,234,567');
      expect(Numbers.format(999)).toBe('999');
    });

    test('applies a fixed number of decimals', () => {
      expect(Numbers.format(1234.5, 2)).toBe('1,234.50');
      expect(Numbers.format(1234.567, 2)).toBe('1,234.57');
    });

    test('keeps natural decimals when none are requested', () => {
      expect(Numbers.format(1234.5)).toBe('1,234.5');
    });

    test('handles negatives and zero', () => {
      expect(Numbers.format(-1234)).toBe('-1,234');
      expect(Numbers.format(0)).toBe('0');
    });

    test('passes non-finite values through', () => {
      expect(Numbers.format(NaN)).toBe('NaN');
      expect(Numbers.format(Infinity)).toBe('Infinity');
    });
  });

  describe('formatSigned()', () => {
    test('prefixes positives with a plus', () => {
      expect(Numbers.formatSigned(3)).toBe('+3');
      expect(Numbers.formatSigned(1234)).toBe('+1,234');
    });

    test('leaves the native minus on negatives', () => {
      expect(Numbers.formatSigned(-3)).toBe('-3');
    });

    test('leaves zero unsigned', () => {
      expect(Numbers.formatSigned(0)).toBe('0');
    });

    test('honours decimals', () => {
      expect(Numbers.formatSigned(2.5, 1)).toBe('+2.5');
    });
  });

  describe('formatCompact()', () => {
    test('leaves values under a thousand alone', () => {
      expect(Numbers.formatCompact(999)).toBe('999');
      expect(Numbers.formatCompact(0)).toBe('0');
    });

    test('shortens thousands, millions, billions and trillions', () => {
      expect(Numbers.formatCompact(1234)).toBe('1.2K');
      expect(Numbers.formatCompact(1_500_000)).toBe('1.5M');
      expect(Numbers.formatCompact(2_000_000_000)).toBe('2B');
      expect(Numbers.formatCompact(3_500_000_000_000)).toBe('3.5T');
    });

    test('trims a trailing .0 on whole magnitudes', () => {
      expect(Numbers.formatCompact(2_000_000)).toBe('2M');
      expect(Numbers.formatCompact(1000)).toBe('1K');
    });

    test('honours the decimal count', () => {
      expect(Numbers.formatCompact(1234, 2)).toBe('1.23K');
      expect(Numbers.formatCompact(1234, 0)).toBe('1K');
    });

    test('handles negatives', () => {
      expect(Numbers.formatCompact(-1234)).toBe('-1.2K');
    });

    test('switches unit exactly at the threshold', () => {
      expect(Numbers.formatCompact(999_999)).toBe('1000K');
      expect(Numbers.formatCompact(1_000_000)).toBe('1M');
    });

    test('passes non-finite values through', () => {
      expect(Numbers.formatCompact(NaN)).toBe('NaN');
      expect(Numbers.formatCompact(Infinity)).toBe('Infinity');
      expect(Numbers.formatCompact(-Infinity)).toBe('-Infinity');
    });
  });

  describe('formatPercent()', () => {
    test('treats the input as a ratio by default', () => {
      expect(Numbers.formatPercent(0.1234)).toBe('12.3%');
      expect(Numbers.formatPercent(1)).toBe('100.0%');
      expect(Numbers.formatPercent(0)).toBe('0.0%');
    });

    test('accepts an already-scaled percentage', () => {
      expect(Numbers.formatPercent(12.34, 1, false)).toBe('12.3%');
    });

    test('honours the decimal count', () => {
      expect(Numbers.formatPercent(0.12345, 2)).toBe('12.35%');
      expect(Numbers.formatPercent(0.5, 0)).toBe('50%');
    });

    test('handles ratios above 1 and below 0', () => {
      expect(Numbers.formatPercent(1.5)).toBe('150.0%');
      expect(Numbers.formatPercent(-0.25)).toBe('-25.0%');
    });

    test('passes non-finite values through', () => {
      expect(Numbers.formatPercent(NaN)).toBe('NaN');
      expect(Numbers.formatPercent(Infinity)).toBe('Infinity');
      expect(Numbers.formatPercent(-Infinity)).toBe('-Infinity');
    });
  });

  describe('formatDuration()', () => {
    test('renders the two largest units by default', () => {
      expect(Numbers.formatDuration(3_725_000)).toBe('1h 2m');
    });

    test('renders more units when asked', () => {
      expect(Numbers.formatDuration(3_725_000, 3)).toBe('1h 2m 5s');
    });

    test('handles sub-second durations', () => {
      expect(Numbers.formatDuration(500)).toBe('500ms');
      expect(Numbers.formatDuration(0)).toBe('0ms');
    });

    test('drops trailing zero units', () => {
      expect(Numbers.formatDuration(5000, 5)).toBe('5s');
      expect(Numbers.formatDuration(3_600_000, 5)).toBe('1h');
      expect(Numbers.formatDuration(86_400_000, 5)).toBe('1d');
    });

    test('handles seconds and minutes', () => {
      expect(Numbers.formatDuration(5000)).toBe('5s');
      expect(Numbers.formatDuration(65_000)).toBe('1m 5s');
    });

    test('handles days', () => {
      expect(Numbers.formatDuration(90_000_000)).toBe('1d 1h');
    });

    test('keeps interior zero units', () => {
      // Exactly one hour and five seconds: the zero minutes must not collapse.
      expect(Numbers.formatDuration(3_605_000, 3)).toBe('1h 0m 5s');
    });

    test('handles negatives', () => {
      expect(Numbers.formatDuration(-65_000)).toBe('-1m 5s');
    });

    test('passes non-finite values through', () => {
      expect(Numbers.formatDuration(NaN)).toBe('NaN');
      expect(Numbers.formatDuration(Infinity)).toBe('Infinity');
      expect(Numbers.formatDuration(-Infinity)).toBe('-Infinity');
    });
  });

  describe('formatBytes()', () => {
    test('leaves raw byte counts alone', () => {
      expect(Numbers.formatBytes(0)).toBe('0 B');
      expect(Numbers.formatBytes(512)).toBe('512 B');
      expect(Numbers.formatBytes(1023)).toBe('1023 B');
    });

    test('uses binary steps', () => {
      expect(Numbers.formatBytes(1024)).toBe('1 KB');
      expect(Numbers.formatBytes(1536)).toBe('1.5 KB');
      expect(Numbers.formatBytes(1024 * 1024)).toBe('1 MB');
      expect(Numbers.formatBytes(1024 ** 3)).toBe('1 GB');
    });

    test('honours the decimal count', () => {
      expect(Numbers.formatBytes(1536, 2)).toBe('1.5 KB');
      expect(Numbers.formatBytes(1600, 2)).toBe('1.56 KB');
    });

    test('caps at the largest known unit', () => {
      expect(Numbers.formatBytes(1024 ** 6)).toBe('1024 PB');
    });

    test('handles negatives', () => {
      expect(Numbers.formatBytes(-1536)).toBe('-1.5 KB');
    });

    test('passes non-finite values through', () => {
      expect(Numbers.formatBytes(NaN)).toBe('NaN');
      expect(Numbers.formatBytes(Infinity)).toBe('Infinity');
      expect(Numbers.formatBytes(-Infinity)).toBe('-Infinity');
    });
  });

  describe('formatter caching', () => {
    test('keeps locales apart', () => {
      expect(Numbers.format(1234.5, 2, 'en-US')).toBe('1,234.50');
      expect(Numbers.format(1234.5, 2, 'de-DE')).toBe('1.234,50');
      expect(Numbers.format(1234.5, 2, 'en-US')).toBe('1,234.50');
    });

    test('keeps precisions apart within one locale', () => {
      expect(Numbers.format(1234.5678, 2)).toBe('1,234.57');
      expect(Numbers.format(1234.5678, 0)).toBe('1,235');
      expect(Numbers.format(1234.5678)).toBe('1,234.5678');
      expect(Numbers.format(1234.5678, 2)).toBe('1,234.57');
    });
  });
});
