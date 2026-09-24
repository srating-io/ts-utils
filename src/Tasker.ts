/*
 * Copyright 2026 Evan Smalley.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* These two stylistic rules misread the `(...args: any[]) => any` generic
   constraint on each wrapper as a function declaration. */
/* eslint-disable space-before-function-paren */
/* eslint-disable function-paren-newline */

/**
 * A debounced or throttled wrapper, plus the controls to abandon or force a
 * pending call.
 */
export interface Scheduled<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  /** Drop any pending call. */
  cancel: () => void;
  /** Run any pending call immediately. */
  flush: () => void;
  /** Whether a call is currently waiting to run. */
  pending: () => boolean;
}

/**
 * A memoized wrapper, plus access to its cache.
 */
export interface Memoized<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T>;
  /** Forget every cached result. */
  clear: () => void;
  /** How many results are cached. */
  size: () => number;
}

export interface BackoffOptions {
  /** Delay before the first retry, in milliseconds. */
  delay?: number;
  /** Multiplier applied per attempt. */
  factor?: number;
  /** Ceiling for any single delay, in milliseconds. */
  maxDelay?: number;
  /** Randomize each delay across 0..computed, to avoid a thundering herd. */
  jitter?: boolean;
}

export interface RetryOptions extends BackoffOptions {
  /** Total number of attempts, including the first. */
  attempts?: number;
  /** Called before each retry with the error and the upcoming attempt number. */
  onRetry?: (error: unknown, attempt: number) => void;
  /** Return false to stop retrying a particular error. */
  shouldRetry?: (error: unknown) => boolean;
}

/**
 * Wrappers for controlling how and when other functions run.
 */
export class Tasker {
  /**
   * Resolve after a delay.
   *
   * @example
   * await Tasker.sleep(250);
   */
  public static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  /**
   * The delay to wait before a given retry attempt, growing exponentially.
   *
   * Attempt 0 is the delay before the first retry.
   *
   * @example
   * Tasker.backoff(0); // 1000
   * Tasker.backoff(3); // 8000
   */
  public static backoff(attempt: number, options: BackoffOptions = {}): number {
    const {
      delay = 1000,
      factor = 2,
      maxDelay = 30_000,
      jitter = false,
    } = options;

    const computed = Math.min(delay * factor ** Math.max(0, attempt), maxDelay);

    return jitter ? Math.random() * computed : computed;
  }

  /**
   * Call an async function until it succeeds, backing off between attempts.
   *
   * Rethrows the final error once the attempts are exhausted.
   *
   * @example
   * const data = await Tasker.retry(() => fetchRatings(), { attempts: 5 });
   */
  public static async retry<T>(
    fn: (attempt: number) => T | Promise<T>,
    options: RetryOptions = {},
  ): Promise<T> {
    const { attempts = 3, onRetry, shouldRetry, ...backoffOptions } = options;
    const total = Math.max(1, attempts);

    let lastError: unknown;

    for (let attempt = 0; attempt < total; attempt++) {
      try {
        // Sequential by design: each attempt waits for the previous to fail.
        // eslint-disable-next-line no-await-in-loop
        return await fn(attempt);
      } catch (error) {
        lastError = error;

        const isLast = attempt === total - 1;
        if (isLast || (shouldRetry && !shouldRetry(error))) {
          throw error;
        }

        if (onRetry) {
          onRetry(error, attempt + 1);
        }

        // eslint-disable-next-line no-await-in-loop
        await Tasker.sleep(Tasker.backoff(attempt, backoffOptions));
      }
    }

    throw lastError;
  }

  /**
   * Delay a function until it has stopped being called for `wait` ms.
   *
   * @param leading Run on the first call instead of after the pause.
   *
   * @example
   * const search = Tasker.debounce((term: string) => query(term), 300);
   */
  public static debounce<T extends (...args: any[]) => any>(
    fn: T,
    wait: number = 0,
    leading: boolean = false,
  ): Scheduled<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastArgs: Parameters<T> | undefined;

    const run = () => {
      timer = undefined;

      if (lastArgs) {
        const args = lastArgs;
        lastArgs = undefined;
        fn(...args);
      }
    };

    const debounced = (...args: Parameters<T>): void => {
      const callNow = leading && timer === undefined;

      lastArgs = args;

      if (timer !== undefined) {
        clearTimeout(timer);
      }

      timer = setTimeout(run, wait);

      if (callNow) {
        lastArgs = undefined;
        fn(...args);
      }
    };

    debounced.cancel = () => {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
      lastArgs = undefined;
    };

    debounced.flush = () => {
      if (timer !== undefined) {
        clearTimeout(timer);
        run();
      }
    };

    debounced.pending = () => lastArgs !== undefined;

    return debounced;
  }

  /**
   * Allow a function to run at most once per `wait` ms.
   *
   * The first call runs immediately; a call made during the cooling-off period
   * runs once the period ends, carrying the most recent arguments.
   *
   * @example
   * const onScroll = Tasker.throttle(() => measure(), 100);
   */
  public static throttle<T extends (...args: any[]) => any>(
    fn: T,
    wait: number = 0,
  ): Scheduled<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastArgs: Parameters<T> | undefined;

    const run = () => {
      if (lastArgs) {
        const args = lastArgs;
        lastArgs = undefined;
        // Keep the window open so a burst cannot collapse into back-to-back calls.
        timer = setTimeout(run, wait);
        fn(...args);
      } else {
        timer = undefined;
      }
    };

    const throttled = (...args: Parameters<T>): void => {
      if (timer !== undefined) {
        lastArgs = args;
        return;
      }

      timer = setTimeout(run, wait);
      fn(...args);
    };

    throttled.cancel = () => {
      if (timer !== undefined) {
        clearTimeout(timer);
        timer = undefined;
      }
      lastArgs = undefined;
    };

    throttled.flush = () => {
      if (lastArgs) {
        const args = lastArgs;
        lastArgs = undefined;
        fn(...args);
      }
    };

    throttled.pending = () => lastArgs !== undefined;

    return throttled;
  }

  /**
   * Cache a function's results, keyed by its arguments.
   *
   * The default key is a JSON serialization of the arguments, which suits
   * primitives; pass `keyFn` for anything else.
   *
   * @example
   * const ratingFor = Tasker.memoize((teamId: number) => compute(teamId));
   */
  public static memoize<T extends (...args: any[]) => any>(
    fn: T,
    keyFn?: (...args: Parameters<T>) => string,
  ): Memoized<T> {
    // CONSIDER(evan): the cache is unbounded. Callers keying on something
    // open-ended (a request id, a user-supplied string) will grow it forever;
    // an optional maxSize with FIFO eviction would cap that, at the cost of a
    // wider public interface.
    const cache = new Map<string, ReturnType<T>>();

    const memoized = (...args: Parameters<T>): ReturnType<T> => {
      const key = keyFn ? keyFn(...args) : JSON.stringify(args);
      const cached = cache.get(key);

      // Distinguishes a cached `undefined` from a miss without a second lookup.
      if (cached !== undefined || cache.has(key)) {
        return cached as ReturnType<T>;
      }

      const result = fn(...args) as ReturnType<T>;
      cache.set(key, result);

      return result;
    };

    memoized.clear = () => cache.clear();
    memoized.size = () => cache.size;

    return memoized;
  }

  /**
   * Allow a function to run only once, returning the first result thereafter.
   *
   * @example
   * const init = Tasker.once(() => connect());
   */
  public static once<T extends (...args: any[]) => any>(
    fn: T,
  ): (...args: Parameters<T>) => ReturnType<T> {
    let called = false;
    let result: ReturnType<T>;

    return (...args: Parameters<T>): ReturnType<T> => {
      if (!called) {
        called = true;
        result = fn(...args) as ReturnType<T>;
      }

      return result;
    };
  }
}
