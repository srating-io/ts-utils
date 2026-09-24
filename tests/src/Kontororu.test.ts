/* eslint-disable no-restricted-syntax */
import { jest } from '@jest/globals';
import { Kontororu } from '../../src/Kontororu.js';

describe('Kontororu', () => {
  describe('addEventListener()', () => {
    test('registers a listener that receives dispatched events', () => {
      const k = new Kontororu();
      const listener = jest.fn();

      k.addEventListener('ping', listener);
      k.dispatchEvent(new Event('ping'));

      expect(listener).toHaveBeenCalledTimes(1);
    });

    test('is chainable', () => {
      const k = new Kontororu();

      expect(k.addEventListener('ping', () => {})).toBe(k);
    });

    test('tracks the listener so getListeners() can report it', () => {
      const k = new Kontororu();
      const listener = () => {};

      k.addEventListener('ping', listener);

      expect(k.getListeners('ping')).toEqual([listener]);
    });

    test('keeps listener types separate', () => {
      const k = new Kontororu();
      const a = () => {};
      const b = () => {};

      k.addEventListener('one', a);
      k.addEventListener('two', b);

      expect(k.getListeners('one')).toEqual([a]);
      expect(k.getListeners('two')).toEqual([b]);
    });

    test('does not double-track a repeated registration', () => {
      // EventTarget ignores a repeated (type, listener) pair, so the
      // bookkeeping array must not record it twice either.
      const k = new Kontororu();
      const listener = jest.fn();

      k.addEventListener('ping', listener);
      k.addEventListener('ping', listener);

      expect(k.getListeners('ping')).toHaveLength(1);

      k.dispatchEvent(new Event('ping'));
      expect(listener).toHaveBeenCalledTimes(1);

      k.removeEventListener('ping', listener);
      expect(k.getListeners('ping')).toHaveLength(0);
    });

    test('supports several distinct listeners on one type', () => {
      const k = new Kontororu();
      const a = jest.fn();
      const b = jest.fn();

      k.addEventListener('ping', a);
      k.addEventListener('ping', b);
      k.dispatchEvent(new Event('ping'));

      expect(a).toHaveBeenCalledTimes(1);
      expect(b).toHaveBeenCalledTimes(1);
      expect(k.getListeners('ping')).toHaveLength(2);
    });
  });

  describe('removeEventListener()', () => {
    test('stops the listener from firing', () => {
      const k = new Kontororu();
      const listener = jest.fn();

      k.addEventListener('ping', listener);
      k.removeEventListener('ping', listener);
      k.dispatchEvent(new Event('ping'));

      expect(listener).not.toHaveBeenCalled();
    });

    test('drops the listener from the bookkeeping array', () => {
      const k = new Kontororu();
      const a = () => {};
      const b = () => {};

      k.addEventListener('ping', a);
      k.addEventListener('ping', b);
      k.removeEventListener('ping', a);

      expect(k.getListeners('ping')).toEqual([b]);
    });

    test('is chainable', () => {
      const k = new Kontororu();

      expect(k.removeEventListener('ping', () => {})).toBe(k);
    });

    test('is a no-op for an unknown type or listener', () => {
      const k = new Kontororu();

      expect(() => k.removeEventListener('nope', () => {})).not.toThrow();
    });
  });

  describe('removeAllEventListeners()', () => {
    test('removes every listener across every type', () => {
      // Removal rewrites the array being walked, so the loop iterates a copy.
      const k = new Kontororu();
      const a = jest.fn();
      const b = jest.fn();
      const c = jest.fn();

      k.addEventListener('one', a);
      k.addEventListener('one', b);
      k.addEventListener('two', c);

      k.removeAllEventListeners();

      k.dispatchEvent(new Event('one'));
      k.dispatchEvent(new Event('two'));

      expect(a).not.toHaveBeenCalled();
      expect(b).not.toHaveBeenCalled();
      expect(c).not.toHaveBeenCalled();
      expect(k.getListeners('one')).toHaveLength(0);
      expect(k.getListeners('two')).toHaveLength(0);
    });

    test('does not throw when there are no listeners', () => {
      const k = new Kontororu();

      expect(() => k.removeAllEventListeners()).not.toThrow();
    });
  });

  describe('getListeners()', () => {
    test('returns an empty array for an unknown type', () => {
      expect(new Kontororu().getListeners('nope')).toEqual([]);
    });

    test('returns a copy, so a caller cannot desynchronise the bookkeeping', () => {
      const k = new Kontororu();
      const listener = jest.fn();

      k.addEventListener('ping', listener);
      k.getListeners('ping').push(jest.fn());

      expect(k.getListeners('ping')).toEqual([listener]);
    });
  });

  describe('event type names', () => {
    test('handles __proto__ like any other type', () => {
      // On a plain object this key resolves to Object.prototype rather than to
      // an entry of its own, and the bookkeeping push throws.
      const k = new Kontororu();
      const listener = jest.fn();

      expect(() => k.addEventListener('__proto__', listener)).not.toThrow();
      expect(k.getListeners('__proto__')).toEqual([listener]);

      k.dispatchEvent(new Event('__proto__'));
      expect(listener).toHaveBeenCalledTimes(1);

      k.removeEventListener('__proto__', listener);
      expect(k.getListeners('__proto__')).toEqual([]);
    });

    test('keeps constructor and toString separate from Object members', () => {
      const k = new Kontororu();
      const onConstructor = jest.fn();
      const onToString = jest.fn();

      k.addEventListener('constructor', onConstructor);
      k.addEventListener('toString', onToString);

      expect(k.getListeners('constructor')).toEqual([onConstructor]);
      expect(k.getListeners('toString')).toEqual([onToString]);
    });
  });

  describe('events', () => {
    test('CustomEvent detail reaches the listener', () => {
      const k = new Kontororu();
      const listener = jest.fn();

      k.addEventListener('data', listener);
      k.dispatchEvent(new CustomEvent('data', { detail: { value: 42 } }));

      expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({ value: 42 });
    });
  });
});
