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

/**
 * Bounding, interpolation, and descriptive statistics.
 *
 * Every aggregate ignores nothing and validates nothing: pass it clean numbers.
 * Aggregates over an empty list return NaN rather than 0, so an empty data set
 * is visibly empty instead of silently reading as a real zero.
 *
 * That split holds across the package: an aggregate with nothing to work on
 * yields NaN, because the caller is asking about data rather than supplying a
 * bad argument, while an argument that cannot be honoured at all -- a chunk
 * size below 1, a step of 0 -- throws.
 */
export class Arithmetic {
  /**
   * Restrict a number to the inclusive range [min, max].
   */
  public static clamp(number: number, min: number, max: number): number {
    return Math.max(min, Math.min(number, max));
  }

  /**
   * Linearly interpolate between `a` and `b`.
   *
   * `amount` is clamped to 0..1, so the result never overshoots the endpoints.
   *
   * @example
   * Arithmetic.lerp(0, 100, 0.25); // 25
   */
  public static lerp(a: number, b: number, amount: number): number {
    return a + (b - a) * Arithmetic.clamp(amount, 0, 1);
  }

  /**
   * Round to a fixed number of decimal places.
   *
   * Uses exponent shifting rather than `Math.round(v * 10 ** p) / 10 ** p`,
   * which misrounds the common half-way cases (0.5 at the target precision).
   * A negative precision rounds to tens, hundreds, and so on.
   *
   * @example
   * Arithmetic.round(1.005, 2);  // 1.01
   * Arithmetic.round(1234, -2);  // 1200
   */
  public static round(value: number, precision: number = 0): number {
    if (!Number.isFinite(value)) {
      return value;
    }

    const shift = (input: number, exponent: number): number => {
      const parts = `${input}e`.split('e');
      return Number(`${parts[0]}e${Number(parts[1]) + exponent}`);
    };

    return shift(Math.round(shift(value, precision)), -precision);
  }

  /**
   * Re-map a number from one range onto another.
   *
   * @example
   * // A rating of 1500 on a 1000..2000 scale, as a 0..100 score.
   * Arithmetic.mapRange(1500, 1000, 2000, 0, 100); // 50
   */
  public static mapRange(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number,
  ): number {
    if (inMax === inMin) {
      return outMin;
    }

    return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
  }

  /**
   * Scale a value within [min, max] onto 0..1. The inverse of `lerp`.
   *
   * Returns 0 for a zero-width range rather than dividing by zero.
   */
  public static normalize(value: number, min: number, max: number): number {
    if (max === min) {
      return 0;
    }

    return (value - min) / (max - min);
  }

  /**
   * Total of every value. An empty list sums to 0.
   */
  public static sum(values: number[]): number {
    return values.reduce((total, value) => total + value, 0);
  }

  /**
   * Arithmetic mean. NaN when the list is empty.
   */
  public static mean(values: number[]): number {
    if (values.length === 0) {
      return NaN;
    }

    return Arithmetic.sum(values) / values.length;
  }

  /**
   * Middle value, averaging the two middle values for an even-length list.
   * NaN when the list is empty.
   */
  public static median(values: number[]): number {
    return Arithmetic.percentile(values, 50);
  }

  /**
   * The most frequent values, in first-seen order.
   *
   * Returns every tied value rather than picking one arbitrarily, and an empty
   * array for an empty list.
   */
  public static mode(values: number[]): number[] {
    if (values.length === 0) {
      return [];
    }

    const counts = new Map<number, number>();

    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }

    // Walked rather than Math.max(...counts.values()): spreading a large set of
    // distinct values overflows the argument stack.
    let highest = 0;
    counts.forEach((count) => {
      if (count > highest) {
        highest = count;
      }
    });

    const modes: number[] = [];
    counts.forEach((count, value) => {
      if (count === highest) {
        modes.push(value);
      }
    });

    return modes;
  }

  /**
   * Variance. Sample variance (dividing by n - 1) by default; pass
   * `population` to divide by n instead.
   *
   * NaN when there are too few values to be meaningful — fewer than 2 for a
   * sample, or none at all for a population.
   */
  public static variance(values: number[], population: boolean = false): number {
    const divisor = population ? values.length : values.length - 1;

    if (divisor <= 0) {
      return NaN;
    }

    const average = Arithmetic.mean(values);
    const squaredDeviations = values.reduce(
      (total, value) => total + (value - average) ** 2,
      0,
    );

    return squaredDeviations / divisor;
  }

  /**
   * Standard deviation, the square root of the variance.
   */
  public static stdDev(values: number[], population: boolean = false): number {
    return Math.sqrt(Arithmetic.variance(values, population));
  }

  /**
   * The value at the given percentile (0-100), interpolating linearly between
   * the two neighbouring values when the percentile falls between them.
   *
   * NaN when the list is empty.
   *
   * @example
   * Arithmetic.percentile([1, 2, 3, 4], 50); // 2.5
   */
  public static percentile(values: number[], p: number): number {
    if (values.length === 0) {
      return NaN;
    }

    const sorted = [...values].sort((a, b) => a - b);

    if (sorted.length === 1) {
      return sorted[0];
    }

    const position = (Arithmetic.clamp(p, 0, 100) / 100) * (sorted.length - 1);
    const lower = Math.floor(position);
    const upper = Math.ceil(position);

    if (lower === upper) {
      return sorted[lower];
    }

    return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
  }
}
