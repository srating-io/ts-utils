/* eslint-disable no-bitwise */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable no-restricted-syntax */
import { jest } from '@jest/globals';
import { uuidService } from '../../src/UuidService.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const timestampOf = (bytes: Uint8Array): number =>
  bytes[0] * 2 ** 40 +
  bytes[1] * 2 ** 32 +
  bytes[2] * 2 ** 24 +
  bytes[3] * 2 ** 16 +
  bytes[4] * 2 ** 8 +
  bytes[5];

const counterOf = (bytes: Uint8Array): number => ((bytes[6] & 0x0f) << 8) | bytes[7];

describe('uuidService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateUUIDv7Bytes()', () => {
    test('returns 16 bytes', () => {
      expect(uuidService.generateUUIDv7Bytes()).toHaveLength(16);
    });

    test('sets the version nibble to 7', () => {
      const bytes = uuidService.generateUUIDv7Bytes();

      expect(bytes[6] >> 4).toBe(0x7);
    });

    test('sets the RFC 4122 variant bits', () => {
      const bytes = uuidService.generateUUIDv7Bytes();

      expect(bytes[8] >> 6).toBe(0b10);
    });

    test('encodes the current time in the leading 48 bits', () => {
      const before = Date.now();
      const bytes = uuidService.generateUUIDv7Bytes();
      const after = Date.now();

      const timestamp = timestampOf(bytes);

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after + 1);
    });

    test('produces distinct values', () => {
      const seen = new Set<string>();

      for (let i = 0; i < 200; i++) {
        seen.add(uuidService.binToUuid(uuidService.generateUUIDv7Bytes()));
      }

      expect(seen.size).toBe(200);
    });

    // uuidService is a singleton that remembers the highest timestamp it has
    // seen, so mocked clocks have to stay ahead of real time (and of each
    // other) or the generator treats them as a backwards jump.
    let clock = 4_000_000_000_000;
    const freezeClockAt = (value: number) => {
      jest.spyOn(Date, 'now').mockReturnValue(value);
    };
    const nextClockBase = () => {
      clock += 60_000;
      return clock;
    };

    test('is monotonic when the clock is frozen', () => {
      freezeClockAt(nextClockBase());

      const first = uuidService.generateUUIDv7Bytes();
      const second = uuidService.generateUUIDv7Bytes();
      const third = uuidService.generateUUIDv7Bytes();

      expect(timestampOf(second)).toBe(timestampOf(first));
      expect(counterOf(first)).toBe(0);
      expect(counterOf(second)).toBe(counterOf(first) + 1);
      expect(counterOf(third)).toBe(counterOf(second) + 1);
    });

    test('stays monotonic when the clock jumps backwards', () => {
      const base = nextClockBase();
      freezeClockAt(base);
      const first = uuidService.generateUUIDv7Bytes();

      // NTP rollback: the wall clock moves back a full second.
      freezeClockAt(base - 1_000);
      const second = uuidService.generateUUIDv7Bytes();

      expect(timestampOf(second)).toBeGreaterThanOrEqual(timestampOf(first));
      expect(counterOf(second)).toBeGreaterThan(counterOf(first));
    });

    test('resets the counter when the clock advances', () => {
      const base = nextClockBase();
      freezeClockAt(base);
      uuidService.generateUUIDv7Bytes();
      uuidService.generateUUIDv7Bytes();

      freezeClockAt(base + 1_000);
      const next = uuidService.generateUUIDv7Bytes();

      expect(counterOf(next)).toBe(0);
    });

    test('sorts lexicographically in creation order', () => {
      const ids: string[] = [];
      for (let i = 0; i < 25; i++) {
        ids.push(uuidService.binToUuid(uuidService.generateUUIDv7Bytes()));
      }

      expect([...ids].sort()).toEqual(ids);
    });
  });

  describe('binToUuid()', () => {
    test('formats 16 bytes as a dashed UUID string', () => {
      const bytes = new Uint8Array([
        0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0x7c, 0xde,
        0x8f, 0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd,
      ]);

      expect(uuidService.binToUuid(bytes)).toBe('01234567-89ab-7cde-8f01-23456789abcd');
    });

    test('zero-pads single-digit bytes', () => {
      expect(uuidService.binToUuid(new Uint8Array(16))).toBe('00000000-0000-0000-0000-000000000000');
    });

    test('rejects buffers that are not exactly 16 bytes', () => {
      expect(() => uuidService.binToUuid(new Uint8Array(15))).toThrow('UUID buffer must contain exactly 16 bytes.');
      expect(() => uuidService.binToUuid(new Uint8Array(17))).toThrow('UUID buffer must contain exactly 16 bytes.');
    });

    test('always emits the canonical 8-4-4-4-12 shape', () => {
      expect(uuidService.binToUuid(uuidService.generateUUIDv7Bytes())).toMatch(UUID_PATTERN);
    });
  });

  describe('isValid()', () => {
    test('accepts a dashed UUID', () => {
      expect(uuidService.isValid('01234567-89ab-7cde-8f01-23456789abcd')).toBe(true);
    });

    test('accepts a bare 32-character hex string', () => {
      expect(uuidService.isValid('0123456789ab7cde8f0123456789abcd')).toBe(true);
    });

    test('is case insensitive', () => {
      expect(uuidService.isValid('01234567-89AB-7CDE-8F01-23456789ABCD')).toBe(true);
    });

    test('rejects the wrong length', () => {
      expect(uuidService.isValid('')).toBe(false);
      expect(uuidService.isValid('01234567-89ab-7cde-8f01-23456789abc')).toBe(false);
      expect(uuidService.isValid('01234567-89ab-7cde-8f01-23456789abcde')).toBe(false);
    });

    test('rejects non-hex characters', () => {
      expect(uuidService.isValid('zzzzzzzz-89ab-7cde-8f01-23456789abcd')).toBe(false);
      expect(uuidService.isValid('not-a-uuid')).toBe(false);
    });

    test('accepts anything generated here', () => {
      for (let i = 0; i < 10; i++) {
        expect(uuidService.isValid(uuidService.binToUuid(uuidService.generateUUIDv7Bytes()))).toBe(true);
      }
    });

    test('agrees with what uuidToBin accepts', () => {
      const candidates = [
        '01234567-89ab-7cde-8f01-23456789abcd',
        '0123456789ab7cde8f0123456789abcd',
        'not-a-uuid',
        '',
      ];

      for (const candidate of candidates) {
        const valid = uuidService.isValid(candidate);
        let parsed = true;
        try {
          uuidService.uuidToBin(candidate);
        } catch {
          parsed = false;
        }

        expect(valid).toBe(parsed);
      }
    });
  });

  describe('uuidToBin()', () => {
    test('parses a dashed UUID into 16 bytes', () => {
      const bytes = uuidService.uuidToBin('01234567-89ab-7cde-8f01-23456789abcd');

      expect(Array.from(bytes)).toEqual([
        0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0x7c, 0xde,
        0x8f, 0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd,
      ]);
    });

    test('accepts an undashed UUID', () => {
      const dashed = uuidService.uuidToBin('01234567-89ab-7cde-8f01-23456789abcd');
      const bare = uuidService.uuidToBin('0123456789ab7cde8f0123456789abcd');

      expect(Array.from(bare)).toEqual(Array.from(dashed));
    });

    test('is case insensitive', () => {
      const lower = uuidService.uuidToBin('01234567-89ab-7cde-8f01-23456789abcd');
      const upper = uuidService.uuidToBin('01234567-89AB-7CDE-8F01-23456789ABCD');

      expect(Array.from(upper)).toEqual(Array.from(lower));
    });

    test('rejects malformed input', () => {
      expect(() => uuidService.uuidToBin('not-a-uuid')).toThrow('Invalid UUID');
      expect(() => uuidService.uuidToBin('')).toThrow('Invalid UUID');
      expect(() => uuidService.uuidToBin('01234567-89ab-7cde-8f01-23456789abc')).toThrow('Invalid UUID');
      expect(() => uuidService.uuidToBin('zzzzzzzz-89ab-7cde-8f01-23456789abcd')).toThrow('Invalid UUID');
    });

    test('round-trips with binToUuid', () => {
      const original = uuidService.binToUuid(uuidService.generateUUIDv7Bytes());

      expect(uuidService.binToUuid(uuidService.uuidToBin(original))).toBe(original);
    });
  });
});
