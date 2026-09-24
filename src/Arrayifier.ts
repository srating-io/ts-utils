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

// Built once: a collator is far cheaper to reuse than String.localeCompare,
// which rebuilds its collation table on every comparison.
const COLLATOR = new Intl.Collator();

export class Arrayifier {
  // constructor() {
  // }


  /**
    * Shuffle / ranomize elements in an array
    * @param {array} array The array to shuffle
    * @return array
    */
  public static shuffle<T>(array: T[]): T[] {
    let currentIndex: number = array.length;
    let randomIndex: number;

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      // eslint-disable-next-line no-param-reassign
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
  }

  /**
   * Recursively generates all combinations of size `r` from an array of `n` elements.
   *
   * @param {T[]} arr - The source array to generate combinations from
   * @param {number} n - The total number of elements in `arr` (i.e. arr.length)
   * @param {number} r - The size of each combination to generate
   * @param {number} index - Current position being filled in the combination (increments toward r)
   * @param {T[]} data - Temporary buffer holding the current combination being built
   * @param {number} i - Current index in `arr` being considered for inclusion
   * @param {T[][]} results - Accumulator array that collects each completed combination
   * @returns {T[][]} The accumulated list of all combinations once recursion completes
   *
   * @example
   * combination([1, 2, 3], 3, 2, 0, [], 0, [])
   * // returns [[1, 2], [1, 3], [2, 3]]
   */
  public static combination<T>(
    arr: T[],
    n: number,
    r: number,
    index: number,
    data: T[],
    i: number,
    results: T[][],
  ): T[][] {
    if (index === r) {
      results.push(data.slice(0, r));
      return results;
    }

    if (i >= n) {
      return results;
    }

    // eslint-disable-next-line no-param-reassign
    data[index] = arr[i];
    this.combination(arr, n, r, index + 1, data, i + 1, results);
    this.combination(arr, n, r, index, data, i + 1, results);

    return results;
  }

  /**
   * Get all combinations of size `r` from the provided array.
   *
   * @param arr The source array
   * @param r The size of each combination
   *
   * @example
   * Arrayifier.getCombinations([1, 2, 3], 2);
   * // [[1, 2], [1, 3], [2, 3]]
   */
  public static getCombinations<T>(arr: T[], r: number): T[][];
  /**
   * Get all combinations of size `r`, considering only the first `n` elements.
   *
   * @param arr The source array
   * @param n How many leading elements to draw from
   * @param r The size of each combination
   */
  public static getCombinations<T>(arr: T[], n: number, r: number): T[][];
  public static getCombinations<T>(arr: T[], nOrR: number, maybeR?: number): T[][] {
    // Two-argument form: `n` is the whole array, so callers need not repeat
    // arr.length. The three-argument form is kept for existing callers.
    const n = maybeR === undefined ? arr.length : nOrR;
    const r = maybeR === undefined ? nOrR : maybeR;

    const data: T[] = new Array(r);

    let results: T[][] = [];
    results = this.combination(arr, n, r, 0, data, 0, results);
    return results;
  }

  /**
   * Split an array into consecutive chunks of at most `size`.
   *
   * @example
   * Arrayifier.chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
   */
  public static chunk<T>(arr: T[], size: number): T[][] {
    if (size < 1) {
      throw new Error(`chunk size must be at least 1. Sent ${size}`);
    }

    const chunks: T[][] = [];

    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }

    return chunks;
  }

  /**
   * Remove duplicate values, keeping the first occurrence of each.
   *
   * Compares by identity, so it suits primitives; use `uniqueBy` for objects.
   *
   * @example
   * Arrayifier.unique([1, 2, 2, 3, 1]); // [1, 2, 3]
   */
  public static unique<T>(arr: T[]): T[] {
    return [...new Set(arr)];
  }

  /**
   * Remove duplicates by a derived key, keeping the first of each key.
   *
   * @example
   * Arrayifier.uniqueBy(players, (p) => p.team_id);
   */
  public static uniqueBy<T, K>(arr: T[], keyFn: (item: T, index: number) => K): T[] {
    const seen = new Set<K>();

    return arr.filter((item, index) => {
      const key = keyFn(item, index);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }

  /**
   * Bucket items by a derived key.
   *
   * @example
   * Arrayifier.groupBy(games, (g) => g.season);
   * // { 2025: [...], 2026: [...] }
   */
  public static groupBy<T, K extends string | number>(
    arr: T[],
    keyFn: (item: T, index: number) => K,
  ): Record<K, T[]> {
    // Null prototype: a key drawn from data can be '__proto__', which on a
    // plain object hits the prototype setter instead of creating an own entry.
    const groups = Object.create(null) as Record<K, T[]>;

    for (let i = 0; i < arr.length; i++) {
      const key = keyFn(arr[i], i);

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(arr[i]);
    }

    return groups;
  }

  /**
   * Count items by a derived key.
   *
   * @example
   * Arrayifier.countBy(games, (g) => g.status); // { final: 12, live: 3 }
   */
  public static countBy<T, K extends string | number>(
    arr: T[],
    keyFn: (item: T, index: number) => K,
  ): Record<K, number> {
    // Null prototype for the same reason as `groupBy`: on a plain object a
    // '__proto__' key is swallowed by the prototype setter and the count lost.
    const counts = Object.create(null) as Record<K, number>;

    for (let i = 0; i < arr.length; i++) {
      const key = keyFn(arr[i], i);
      counts[key] = (counts[key] ?? 0) + 1;
    }

    return counts;
  }

  /**
   * Sort by a derived value, without mutating the input.
   *
   * Numbers compare numerically and everything else as strings. Null and
   * undefined keys sort last regardless of direction.
   *
   * @example
   * Arrayifier.sortBy(teams, (t) => t.rating, 'desc');
   */
  public static sortBy<T>(
    arr: T[],
    keyFn: (item: T) => string | number | null | undefined,
    direction: 'asc' | 'desc' = 'asc',
  ): T[] {
    const factor = direction === 'desc' ? -1 : 1;

    // Keys are derived once per item rather than once per comparison: sort
    // calls the comparator O(n log n) times, and keyFn is caller-supplied.
    const decorated = arr.map((item) => ({ item, key: keyFn(item) }));

    decorated.sort((a, b) => {
      const aKey = a.key;
      const bKey = b.key;

      const aEmpty = aKey === null || aKey === undefined;
      const bEmpty = bKey === null || bKey === undefined;

      if (aEmpty && bEmpty) {
        return 0;
      }
      if (aEmpty) {
        return 1;
      }
      if (bEmpty) {
        return -1;
      }

      if (typeof aKey === 'number' && typeof bKey === 'number') {
        return (aKey - bKey) * factor;
      }

      return COLLATOR.compare(String(aKey), String(bKey)) * factor;
    });

    return decorated.map((entry) => entry.item);
  }

  /**
   * Split into the items that satisfy the predicate and those that do not.
   *
   * @example
   * const [wins, losses] = Arrayifier.partition(games, (g) => g.won);
   */
  public static partition<T>(
    arr: T[],
    predicate: (item: T, index: number) => boolean,
  ): [T[], T[]] {
    const passed: T[] = [];
    const failed: T[] = [];

    arr.forEach((item, index) => {
      if (predicate(item, index)) {
        passed.push(item);
      } else {
        failed.push(item);
      }
    });

    return [passed, failed];
  }

  /**
   * A sequence of numbers from `start` up to but excluding `end`.
   *
   * Called with one argument, counts from 0 up to it.
   *
   * @example
   * Arrayifier.range(4);        // [0, 1, 2, 3]
   * Arrayifier.range(1, 4);     // [1, 2, 3]
   * Arrayifier.range(0, 10, 5); // [0, 5]
   */
  public static range(start: number, end?: number, step: number = 1): number[] {
    const from = end === undefined ? 0 : start;
    const to = end === undefined ? start : end;

    if (step === 0) {
      throw new Error('range step cannot be 0');
    }

    const values: number[] = [];

    if (step > 0) {
      for (let i = from; i < to; i += step) {
        values.push(i);
      }
    } else {
      for (let i = from; i > to; i += step) {
        values.push(i);
      }
    }

    return values;
  }
}
