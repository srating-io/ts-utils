/* eslint-disable no-extend-native */
// npx jest test


import { jest } from '@jest/globals';
import { Dates } from '../../src/Dates.js';

describe('Dates', () => {
  describe('parse()', () => {
    it('returns roughly current time when input is undefined', () => {
      const before = new Date().getTime();
      const d = Dates.parse();
      const after = new Date().getTime();

      // Allow a small buffer for execution time
      expect(d.getTime()).toBeGreaterThanOrEqual(before);
      expect(d.getTime()).toBeLessThanOrEqual(after);
    });

    it('returns roughly current time when input is null', () => {
      const d = Dates.parse(null);
      expect(d).toBeInstanceOf(Date);
      // Basic check to ensure it's valid "now"
      expect(Date.now() - d.getTime()).toBeLessThan(100);
    });

    it('returns a clone when input is a Date object', () => {
      const original = new Date('2020-01-01T12:00:00');
      const clone = Dates.parse(original);

      expect(clone).not.toBe(original); // Different references
      expect(clone.getTime()).toBe(original.getTime()); // Same value
    });

    it('parses numeric timestamps correctly', () => {
      const timestamp = 1609459200000; // 2021-01-01 00:00:00 UTC
      const d = Dates.parse(timestamp);
      expect(d.getTime()).toBe(timestamp);
    });

    // --- 2. ISO Date (YYYY-MM-DD) Logic ---

    it('parses YYYY-MM-DD as Local Midnight (Fix for UTC assumption)', () => {
      // Standard JS `new Date('2025-11-03')` creates UTC midnight.
      // In EST (UTC-5), that is Nov 2nd 7pm.
      // Our parse() should force it to remain Nov 3rd 00:00 Local time.
      const str = '2025-11-03';
      const d = Dates.parse(str);

      expect(d.getFullYear()).toBe(2025);
      expect(d.getMonth()).toBe(10); // Nov is 10
      expect(d.getDate()).toBe(3);
      expect(d.getHours()).toBe(0);
      expect(d.getMinutes()).toBe(0);
    });

    // --- 3. US Date Format (MM/DD/YYYY) ---

    it('parses MM/DD/YYYY correctly', () => {
      const d = Dates.parse('11/03/2025');
      expect(d.getFullYear()).toBe(2025);
      expect(d.getMonth()).toBe(10); // Nov
      expect(d.getDate()).toBe(3);
    });

    it('parses M/D/YYYY (single digits) correctly', () => {
      const d = Dates.parse('1/5/2026');
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(0); // Jan
      expect(d.getDate()).toBe(5);
    });

    it('parses MM-DD-YYYY (dashes) correctly', () => {
      const d = Dates.parse('02-14-2024');
      expect(d.getFullYear()).toBe(2024);
      expect(d.getMonth()).toBe(1); // Feb
      expect(d.getDate()).toBe(14);
    });

    // --- 4. Complex Time Parsing (12h vs 24h) ---

    it('parses "YYYY-MM-DD HH:mm:ss" (24h format)', () => {
      const d = Dates.parse('2025-01-15 14:30:15');
      expect(d.getFullYear()).toBe(2025);
      expect(d.getDate()).toBe(15);
      expect(d.getHours()).toBe(14);
      expect(d.getMinutes()).toBe(30);
      expect(d.getSeconds()).toBe(15);
    });

    it('parses "MM/DD/YYYY HH:mm" (No seconds)', () => {
      const d = Dates.parse('01/15/2025 14:30');
      expect(d.getHours()).toBe(14);
      expect(d.getMinutes()).toBe(30);
      expect(d.getSeconds()).toBe(0);
    });

    it('parses "MM/DD/YYYY hh:mm am" (AM check)', () => {
      const d = Dates.parse('01/15/2025 09:15 am');
      expect(d.getHours()).toBe(9);
      expect(d.getMinutes()).toBe(15);
    });

    it('parses "MM/DD/YYYY hh:mm pm" (PM conversion)', () => {
      const d = Dates.parse('01/15/2025 02:45 pm');
      expect(d.getHours()).toBe(14); // 2 + 12
      expect(d.getMinutes()).toBe(45);
    });

    it('parses "12:00 pm" as Noon (12:00)', () => {
      const d = Dates.parse('01/15/2025 12:00 pm');
      expect(d.getHours()).toBe(12);
    });

    it('parses "12:00 am" as Midnight (00:00)', () => {
      const d = Dates.parse('01/15/2025 12:00 am');
      expect(d.getHours()).toBe(0);
    });

    it('parses "12:30 am" correctly (00:30)', () => {
      const d = Dates.parse('01/15/2025 12:30 am');
      expect(d.getHours()).toBe(0);
      expect(d.getMinutes()).toBe(30);
    });

    // --- 5. Tricky / Mixed Scenarios ---

    it('handles "23:03:19 pm" (Ignore PM because 23 > 12)', () => {
      // User typed 24h time but included "pm".
      // Should remain 23:03, not try to add 12 hours (invalid 35:00).
      const d = Dates.parse('2026-01-05 23:03:19 pm');
      expect(d.getFullYear()).toBe(2026);
      expect(d.getDate()).toBe(5);
      expect(d.getHours()).toBe(23);
      expect(d.getMinutes()).toBe(3);
      expect(d.getSeconds()).toBe(19);
    });

    it('handles "23:00 am" (Force to 23:00)', () => {
      // Technically contradictory input, but parser should prioritize the explicit hour
      // if it exceeds 12, treating the suffix as user error.
      const d = Dates.parse('2026-01-05 23:00 am');
      expect(d.getHours()).toBe(23);
    });

    it('handles mixed separators like "2025/01/05 5:00pm" (slash date + no space time)', () => {
      const d = Dates.parse('2025/01/05 5:00pm');
      expect(d.getFullYear()).toBe(2025);
      expect(d.getDate()).toBe(5);
      expect(d.getHours()).toBe(17); // 5 + 12
    });

    it('handles uppercase meridiem "5:00 PM"', () => {
      const d = Dates.parse('01/05/2025 5:00 PM');
      expect(d.getHours()).toBe(17);
    });

    it('handles ISO strings with timezone (fallback to native parse)', () => {
      // The manual regex skips complex ISO strings (T, Z), so it falls back to new Date()
      // which handles these correctly.
      const iso = '2025-01-15T10:30:00.000Z';
      const d = Dates.parse(iso, true);
      expect(d.toISOString()).toBe(iso);
    });

    // --- 6. Edge Cases & Failures ---

    it('returns "Now" for garbage strings', () => {
      // If regex fails AND new Date() is invalid, it returns new Date() (Now)
      const d = Dates.parse('this-is-not-a-date');
      const now = new Date();
      expect(Math.abs(d.getTime() - now.getTime())).toBeLessThan(100);
    });
  });

  describe('format()', () => {
    const date = new Date('2025-03-10T14:05:09Z'); // Monday, March 10, 2025 @ 14:05:09 UTC

    const getLocal = (d: Date) => ({
      year: String(d.getFullYear()),
      month: String(d.getMonth() + 1).padStart(2, '0'),
      day: String(d.getDate()).padStart(2, '0'),
      hours24: String(d.getHours()).padStart(2, '0'),
      hours12: String(((d.getHours() + 11) % 12) + 1).padStart(2, '0'),
      ampm: d.getHours() < 12 ? 'AM' : 'PM',
    });

    const local = getLocal(date);

    test('year formats: Y and y', () => {
      expect(Dates.format(date, 'Y')).toBe('2025');
      expect(Dates.format(date, 'y')).toBe('25');
    });

    test('month formats: m, n, M, F', () => {
      expect(Dates.format(date, 'm')).toBe('03'); // zero-padded
      expect(Dates.format(date, 'n')).toBe('3'); // non-padded
      expect(Dates.format(date, 'M')).toBe('Mar');
      expect(Dates.format(date, 'F')).toBe('March');
    });

    test('day formats: d, j, D, l, w, N', () => {
      expect(Dates.format(date, 'd')).toBe('10');
      expect(Dates.format(date, 'j')).toBe('10');
      expect(Dates.format(date, 'D')).toBe('Mon');
      expect(Dates.format(date, 'l')).toBe('Monday');
      expect(Dates.format(date, 'w')).toBe('1'); // 0=Sun, 1=Mon
      expect(Dates.format(date, 'N')).toBe('1'); // 1=Mon, 7=Sun
    });

    test('24-hour time formats: H, G', () => {
      expect(Dates.format(date, 'H')).toBe(local.hours24);
      expect(Dates.format(date, 'G')).toBe(String(Number(local.hours24)));
    });

    test('12-hour clock formats: h, g', () => {
      expect(Dates.format(date, 'h')).toBe(local.hours12);
      expect(Dates.format(date, 'g')).toBe(String(Number(local.hours12)));
    });

    test('AM/PM formats: A, a', () => {
      expect(Dates.format(date, 'A')).toBe(local.ampm);
      expect(Dates.format(date, 'a')).toBe(local.ampm.toLowerCase());
    });

    test('minute and second formats: i, s', () => {
      expect(Dates.format(date, 'i')).toBe('05');
      expect(Dates.format(date, 's')).toBe('09');
    });

    test('complex format strings', () => {
      const expected = `${local.year}-${local.month}-${local.day} ${local.hours24}:05:09`;
      expect(Dates.format(date, 'Y-m-d H:i:s')).toBe(expected);

      expect(Dates.format(date, 'F j, Y (D)'))
        .toBe('March 10, 2025 (Mon)');

      expect(Dates.format(date, String.raw`l \t\h\e \jS`))
        .toBe('Monday the jth');
    });

    test('escaping tokens with backslash', () => {
      expect(Dates.format(date, '\\Y \\m \\d')).toBe('Y m d');

      expect(Dates.format(date, String.raw`\H\H:i`))
        .toBe('HH:05');
    });

    test('midnight edge case', () => {
      // Local Midnight
      const midnight = new Date(2025, 2, 10, 0, 0, 0);
      expect(Dates.format(midnight, 'H')).toBe('00');
      expect(Dates.format(midnight, 'h')).toBe('12');
      expect(Dates.format(midnight, 'A')).toBe('AM');
    });

    test('noon edge case', () => {
      // Local Noon
      const noon = new Date(2025, 2, 10, 12, 0, 0);
      expect(Dates.format(noon, 'H')).toBe('12');
      expect(Dates.format(noon, 'A')).toBe('PM');
    });

    it('formats 12-hour time (h:i A) correctly', () => {
      // Midnight + 5 mins -> 12:05 AM
      const d = new Date(2025, 0, 1, 0, 5);
      expect(Dates.format(d, 'h:i A')).toBe('12:05 AM');
    });

    it('formats 12-hour noon (h:i A) correctly', () => {
      // Noon -> 12:00 PM
      const d = new Date(2025, 0, 1, 12, 0);
      expect(Dates.format(d, 'h:i A')).toBe('12:00 PM');
    });

    it('formats 24-hour time (H:i) correctly', () => {
      // 2:05 PM -> 14:05
      const d = new Date(2025, 0, 1, 14, 5);
      expect(Dates.format(d, 'H:i')).toBe('14:05');
    });

    it('formats standard date string (m/d/Y)', () => {
      const d = new Date(2025, 10, 25); // Nov 25 2025
      expect(Dates.format(d, 'm/d/Y')).toBe('11/25/2025');
    });

    it('formats ordinal suffix (S) correctly', () => {
      expect(Dates.format(new Date(2025, 0, 1), 'jS')).toBe('1st');
      expect(Dates.format(new Date(2025, 0, 2), 'jS')).toBe('2nd');
      expect(Dates.format(new Date(2025, 0, 3), 'jS')).toBe('3rd');
      expect(Dates.format(new Date(2025, 0, 4), 'jS')).toBe('4th');
      expect(Dates.format(new Date(2025, 0, 11), 'jS')).toBe('11th');
      expect(Dates.format(new Date(2025, 0, 21), 'jS')).toBe('21st');
    });

    it('formats full month and weekday tokens (l, F, j, Y)', () => {
      const testDate = new Date('2026-01-25 15:30:05'); // A Sunday in January
      expect(Dates.format(testDate, 'l, F j, Y')).toBe('Sunday, January 25, 2026');
    });

    it('handles short tokens (M, D, y)', () => {
      const testDate = new Date('2026-01-25 15:30:05'); // A Sunday in January
      expect(Dates.format(testDate, 'D, M j, y')).toBe('Sun, Jan 25, 26');
    });
  });

  describe('UTC Formatting (utc = true)', () => {
    // 2025-12-31 21:15:30 EST is 2026-01-01 02:15:30 UTC.
    // By picking a time that pushes the UTC date into a new day/year,
    // we can absolutely guarantee the formatter is using the UTC getters.
    const utcDate = new Date('2026-01-01T02:15:30Z');

    test('formats year, month, and day strictly in UTC', () => {
      // Even if the local timezone interprets this as Dec 31, 2025,
      // the UTC output must be Jan 1, 2026.
      expect(Dates.format(utcDate, 'Y-m-d', true)).toBe('2026-01-01');
      expect(Dates.format(utcDate, 'y-n-j', true)).toBe('26-1-1');
      expect(Dates.format(utcDate, 'F jS, Y', true)).toBe('January 1st, 2026');
      expect(Dates.format(utcDate, 'M j, Y (D)', true)).toBe('Jan 1, 2026 (Thu)');
    });

    test('formats 24-hour time strictly in UTC', () => {
      expect(Dates.format(utcDate, 'H:i:s', true)).toBe('02:15:30');
      expect(Dates.format(utcDate, 'G:i:s', true)).toBe('2:15:30');
    });

    test('formats 12-hour time and AM/PM strictly in UTC', () => {
      expect(Dates.format(utcDate, 'h:i:s A', true)).toBe('02:15:30 AM');
      expect(Dates.format(utcDate, 'g:i a', true)).toBe('2:15 am');
    });

    test('formats timezone abbreviation and identifier as UTC', () => {
      expect(Dates.format(utcDate, 'T', true)).toBe('UTC');
      expect(Dates.format(utcDate, 'e', true)).toBe('UTC');
    });

    test('afternoon PM conversion in UTC', () => {
      // 15:45 UTC
      const pmDate = new Date('2026-01-01T15:45:00Z');
      expect(Dates.format(pmDate, 'h:i A', true)).toBe('03:45 PM');
      expect(Dates.format(pmDate, 'H:i', true)).toBe('15:45');
    });

    test('midnight edge case in UTC', () => {
      // Exactly 00:00 UTC
      const midnight = new Date('2026-01-01T00:00:00Z');
      expect(Dates.format(midnight, 'h:i A', true)).toBe('12:00 AM');
      expect(Dates.format(midnight, 'H:i', true)).toBe('00:00');
    });

    test('noon edge case in UTC', () => {
      // Exactly 12:00 UTC
      const noon = new Date('2026-01-01T12:00:00Z');
      expect(Dates.format(noon, 'h:i A', true)).toBe('12:00 PM');
      expect(Dates.format(noon, 'H:i', true)).toBe('12:00');
    });

    test('preserves day of the week correctly in UTC', () => {
      // Jan 1, 2026 is a Thursday (4)
      expect(Dates.format(utcDate, 'l', true)).toBe('Thursday'); // Full weekday
      expect(Dates.format(utcDate, 'w', true)).toBe('4'); // 0-6 day of week
      expect(Dates.format(utcDate, 'N', true)).toBe('4'); // 1-7 ISO day of week
    });
  });

  describe('isSameDay() & Timezone Handling', () => {
    it('correctly identifies Sun Nov 02 23:00 vs Nov 03 as DIFFERENT days', () => {
      // This was the specific user complaint.
      // A late night event (Nov 2) should not be the same as the next calendar date (Nov 3).

      // Create a date that is late night Nov 2nd in local time
      const lateNight = new Date('2025-11-02T23:00:00');

      // Create the comparison target (Nov 3rd)
      const nextDay = '2025-11-03';

      expect(Dates.isSameDay(lateNight, nextDay)).toBe(false);
    });

    it('identifies same calendar days correctly regardless of time', () => {
      const morning = new Date('2025-11-02T08:00:00');
      const night = new Date('2025-11-02T23:00:00');
      expect(Dates.isSameDay(morning, night)).toBe(true);
    });

    it('handles string vs date object comparison', () => {
      const d1 = '2025-12-25';
      const d2 = new Date('2025-12-25T14:00:00');
      expect(Dates.isSameDay(d1, d2)).toBe(true);
    });
  });

  describe('add()', () => {
    it('adds days correctly', () => {
      const d = new Date('2025-03-10T00:00:00Z');
      const newDate = Dates.add(d, 3, 'days');

      expect(newDate.toISOString()).toBe('2025-03-13T00:00:00.000Z');
      expect(d.toISOString()).toBe('2025-03-10T00:00:00.000Z'); // immutability
    });

    it('adds hours correctly', () => {
      const d = new Date('2025-03-10T00:00:00Z');
      const newDate = Dates.add(d, 5, 'hours');

      expect(newDate.toISOString()).toBe('2025-03-10T05:00:00.000Z');
    });

    it('adds minutes correctly', () => {
      const d = new Date('2025-03-10T00:00:00Z');
      const newDate = Dates.add(d, 30, 'minutes');

      expect(newDate.toISOString()).toBe('2025-03-10T00:30:00.000Z');
    });

    it('adds days safely across DST changes', () => {
      // March 10, 2024 was DST start in US (skip forward 2am -> 3am)
      // Start: March 9th 10:00 AM
      const start = new Date(2024, 2, 9, 10, 0);

      // Add 2 days. Even if the day is only 23 hours long, it should result in March 11th 10:00 AM
      const result = Dates.add(start, 2, 'days');

      expect(result.getDate()).toBe(11);
      expect(result.getHours()).toBe(10); // Should preserve hour, not drift
    });

    it('adds months handling end-of-month overflow', () => {
      const jan31 = new Date('2024-01-31T12:00:00');
      const feb = Dates.add(jan31, 1, 'months');
      // Should be Feb 29 (Leap year)
      expect(feb.getMonth()).toBe(1); // Feb
      expect(feb.getDate()).toBe(29);
    });

    const START_DATE_MS = 1708008600000;
    const START_DATE = new Date(START_DATE_MS); // Fri Feb 15 2024 10:30:00 GMT

    // Helper to compare dates just by their string representation
    const dateToISOString = (date: Date) => date.toISOString();


    // --- Unit Tests for Millisecond-Based Units ---

    test('should add 30 minutes correctly', () => {
      const result = Dates.add(START_DATE, 30, 'minutes');
      // Expect: 11:00:00
      expect(dateToISOString(result)).toBe(new Date(START_DATE_MS + 30 * 60 * 1000).toISOString());
    });

    test('should subtract 2 hours correctly', () => {
      const result = Dates.add(START_DATE, -2, 'hours');
      // Expect: 08:30:00
      expect(dateToISOString(result)).toBe(new Date(START_DATE_MS - 2 * 60 * 60 * 1000).toISOString());
    });

    test('should add 5 days correctly (simple addition)', () => {
      const result = Dates.add(START_DATE, 5, 'days');
      // Expect: Wed Feb 20 2024 10:30:00
      expect(result.getDate()).toBe(20);
      expect(result.getMonth()).toBe(1); // February
    });

    test('should handle day rollover correctly (add 1 day to end of month)', () => {
      const start = new Date('2024-02-29T12:00:00.000Z'); // Leap day
      const result = Dates.add(start, 1, 'days');
      // Expect: Mar 1, 2024
      expect(result.getUTCFullYear()).toBe(2024);
      expect(result.getUTCMonth()).toBe(2); // March (0-indexed)
      expect(result.getUTCDate()).toBe(1);
    });

    // --- Unit Tests for 'months' ---

    test('should add 1 month correctly (simple addition)', () => {
      const result = Dates.add(START_DATE, 1, 'months');
      // Expect: Mar 15, 2024 (Note: Day of month is preserved)
      expect(result.getMonth()).toBe(2); // March
      expect(result.getDate()).toBe(15);
      expect(result.getFullYear()).toBe(2024);
    });

    test('should subtract 3 months correctly', () => {
      const result = Dates.add(START_DATE, -3, 'months');
      // Expect: Nov 15, 2023
      expect(result.getMonth()).toBe(10); // November (0-indexed)
      expect(result.getFullYear()).toBe(2023); // Year rollover handled
    });

    test('should handle year rollover correctly when adding months (Dec -> Jan)', () => {
      const start = new Date('2024-12-10T00:00:00.000Z');
      const result = Dates.add(start, 2, 'months');
      // Expect: Feb 10, 2025
      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getFullYear()).toBe(2025); // Year rolled over
    });

    test('should handle month-end overflow correctly (Jan 31 + 1 month -> Feb 29/28)', () => {
      // Start: Jan 31, 2024 (2024 is a leap year)
      const start2024 = new Date('2024-01-31T10:00:00.000Z');
      const result2024 = Dates.add(start2024, 1, 'months');
      // setMonth will automatically roll Jan 31 over to Feb 29 (the last day of Feb 2024)
      expect(result2024.getUTCMonth()).toBe(1); // February
      expect(result2024.getUTCDate()).toBe(29);

      // Start: Jan 31, 2023 (2023 is NOT a leap year)
      const start2023 = new Date('2023-01-31T10:00:00.000Z');
      const result2023 = Dates.add(start2023, 1, 'months');
      // It rolls Jan 31 over to Feb 28 (the last day of Feb 2023)
      expect(result2023.getUTCMonth()).toBe(1); // February
      expect(result2023.getUTCDate()).toBe(28);
    });

    // --- Immutability Test ---

    test('should not mutate the original date object', () => {
      const originalDate = new Date(START_DATE);
      Dates.add(originalDate, 5, 'days');
      // Ensure the original date's time is unchanged
      expect(originalDate.getTime()).toBe(START_DATE.getTime());
    });
  });

  describe('subtract()', () => {
    // Reference: March 15, 2025
    const baseDate = new Date('2025-03-15T10:00:00');

    it('subtracts years correctly', () => {
      const res = Dates.subtract(baseDate, 1, 'years');
      expect(res.getFullYear()).toBe(2024);
      expect(res.getMonth()).toBe(2); // March
      expect(res.getDate()).toBe(15);
    });

    it('subtracts months correctly', () => {
      const res = Dates.subtract(baseDate, 2, 'months');
      // March - 2 months = January
      expect(res.getMonth()).toBe(0); // Jan
      expect(res.getFullYear()).toBe(2025);
    });

    it('subtracts days correctly', () => {
      const res = Dates.subtract(baseDate, 5, 'days');
      expect(res.getDate()).toBe(10);
    });

    it('subtracts hours correctly', () => {
      const res = Dates.subtract(baseDate, 5, 'hours');
      expect(res.getHours()).toBe(5); // 10am - 5 = 5am
    });

    it('subtracts minutes correctly', () => {
      const res = Dates.subtract(baseDate, 30, 'minutes');
      expect(res.getHours()).toBe(9);
      expect(res.getMinutes()).toBe(30);
    });

    // --- Edge Cases ---

    it('handles Leap Year Reverse (Feb 29 -> Non-Leap Year)', () => {
      // Start: Feb 29, 2024 (Leap Year)
      const leapDay = new Date('2024-02-29T12:00:00');

      // Subtract 1 year -> Should be Feb 28, 2023 (Not Mar 1)
      const res = Dates.subtract(leapDay, 1, 'years');

      expect(res.getFullYear()).toBe(2023);
      expect(res.getMonth()).toBe(1); // Feb
      expect(res.getDate()).toBe(28); // Clamped to end of month
    });

    it('handles Month End Reverse (March 31 -> Feb 28)', () => {
      // Start: March 31, 2025
      const endOfMar = new Date('2025-03-31T12:00:00');

      // Subtract 1 month -> Should be Feb 28, 2025
      const res = Dates.subtract(endOfMar, 1, 'months');

      expect(res.getMonth()).toBe(1); // Feb
      expect(res.getDate()).toBe(28);
    });

    it('handles Year Rollover (Jan -> Dec)', () => {
      // Start: Jan 1, 2025
      const jan1 = new Date('2025-01-01T10:00:00');

      // Subtract 1 month -> Dec 1, 2024
      const res = Dates.subtract(jan1, 1, 'months');

      expect(res.getFullYear()).toBe(2024);
      expect(res.getMonth()).toBe(11); // Dec
    });
  });

  describe('fromNow()', () => {
    beforeAll(() => {
      jest.useFakeTimers({
        now: new Date('2025-03-10T12:00:00Z').getTime(),
      });
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("returns 'just now' for under 1 minute", () => {
      const d = new Date('2025-03-10T11:59:40Z');
      expect(Dates.fromNow(d)).toBe('just now');
    });

    it('returns minutes ago', () => {
      const d = new Date('2025-03-10T11:45:00Z');
      expect(Dates.fromNow(d)).toBe('15m ago');
    });

    it('returns hours ago', () => {
      const d = new Date('2025-03-10T09:00:00Z');
      expect(Dates.fromNow(d)).toBe('3h ago');
    });

    it('returns days ago', () => {
      const d = new Date('2025-03-07T12:00:00Z');
      expect(Dates.fromNow(d)).toBe('3d ago');
    });
  });

  describe('getClosestDate', () => {
    // Reference date: 2024-03-18T10:00:00.000Z (a point in time)
    const dateToMatch = '2024-03-18T12:00:00';

    it('finds exact match', () => {
      const dates = ['2024-03-10', '2024-03-18', '2024-03-18T12:00:00', '2024-04-01'];
      expect(Dates.getClosestDate(dateToMatch, dates)).toBe('2024-03-18T12:00:00');
    });

    it('picks the closer date regardless of direction', () => {
      const dates = [
        '2024-03-17T12:00:00', // 1 day away
        '2024-03-25T12:00:00', // 7 days away
      ];
      expect(Dates.getClosestDate(dateToMatch, dates)).toBe('2024-03-17T12:00:00');
    });

    it('Tie-Breaker: Picks the FUTURE date when equidistant', () => {
      // Reference: 18th
      // Options: 17th and 19th (both 24 hours away)
      const dates = [
        '2024-03-17T12:00:00',
        '2024-03-19T12:00:00',
      ];

      // Should pick 19th per Todo requirement
      expect(Dates.getClosestDate(dateToMatch, dates)).toBe('2024-03-19T12:00:00');
    });

    it('Tie-Breaker: Picks the FUTURE date even if array order is reversed', () => {
      const dates = [
        '2024-03-19T12:00:00',
        '2024-03-17T12:00:00',
      ];
      expect(Dates.getClosestDate(dateToMatch, dates)).toBe('2024-03-19T12:00:00');
    });

    // Test 1: Simple case - the closest date is clear
    test('should return the single closest date', () => {
      const matchUTC = '2024-03-18T10:00:00.000Z';
      const dates = [
        '2024-03-20T00:00:00.000Z', // 1 day, 14 hours away
        '2024-03-17T00:00:00.000Z', // 1 day, 10 hours away (Closest)
        '2024-03-25T00:00:00.000Z', // Much further
      ];
        // The time difference (absolute value) is what matters
      expect(Dates.getClosestDate(matchUTC, dates)).toBe('2024-03-17T00:00:00.000Z');
    });

    // Test 2: Two dates equidistant - should pick the one that appears second in the array
    test('should pick the second equidistant date if all times are identical', () => {
      const dates = [
        '2024-03-17T10:00:00.000Z', // 1 day before
        '2024-03-19T10:00:00.000Z', // 1 day after
      ];
        // The implementation logic favors the one found second or if distance is equal (dist <= closestDist)
      expect(Dates.getClosestDate(dateToMatch, dates)).toBe('2024-03-19T10:00:00.000Z');
    });

    // Test 3: Two dates equidistant (but day-only strings) - should pick the second one due to sorting or implementation detail
    // This is the scenario mentioned in the original code's comment.
    // dateToMatch '2024-03-18' (defaults to 2024-03-18T00:00:00.000Z)
    test('should pick the future day (2024-03-19) when equidistant day-strings are used (implementation detail)', () => {
      const dateToMatchDay = '2024-03-18';
      const dates = [
        '2024-03-17', // dist: 1 day (parsed as 17th midnight)
        '2024-03-19', // dist: 1 day (parsed as 19th midnight)
      ];
        // The current implementation uses `dist <= closestDist`.
        // 1. First iteration: closestDist = 1 day, closestDate = '2024-03-17'
        // 2. Second iteration: dist = 1 day. Since (1 <= 1) is true, it updates.
      expect(Dates.getClosestDate(dateToMatchDay, dates)).toBe('2024-03-19');
    });

    // Test 4: Equidistant with one having a closer time component
    // dateToMatch: 2024-03-18T10:00:00.000Z
    test('should pick the date with the closest time if days are different', () => {
      const matchLocal = '2024-03-18T10:00:00';
      const dates = [
        '2024-03-17T12:00:00', // 22 hours away (closer)
        '2024-03-19T14:00:00', // 28 hours away (further)
      ];
      expect(Dates.getClosestDate(matchLocal, dates)).toBe('2024-03-17T12:00:00');
    });

    // Test 5: Empty array
    test('should return null for an empty array', () => {
      expect(Dates.getClosestDate(dateToMatch, [])).toBeNull();
    });

    // Test 6: Array with a single date
    test('should return the single date in the array', () => {
      const singleDate = '2024-03-18T12:00:00.000Z';
      expect(Dates.getClosestDate(dateToMatch, [singleDate])).toBe(singleDate);
    });

    // Test 7: Match date is in the array
    test('should return the match date if it exists in the array', () => {
      const dates = [
        '2024-03-17T00:00:00.000Z',
        dateToMatch, // dist = 0
        '2024-03-19T00:00:00.000Z',
      ];
      expect(Dates.getClosestDate(dateToMatch, dates)).toBe(dateToMatch);
    });
  });

  describe('Grid and Start Helpers', () => {
    it('getStartOfDay sets time to 00:00:00 local', () => {
      const d = new Date('2025-05-15T14:30:45');
      const start = Dates.getStartOfDay(d);
      expect(start.getFullYear()).toBe(2025);
      expect(start.getMonth()).toBe(4); // May
      expect(start.getDate()).toBe(15);
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
    });

    it('getStartOfMonth sets date to 1st and time to 00:00:00', () => {
      const d = new Date('2025-05-15T14:30:45');
      const start = Dates.getStartOfMonth(d);
      expect(start.getFullYear()).toBe(2025);
      expect(start.getMonth()).toBe(4);
      expect(start.getDate()).toBe(1);
      expect(start.getHours()).toBe(0);
    });

    it('getStartOfGrid correctly finds the preceding Sunday', () => {
      // May 15, 2025 is a Thursday.
      // May 1st, 2025 is a Thursday.
      // The preceding Sunday for the grid start is April 27th, 2025.
      const d = new Date('2025-05-15T10:00:00');
      const gridStart = Dates.getStartOfGrid(d);

      expect(gridStart.getFullYear()).toBe(2025);
      expect(gridStart.getMonth()).toBe(3); // April
      expect(gridStart.getDate()).toBe(27);
      expect(gridStart.getDay()).toBe(0); // Sunday
      expect(gridStart.getHours()).toBe(0);
    });

    it('does not mutate the original date object in helpers', () => {
      const original = new Date('2025-05-15T14:30:45');
      const originalMs = original.getTime();

      Dates.getStartOfMonth(original);
      Dates.getStartOfDay(original);
      Dates.getStartOfGrid(original);

      expect(original.getTime()).toBe(originalMs);
    });
  });

  describe('Comparison Helpers (isBeforeDay, isAfterDay)', () => {
    const early = '2025-10-10T08:00:00';
    const late = '2025-10-10T23:00:00';
    const nextDay = '2025-10-11T08:00:00';

    it('isBeforeDay evaluates based on calendar day, ignoring time', () => {
      expect(Dates.isBeforeDay(early, late)).toBe(false); // Same day
      expect(Dates.isBeforeDay(late, nextDay)).toBe(true); // Different day
    });

    it('isAfterDay evaluates based on calendar day, ignoring time', () => {
      expect(Dates.isAfterDay(late, early)).toBe(false); // Same day
      expect(Dates.isAfterDay(nextDay, late)).toBe(true); // Different day
    });
  });

  describe('UTC Parsing Bug Fix Tests', () => {
    it('forces UTC midnight when strict ISO string is passed with utc flag', () => {
      const d = Dates.parse('2025-11-03', true);
      expect(d.getUTCFullYear()).toBe(2025);
      expect(d.getUTCMonth()).toBe(10);
      expect(d.getUTCDate()).toBe(3);
      expect(d.getUTCHours()).toBe(0);
    });
  });


  describe('isDST()', () => {
    let originalGetTimezoneOffset: () => number;

    beforeAll(() => {
      // Save the original method to restore it after tests run
      originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
    });

    afterEach(() => {
      // Clean up the mock after each test block
      Date.prototype.getTimezoneOffset = originalGetTimezoneOffset;
    });

    it('returns true during Daylight Saving Time and false during Standard Time', () => {
      // Mock a US Eastern environment:
      // Standard Time (Jan) = 300 mins behind UTC. Daylight Time (Jul) = 240 mins behind UTC.
      Date.prototype.getTimezoneOffset = jest.fn(function (this: Date) {
        const month = this.getMonth();
        return month === 6 ? 240 : 300;
      });

      // July 15th should be recognized as DST (EDT)
      const summerDate = new Date(2026, 6, 15);
      expect(Dates.isDST(summerDate)).toBe(true);

      // January 15th should be recognized as Standard Time (EST)
      const winterDate = new Date(2026, 0, 15);
      expect(Dates.isDST(winterDate)).toBe(false);
    });

    it('handles alternative input types (strings and timestamps)', () => {
      // Force a consistent timezone offset mapping for the test
      Date.prototype.getTimezoneOffset = jest.fn(function (this: Date) {
        return this.getMonth() === 6 ? 240 : 300;
      });

      // Should parse string inputs correctly
      expect(Dates.isDST('2026-07-15')).toBe(true);
      expect(Dates.isDST('2026-01-15')).toBe(false);

      // Should parse numerical timestamps correctly
      const summerTimestamp = new Date(2026, 6, 15).getTime();
      expect(Dates.isDST(summerTimestamp)).toBe(true);
    });

    it('defaults to the current date when no input is provided', () => {
      // 1. Use fake timers to set system "now" to mid-summer without breaking the Date constructor
      jest.useFakeTimers({
        now: new Date(2026, 6, 15, 12, 0, 0).getTime(), // July 15, 2026
      });

      // 2. Mock timezone offsets for a standard US Eastern environment
      Date.prototype.getTimezoneOffset = jest.fn(function (this: Date) {
        // 'this' correctly points to the specific date instance being evaluated
        return this.getMonth() === 6 ? 240 : 300;
      });

      // 3. This will now correctly evaluate July (240) < January baseline (300)
      expect(Dates.isDST()).toBe(true);

      // 4. Clean up fake timers so it doesn't bleed into other tests
      jest.useRealTimers();
    });
  });

  describe('getPartsInZone()', () => {
    // A specific fixed instant: 2026-06-01T06:30:00Z (6:30 AM UTC)
    // - In New York (EDT, UTC-4), this is 2026-06-01 at 02:30 AM
    // - In London (BST, UTC+1), this is 2026-06-01 at 07:30 AM
    // - In Tokyo (JST, UTC+9), this is 2026-06-01 at 03:30 PM (15:30)
    const testInstant = new Date('2026-06-01T06:30:00Z');

    it('correctly extracts components for US Eastern Time (EDT)', () => {
      const parts = Dates.getPartsInZone(testInstant, 'America/New_York');

      expect(parts.year).toBe(2026);
      expect(parts.month).toBe(6); // June
      expect(parts.day).toBe(1);
      expect(parts.hour).toBe(2); // 2 AM
      expect(parts.minute).toBe(30);
    });

    it('handles different days across timezones for the same instant', () => {
      // 2026-05-31T23:30:00Z (11:30 PM UTC)
      // - In New York (EDT, UTC-4), it is still May 31st (19:30)
      // - In Tokyo (JST, UTC+9), it has jumped ahead to June 1st (08:30)
      const boundaryInstant = new Date('2026-05-31T23:30:00Z');

      const nyParts = Dates.getPartsInZone(boundaryInstant, 'America/New_York');
      const tokyoParts = Dates.getPartsInZone(boundaryInstant, 'Asia/Tokyo');

      // New York verification
      expect(nyParts.month).toBe(5);
      expect(nyParts.day).toBe(31);
      expect(nyParts.hour).toBe(19);

      // Tokyo verification
      expect(tokyoParts.month).toBe(6);
      expect(tokyoParts.day).toBe(1);
      expect(tokyoParts.hour).toBe(8);
    });

    it('correctly handles midnight as hour 0', () => {
      // 2026-06-01T04:00:00Z -> Exactly midnight in New York
      const midnightInstant = new Date('2026-06-01T04:00:00Z');
      const parts = Dates.getPartsInZone(midnightInstant, 'America/New_York');

      expect(parts.hour).toBe(0);
      expect(parts.minute).toBe(0);
    });

    it('defaults to the current time if no date argument is provided', () => {
      const before = new Date().getTime();
      const parts = Dates.getPartsInZone(null, 'America/New_York');
      const after = new Date().getTime();

      // Convert back to a timestamp to ensure it's fresh "now"
      const generatedDate = new Date(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
      );

      // The runtime's local offset variation might shift the exact hour,
      // but it should fundamentally represent an active valid time snapshot.
      expect(generatedDate.getTime()).toBeGreaterThanOrEqual(before - 36000000); // broad zone window
      expect(generatedDate.getTime()).toBeLessThanOrEqual(after + 36000000);
    });
  });
  describe('Dates.diff', () => {
    beforeEach(() => {
      // Freeze system time at a fixed point for deterministic tests when date2 is omitted
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-01-05T12:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    describe('Basic Time Calculations (date1 > date2)', () => {
      it('calculates positive differences correctly', () => {
        const d1 = '2026-01-05T13:30:45.000Z';
        const d2 = '2026-01-05T12:00:00.000Z';

        const result = Dates.diff(d1, d2, true);

        expect(result.milliseconds).toBe(5445000);
        expect(result.seconds).toBe(5445);
        expect(result.minutes).toBe(90);
        expect(result.hours).toBe(1);
        expect(result.days).toBe(0);
        expect(result.weeks).toBe(0);
      });

      it('calculates multi-day and multi-week differences', () => {
        const d1 = '2026-01-19T12:00:00.000Z';
        const d2 = '2026-01-05T12:00:00.000Z';

        const result = Dates.diff(d1, d2, true);

        expect(result.days).toBe(14);
        expect(result.weeks).toBe(2);
      });
    });

    describe('Negative Differences (date1 < date2)', () => {
      it('returns negative numbers for past dates', () => {
        const d1 = '2026-01-05T10:30:00.000Z';
        const d2 = '2026-01-05T12:00:00.000Z';

        const result = Dates.diff(d1, d2, true);

        expect(result.milliseconds).toBe(-5400000);
        expect(result.minutes).toBe(-90);
        expect(result.hours).toBe(-1);
      });

      it('populates absolute values correctly under .abs', () => {
        const d1 = '2026-01-05T10:30:00.000Z';
        const d2 = '2026-01-05T12:00:00.000Z';

        const result = Dates.diff(d1, d2, true);

        expect(result.minutes).toBe(-90);
        expect(result.abs.minutes).toBe(90);
        expect(result.abs.milliseconds).toBe(5400000);
      });
    });

    describe('Calendar Differences (Months and Years)', () => {
      it('calculates calendar month differences across boundaries', () => {
        const d1 = '2026-03-15T00:00:00.000Z';
        const d2 = '2025-11-15T00:00:00.000Z';

        const result = Dates.diff(d1, d2, true);

        expect(result.months).toBe(4);
        expect(result.years).toBe(1);
      });

      it('handles negative month/year differences', () => {
        const d1 = '2024-05-10T00:00:00.000Z';
        const d2 = '2026-01-10T00:00:00.000Z';

        const result = Dates.diff(d1, d2, true);

        expect(result.months).toBe(-20);
        expect(result.years).toBe(-2);
        expect(result.abs.months).toBe(20);
        expect(result.abs.years).toBe(2);
      });
    });

    describe('Default Parameters & Input Formats', () => {
      it('defaults date2 to current time when omitted', () => {
        // Mocked system time is 2026-01-05T12:00:00.000Z
        const futureDate = '2026-01-05T12:15:00.000Z';

        const result = Dates.diff(futureDate, undefined, true);

        expect(result.minutes).toBe(15);
      });

      it('accepts Date objects, numbers (timestamps), and strings', () => {
        const d1Date = new Date('2026-01-05T13:00:00.000Z');
        const d2Timestamp = new Date('2026-01-05T12:00:00.000Z').getTime();

        const result = Dates.diff(d1Date, d2Timestamp, true);

        expect(result.hours).toBe(1);
      });

      it('returns zero for identical dates', () => {
        const dateStr = '2026-01-05 12:00:00';
        const result = Dates.diff(dateStr, dateStr);

        expect(result.milliseconds).toBe(0);
        expect(result.seconds).toBe(0);
        expect(result.minutes).toBe(0);
        expect(result.abs.minutes).toBe(0);
      });
    });
  });
});
