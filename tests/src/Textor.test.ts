/* eslint-disable no-restricted-syntax */
import { Textor } from '../../src/Textor.js';

describe('Textor', () => {
  describe('toKebabCase()', () => {
    test('converts camelCase', () => {
      expect(Textor.toKebabCase('backgroundColor')).toBe('background-color');
      expect(Textor.toKebabCase('marginTop')).toBe('margin-top');
    });

    test('handles several humps', () => {
      expect(Textor.toKebabCase('borderBottomLeftRadius')).toBe('border-bottom-left-radius');
    });

    test('lowercases a leading capital', () => {
      expect(Textor.toKebabCase('BackgroundColor')).toBe('background-color');
    });

    test('leaves an already-kebab string alone', () => {
      expect(Textor.toKebabCase('background-color')).toBe('background-color');
      expect(Textor.toKebabCase('color')).toBe('color');
    });

    test('splits on a digit-to-capital boundary', () => {
      expect(Textor.toKebabCase('grid2Columns')).toBe('grid2-columns');
    });

    test('handles an empty string', () => {
      expect(Textor.toKebabCase('')).toBe('');
    });
  });

  describe('levenshtein()', () => {
    test('returns 0 for identical strings', () => {
      expect(Textor.levenshtein('kitten', 'kitten')).toBe(0);
      expect(Textor.levenshtein('', '')).toBe(0);
    });

    test('counts substitutions', () => {
      expect(Textor.levenshtein('cat', 'cut')).toBe(1);
      expect(Textor.levenshtein('cat', 'dog')).toBe(3);
    });

    test('counts insertions and deletions', () => {
      expect(Textor.levenshtein('cat', 'cats')).toBe(1);
      expect(Textor.levenshtein('cats', 'cat')).toBe(1);
    });

    test('handles the classic kitten/sitting case', () => {
      expect(Textor.levenshtein('kitten', 'sitting')).toBe(3);
      expect(Textor.levenshtein('saturday', 'sunday')).toBe(3);
    });

    test('an empty string is `length` edits from a non-empty one', () => {
      // An empty string is `length` edits from the other one, not 0 — a 0 here
      // would make every empty input look like a perfect match.
      expect(Textor.levenshtein('hello', '')).toBe(5);
      expect(Textor.levenshtein('', 'hello')).toBe(5);
    });

    test('is symmetric', () => {
      expect(Textor.levenshtein('flaw', 'lawn')).toBe(Textor.levenshtein('lawn', 'flaw'));
      expect(Textor.levenshtein('abc', '')).toBe(Textor.levenshtein('', 'abc'));
    });

    test('is case sensitive', () => {
      expect(Textor.levenshtein('abc', 'ABC')).toBe(3);
    });
  });

  describe('toSentenceCase()', () => {
    test('capitalises the first letter and lowercases the rest', () => {
      expect(Textor.toSentenceCase('hello world')).toBe('Hello world');
      expect(Textor.toSentenceCase('HELLO WORLD')).toBe('Hello world');
      expect(Textor.toSentenceCase('hELLO wORLD')).toBe('Hello world');
    });

    test('trims surrounding whitespace', () => {
      expect(Textor.toSentenceCase('   spaced out   ')).toBe('Spaced out');
    });

    test('returns an empty string for empty input', () => {
      expect(Textor.toSentenceCase('')).toBe('');
      expect(Textor.toSentenceCase('   ')).toBe('');
    });

    test('leaves non-alphabetic leading characters alone', () => {
      expect(Textor.toSentenceCase('123 ABC')).toBe('123 abc');
    });

    test('handles a single character', () => {
      expect(Textor.toSentenceCase('a')).toBe('A');
    });
  });

  describe('generateLoremIpsum()', () => {
    test('starts with the classic opening by default', () => {
      expect(Textor.generateLoremIpsum()).toMatch(/^Lorem ipsum dolor sit amet, consectetur adipiscing elit\./);
    });

    test('can opt out of the classic opening', () => {
      const text = Textor.generateLoremIpsum(1, 3, false);

      expect(text.startsWith('Lorem ipsum dolor sit amet,')).toBe(false);
    });

    test('produces the requested number of paragraphs', () => {
      expect(Textor.generateLoremIpsum(1).split('\n\n')).toHaveLength(1);
      expect(Textor.generateLoremIpsum(4).split('\n\n')).toHaveLength(4);
    });

    test('produces at least 3 sentences per paragraph', () => {
      const paragraphs = Textor.generateLoremIpsum(3, 5).split('\n\n');

      for (const paragraph of paragraphs) {
        const sentences = paragraph.split('. ').filter(Boolean);
        expect(sentences.length).toBeGreaterThanOrEqual(3);
      }
    });

    test('every sentence is capitalised and ends with a period', () => {
      const text = Textor.generateLoremIpsum(2, 4, false);

      for (const paragraph of text.split('\n\n')) {
        expect(paragraph).toMatch(/^[A-Z]/);
        expect(paragraph.endsWith('.')).toBe(true);
      }
    });

    test('returns an empty string for zero paragraphs', () => {
      expect(Textor.generateLoremIpsum(0)).toBe('');
    });
  });
});
