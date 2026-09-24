/* eslint-disable no-restricted-syntax */
import { jest } from '@jest/globals';
import { Toaster, toaster, toast, type ToastItem } from '../../src/Toaster.js';

describe('Toaster', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const latest = (instance: Toaster): ToastItem[] => instance.getToasts();

  describe('subscribe()', () => {
    test('notifies subscribers when a toast is added', () => {
      const instance = new Toaster();
      const listener = jest.fn();
      instance.subscribe(listener);

      instance.add('hello');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0]).toEqual([
        { id: expect.any(Number), message: 'hello', type: 'info' },
      ]);
    });

    test('notifies every subscriber', () => {
      const instance = new Toaster();
      const a = jest.fn();
      const b = jest.fn();
      instance.subscribe(a);
      instance.subscribe(b);

      instance.add('hello');

      expect(a).toHaveBeenCalledTimes(1);
      expect(b).toHaveBeenCalledTimes(1);
    });

    test('returns an unsubscribe function', () => {
      const instance = new Toaster();
      const listener = jest.fn();
      const unsubscribe = instance.subscribe(listener);

      unsubscribe();
      instance.add('hello');

      expect(listener).not.toHaveBeenCalled();
    });

    test('unsubscribing one listener leaves the others attached', () => {
      const instance = new Toaster();
      const a = jest.fn();
      const b = jest.fn();
      const unsubscribeA = instance.subscribe(a);
      instance.subscribe(b);

      unsubscribeA();
      instance.add('hello');

      expect(a).not.toHaveBeenCalled();
      expect(b).toHaveBeenCalledTimes(1);
    });
  });

  describe('add()', () => {
    test('defaults the type to info', () => {
      const instance = new Toaster();
      instance.add('hello');

      expect(latest(instance)[0].type).toBe('info');
    });

    test('records the supplied type', () => {
      const instance = new Toaster();
      instance.add('boom', 'error');

      expect(latest(instance)[0].type).toBe('error');
    });

    test('appends toasts in order', () => {
      const instance = new Toaster();
      instance.add('first');
      instance.add('second');

      expect(latest(instance).map((t) => t.message)).toEqual(['first', 'second']);
    });

    test('gives every toast a unique id even within the same millisecond', () => {
      // Ids come from a monotonic counter rather than Date.now(): two toasts
      // added in the same millisecond stay individually addressable.
      const instance = new Toaster();
      instance.add('a');
      instance.add('b');
      instance.add('c');

      const ids = latest(instance).map((t) => t.id);

      expect(new Set(ids).size).toBe(3);
    });

    test('marks the toast as exiting after the 4 second timeout', () => {
      const instance = new Toaster();
      instance.add('hello');

      expect(latest(instance)[0].exiting).toBeUndefined();

      jest.advanceTimersByTime(4000);

      expect(latest(instance)[0].exiting).toBe(true);
    });
  });

  describe('remove()', () => {
    test('removes only the matching toast', () => {
      const instance = new Toaster();
      instance.add('first');
      instance.add('second');

      const [first] = latest(instance);
      instance.remove(first.id);

      expect(latest(instance).map((t) => t.message)).toEqual(['second']);
    });

    test('notifies subscribers', () => {
      const instance = new Toaster();
      instance.add('first');

      const listener = jest.fn();
      instance.subscribe(listener);
      instance.remove(latest(instance)[0].id);

      expect(listener).toHaveBeenCalled();
    });

    test('is a no-op for an unknown id', () => {
      const instance = new Toaster();
      instance.add('first');

      instance.remove(-1);

      expect(latest(instance)).toHaveLength(1);
    });

    test('does not notify when nothing was removed', () => {
      const instance = new Toaster();
      instance.add('first');

      const listener = jest.fn();
      instance.subscribe(listener);

      instance.remove(-1);

      expect(listener).not.toHaveBeenCalled();
    });

    test('does not notify when the same id is removed twice', () => {
      const instance = new Toaster();
      const id = instance.add('first');

      const listener = jest.fn();
      instance.subscribe(listener);

      instance.remove(id);
      expect(listener).toHaveBeenCalledTimes(1);

      instance.remove(id);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('requestClose()', () => {
    test('flags only the matching toast as exiting', () => {
      const instance = new Toaster();
      instance.add('first');
      instance.add('second');

      const [first] = latest(instance);
      instance.requestClose(first.id);

      const toasts = latest(instance);
      expect(toasts[0].exiting).toBe(true);
      expect(toasts[1].exiting).toBeUndefined();
    });

    test('does not remove the toast', () => {
      const instance = new Toaster();
      instance.add('first');

      instance.requestClose(latest(instance)[0].id);

      expect(latest(instance)).toHaveLength(1);
    });
  });

  describe('getToasts()', () => {
    test('reports the current toasts', () => {
      const instance = new Toaster();
      instance.add('one');
      instance.add('two');

      expect(instance.getToasts().map((t) => t.message)).toEqual(['one', 'two']);
    });

    test('is empty for a fresh instance', () => {
      expect(new Toaster().getToasts()).toEqual([]);
    });

    test('returns a copy, so callers cannot mutate internal state', () => {
      const instance = new Toaster();
      instance.add('one');

      instance.getToasts().push({ id: 99, message: 'injected', type: 'info' });

      expect(instance.getToasts()).toHaveLength(1);
    });
  });

  describe('auto-dismissal lifecycle', () => {
    test('removes the toast once the exit animation has played', () => {
      // The safety net in requestClose() is what bounds the list when the UI
      // never reports its animation as finished.
      const instance = new Toaster();
      instance.add('hello');

      jest.advanceTimersByTime(Toaster.AUTO_DISMISS_MS);
      expect(instance.getToasts()).toHaveLength(1);
      expect(instance.getToasts()[0].exiting).toBe(true);

      jest.advanceTimersByTime(Toaster.EXIT_ANIMATION_MS);
      expect(instance.getToasts()).toEqual([]);
    });

    test('does not leak toasts across many additions', () => {
      const instance = new Toaster();

      for (let i = 0; i < 20; i++) {
        instance.add(`toast ${i}`);
      }

      jest.advanceTimersByTime(Toaster.AUTO_DISMISS_MS + Toaster.EXIT_ANIMATION_MS);

      expect(instance.getToasts()).toEqual([]);
    });

    test('add() returns the id so a toast can be dismissed early', () => {
      const instance = new Toaster();
      const first = instance.add('first');
      instance.add('second');

      instance.remove(first);

      expect(instance.getToasts().map((t) => t.message)).toEqual(['second']);
    });

    test('a manual requestClose also removes after the animation', () => {
      const instance = new Toaster();
      const id = instance.add('hello');

      instance.requestClose(id);
      expect(instance.getToasts()[0].exiting).toBe(true);

      jest.advanceTimersByTime(Toaster.EXIT_ANIMATION_MS);
      expect(instance.getToasts()).toEqual([]);
    });

    test('a repeated requestClose does not schedule a second removal', () => {
      const instance = new Toaster();
      const id = instance.add('hello');

      instance.requestClose(id);
      instance.requestClose(id);
      jest.advanceTimersByTime(Toaster.EXIT_ANIMATION_MS);

      // The toast is gone, and the second timer must not remove a later toast
      // that happens to reuse nothing -- ids are monotonic, so this just
      // confirms no stray removal fires.
      const next = instance.add('later');
      expect(instance.getToasts().map((t) => t.id)).toEqual([next]);
    });

    test('the safety net stays silent when the consumer removed it first', () => {
      // A UI that removes the toast when its exit animation ends gets there
      // before the safety net does; the late removal must not trigger an extra
      // broadcast and an extra render.
      const instance = new Toaster();
      const id = instance.add('hello');

      jest.advanceTimersByTime(Toaster.AUTO_DISMISS_MS);

      const listener = jest.fn();
      instance.subscribe(listener);

      // Stand in for onAnimationEnd firing at ~300ms, ahead of the net.
      jest.advanceTimersByTime(300);
      instance.remove(id);
      expect(listener).toHaveBeenCalledTimes(1);

      // The safety net fires at 500ms and finds nothing left to do.
      jest.advanceTimersByTime(Toaster.EXIT_ANIMATION_MS);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(instance.getToasts()).toEqual([]);
    });

    test('the safety net still removes when the consumer never does', () => {
      const instance = new Toaster();
      instance.add('hello');

      jest.advanceTimersByTime(Toaster.AUTO_DISMISS_MS);
      expect(instance.getToasts()).toHaveLength(1);

      jest.advanceTimersByTime(Toaster.EXIT_ANIMATION_MS);
      expect(instance.getToasts()).toEqual([]);
    });

    test('requestClose is a no-op for an unknown id', () => {
      const instance = new Toaster();
      instance.add('hello');

      expect(() => instance.requestClose(-1)).not.toThrow();
      expect(instance.getToasts()).toHaveLength(1);
    });
  });

  describe('toast helpers', () => {
    afterEach(() => {
      for (const item of latest(toaster)) {
        toaster.remove(item.id);
      }
    });

    test('map to the shared toaster with the right type', () => {
      toast.info('i');
      toast.error('e');
      toast.success('s');

      expect(latest(toaster).map((t) => [t.message, t.type])).toEqual([
        ['i', 'info'],
        ['e', 'error'],
        ['s', 'success'],
      ]);
    });
  });
});
