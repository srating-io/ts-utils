/* eslint-disable no-restricted-syntax */
import { jest } from '@jest/globals';
import { CSV } from '../../src/CSV.js';

describe('CSV', () => {
  describe('stringify()', () => {
    test('writes a header row followed by one row per record', () => {
      const csv = CSV.stringify({
        1: { name: 'Ada', role: 'Engineer' },
        2: { name: 'Grace', role: 'Admiral' },
      });

      expect(csv).toBe('name,role\nAda,Engineer\nGrace,Admiral');
    });

    test('returns an empty string for empty input', () => {
      expect(CSV.stringify({})).toBe('');
    });

    test('preserves falsy values instead of blanking them', () => {
      // 0, false and '' are real values and have to reach the file as written.
      const csv = CSV.stringify({
        1: { count: 0, active: false, note: '' },
      });

      expect(csv).toBe('count,active,note\n0,false,');
    });

    test('renders null and undefined as empty cells', () => {
      const csv = CSV.stringify({
        1: { a: null, b: undefined },
      });

      expect(csv).toBe('a,b\n,');
    });

    test('quotes values containing commas', () => {
      const csv = CSV.stringify({
        1: { name: 'Doe, Jane' },
      });

      expect(csv).toBe('name\n"Doe, Jane"');
    });

    test('escapes embedded quotes by doubling them, per RFC 4180', () => {
      const csv = CSV.stringify({
        1: { quote: 'She said "hi"' },
      });

      expect(csv).toBe('quote\n"She said ""hi"""');
    });

    test('quotes values containing newlines', () => {
      const csv = CSV.stringify({
        1: { text: 'line one\nline two' },
      });

      expect(csv).toBe('text\n"line one\nline two"');
    });

    test('collects headers from every row, not just the first', () => {
      // Headers are the union of every row's keys, so a column appearing only
      // on a later row is still written.
      const csv = CSV.stringify({
        1: { a: 1 },
        2: { a: 2, b: 3 },
      });

      expect(csv).toBe('a,b\n1,\n2,3');
    });

    test('keeps column alignment when a row is missing a key', () => {
      const csv = CSV.stringify({
        1: { a: 1, b: 2, c: 3 },
        2: { a: 4, c: 6 },
      });

      expect(csv).toBe('a,b,c\n1,2,3\n4,,6');
    });

    test('does not quote plain values', () => {
      const csv = CSV.stringify({
        1: { a: 'plain', b: 42 },
      });

      expect(csv).toBe('a,b\nplain,42');
    });
  });

  describe('download()', () => {
    const originalCreateObjectURL = globalThis.URL.createObjectURL;
    const originalRevokeObjectURL = globalThis.URL.revokeObjectURL;

    afterEach(() => {
      globalThis.URL.createObjectURL = originalCreateObjectURL;
      globalThis.URL.revokeObjectURL = originalRevokeObjectURL;
      jest.restoreAllMocks();
    });

    test('creates a blob, clicks an anchor and cleans up', () => {
      const click = jest.fn();
      const remove = jest.fn();
      const anchor = { href: '', download: '', click, remove } as unknown as HTMLAnchorElement;

      const createObjectURL = jest.fn<(obj: Blob | MediaSource) => string>()
        .mockReturnValue('blob:fake-url');
      const revokeObjectURL = jest.fn();
      globalThis.URL.createObjectURL = createObjectURL;
      globalThis.URL.revokeObjectURL = revokeObjectURL;

      const appendChild = jest.fn();
      // Minimal DOM stand-in; the node test environment has no document.
      (globalThis as unknown as { document: unknown }).document = {
        createElement: jest.fn().mockReturnValue(anchor),
        body: { appendChild },
      };

      try {
        CSV.download({ 1: { a: 1 } });

        expect(createObjectURL).toHaveBeenCalledTimes(1);
        expect(anchor.href).toBe('blob:fake-url');
        expect(anchor.download).toBe('srating-data.csv');
        expect(appendChild).toHaveBeenCalledWith(anchor);
        expect(click).toHaveBeenCalledTimes(1);
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-url');
        expect(remove).toHaveBeenCalledTimes(1);
      } finally {
        delete (globalThis as unknown as { document?: unknown }).document;
      }
    });
  });
});
