/* eslint-disable no-restricted-syntax */
import { jest } from '@jest/globals';
import { Tasker } from '../../src/Tasker.js';

describe('Tasker', () => {
  describe('sleep()', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    test('resolves after the delay', async () => {
      jest.useFakeTimers();

      const done = jest.fn();
      const promise = Tasker.sleep(1000).then(done);

      expect(done).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      await promise;

      expect(done).toHaveBeenCalled();
    });

    test('resolves for real with a tiny delay', async () => {
      await expect(Tasker.sleep(1)).resolves.toBeUndefined();
    });
  });

  describe('backoff()', () => {
    test('grows exponentially from the base delay', () => {
      expect(Tasker.backoff(0)).toBe(1000);
      expect(Tasker.backoff(1)).toBe(2000);
      expect(Tasker.backoff(2)).toBe(4000);
      expect(Tasker.backoff(3)).toBe(8000);
    });

    test('caps at maxDelay', () => {
      expect(Tasker.backoff(10)).toBe(30_000);
      expect(Tasker.backoff(100)).toBe(30_000);
    });

    test('honours a custom base, factor and cap', () => {
      expect(Tasker.backoff(0, { delay: 100 })).toBe(100);
      expect(Tasker.backoff(2, { delay: 100, factor: 3 })).toBe(900);
      expect(Tasker.backoff(5, { delay: 100, maxDelay: 500 })).toBe(500);
    });

    test('treats a negative attempt as the first', () => {
      expect(Tasker.backoff(-5)).toBe(1000);
    });

    test('jitter keeps the delay within 0..computed', () => {
      for (let i = 0; i < 50; i++) {
        const delay = Tasker.backoff(2, { jitter: true });

        expect(delay).toBeGreaterThanOrEqual(0);
        expect(delay).toBeLessThanOrEqual(4000);
      }
    });

    test('matches the schedule Socket relies on', () => {
      const schedule = [0, 1, 2, 3, 4, 5, 6].map(
        (attempt) => Tasker.backoff(attempt, { delay: 1000, maxDelay: 30000 }),
      );

      expect(schedule).toEqual([1000, 2000, 4000, 8000, 16000, 30000, 30000]);
    });
  });

  describe('retry()', () => {
    test('returns the first successful result without waiting', async () => {
      const fn = jest.fn<() => Promise<string>>().mockResolvedValue('ok');

      await expect(Tasker.retry(fn)).resolves.toBe('ok');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('retries until it succeeds', async () => {
      const fn = jest.fn<() => Promise<string>>()
        .mockRejectedValueOnce(new Error('boom'))
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValue('ok');

      await expect(Tasker.retry(fn, { delay: 1 })).resolves.toBe('ok');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    test('rethrows the final error once attempts are exhausted', async () => {
      const fn = jest.fn<() => Promise<string>>().mockRejectedValue(new Error('always'));

      await expect(Tasker.retry(fn, { attempts: 3, delay: 1 })).rejects.toThrow('always');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    test('passes the attempt number to the function', async () => {
      const seen: number[] = [];
      const fn = jest.fn((attempt: number) => {
        seen.push(attempt);
        if (attempt < 2) {
          throw new Error('retry');
        }
        return 'ok';
      });

      await expect(Tasker.retry(fn, { delay: 1 })).resolves.toBe('ok');
      expect(seen).toEqual([0, 1, 2]);
    });

    test('reports each retry through onRetry', async () => {
      const onRetry = jest.fn();
      const fn = jest.fn<() => Promise<string>>()
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValue('ok');

      await Tasker.retry(fn, { delay: 1, onRetry });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry.mock.calls[0][1]).toBe(1);
    });

    test('stops early when shouldRetry rejects the error', async () => {
      const fn = jest.fn<() => Promise<string>>().mockRejectedValue(new Error('fatal'));
      const shouldRetry = jest.fn<(error: unknown) => boolean>().mockReturnValue(false);

      await expect(
        Tasker.retry(fn, { attempts: 5, delay: 1, shouldRetry }),
      ).rejects.toThrow('fatal');

      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('runs at least once even with attempts below 1', async () => {
      const fn = jest.fn<() => Promise<string>>().mockResolvedValue('ok');

      await expect(Tasker.retry(fn, { attempts: 0 })).resolves.toBe('ok');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('accepts a synchronous function', async () => {
      await expect(Tasker.retry(() => 42)).resolves.toBe(42);
    });
  });

  describe('debounce()', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('runs once after the calls stop', () => {
      const fn = jest.fn();
      const debounced = Tasker.debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('passes the most recent arguments', () => {
      const fn = jest.fn();
      const debounced = Tasker.debounce(fn, 100);

      debounced('first');
      debounced('second');
      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('second');
    });

    test('restarts the timer on every call', () => {
      const fn = jest.fn();
      const debounced = Tasker.debounce(fn, 100);

      debounced();
      jest.advanceTimersByTime(80);
      debounced();
      jest.advanceTimersByTime(80);

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(20);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('leading mode runs immediately and not again on the trailing edge', () => {
      const fn = jest.fn();
      const debounced = Tasker.debounce(fn, 100, true);

      debounced('a');

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('a');

      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('leading mode still trails a later call in the same window', () => {
      const fn = jest.fn();
      const debounced = Tasker.debounce(fn, 100, true);

      debounced('a');
      debounced('b');
      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith('b');
    });

    test('cancel() drops the pending call', () => {
      const fn = jest.fn();
      const debounced = Tasker.debounce(fn, 100);

      debounced();
      debounced.cancel();
      jest.advanceTimersByTime(100);

      expect(fn).not.toHaveBeenCalled();
    });

    test('flush() runs the pending call immediately', () => {
      const fn = jest.fn();
      const debounced = Tasker.debounce(fn, 100);

      debounced('now');
      debounced.flush();

      expect(fn).toHaveBeenCalledWith('now');
    });

    test('flush() is a no-op with nothing pending', () => {
      const fn = jest.fn();
      const debounced = Tasker.debounce(fn, 100);

      debounced.flush();

      expect(fn).not.toHaveBeenCalled();
    });

    test('pending() reports whether a call is waiting', () => {
      const fn = jest.fn();
      const debounced = Tasker.debounce(fn, 100);

      expect(debounced.pending()).toBe(false);

      debounced();
      expect(debounced.pending()).toBe(true);

      jest.advanceTimersByTime(100);
      expect(debounced.pending()).toBe(false);
    });

    test('pending() is false after a leading call with nothing queued', () => {
      const fn = jest.fn();
      const debounced = Tasker.debounce(fn, 100, true);

      debounced();

      expect(fn).toHaveBeenCalledTimes(1);
      expect(debounced.pending()).toBe(false);
    });
  });

  describe('throttle()', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('runs immediately on the first call', () => {
      const fn = jest.fn();
      const throttled = Tasker.throttle(fn, 100);

      throttled('a');

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('a');
    });

    test('suppresses calls inside the window', () => {
      const fn = jest.fn();
      const throttled = Tasker.throttle(fn, 100);

      throttled();
      throttled();
      throttled();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('runs the trailing call when the window closes', () => {
      const fn = jest.fn();
      const throttled = Tasker.throttle(fn, 100);

      throttled('a');
      throttled('b');
      throttled('c');

      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith('c');
    });

    test('does not fire a trailing call when none was suppressed', () => {
      const fn = jest.fn();
      const throttled = Tasker.throttle(fn, 100);

      throttled();
      jest.advanceTimersByTime(200);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('allows another immediate call after the window drains', () => {
      const fn = jest.fn();
      const throttled = Tasker.throttle(fn, 100);

      throttled();
      jest.advanceTimersByTime(100);
      throttled();

      expect(fn).toHaveBeenCalledTimes(2);
    });

    test('cancel() drops the trailing call', () => {
      const fn = jest.fn();
      const throttled = Tasker.throttle(fn, 100);

      throttled('a');
      throttled('b');
      throttled.cancel();
      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('pending() reports queued work, matching debounce()', () => {
      const fn = jest.fn();
      const throttled = Tasker.throttle(fn, 100);

      expect(throttled.pending()).toBe(false);

      // The leading call runs straight away, so nothing is queued behind it.
      throttled('a');
      expect(throttled.pending()).toBe(false);

      throttled('b');
      expect(throttled.pending()).toBe(true);

      jest.advanceTimersByTime(100);
      expect(throttled.pending()).toBe(false);
    });
  });

  describe('memoize()', () => {
    test('caches an undefined result instead of recomputing it', () => {
      const fn = jest.fn(() => undefined);
      const memoized = Tasker.memoize(fn);

      expect(memoized()).toBeUndefined();
      expect(memoized()).toBeUndefined();
      expect(fn).toHaveBeenCalledTimes(1);
      expect(memoized.size()).toBe(1);
    });

    test('calls the function once per distinct argument set', () => {
      const fn = jest.fn((n: number) => n * 2);
      const memoized = Tasker.memoize(fn);

      expect(memoized(2)).toBe(4);
      expect(memoized(2)).toBe(4);
      expect(memoized(3)).toBe(6);

      expect(fn).toHaveBeenCalledTimes(2);
    });

    test('distinguishes multiple arguments', () => {
      const fn = jest.fn((a: number, b: number) => a + b);
      const memoized = Tasker.memoize(fn);

      memoized(1, 2);
      memoized(2, 1);

      expect(fn).toHaveBeenCalledTimes(2);
    });

    test('caches falsy and undefined results', () => {
      const fn = jest.fn(() => undefined);
      const memoized = Tasker.memoize(fn);

      memoized();
      memoized();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('accepts a custom key function', () => {
      const fn = jest.fn((user: { id: number; name: string }) => user.name);
      const memoized = Tasker.memoize(fn, (user) => String(user.id));

      expect(memoized({ id: 1, name: 'Ada' })).toBe('Ada');
      // Same id, different object: the custom key still hits the cache.
      expect(memoized({ id: 1, name: 'Grace' })).toBe('Ada');

      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('exposes cache size and clearing', () => {
      const memoized = Tasker.memoize((n: number) => n);

      memoized(1);
      memoized(2);
      expect(memoized.size()).toBe(2);

      memoized.clear();
      expect(memoized.size()).toBe(0);
    });
  });

  describe('once()', () => {
    test('runs the function a single time', () => {
      const fn = jest.fn(() => 'result');
      const wrapped = Tasker.once(fn);

      expect(wrapped()).toBe('result');
      expect(wrapped()).toBe('result');
      expect(wrapped()).toBe('result');

      expect(fn).toHaveBeenCalledTimes(1);
    });

    test('ignores later arguments', () => {
      const fn = jest.fn((value: string) => value);
      const wrapped = Tasker.once(fn);

      expect(wrapped('first')).toBe('first');
      expect(wrapped('second')).toBe('first');
    });

    test('caches an undefined result rather than re-running', () => {
      const fn = jest.fn(() => undefined);
      const wrapped = Tasker.once(fn);

      wrapped();
      wrapped();

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
