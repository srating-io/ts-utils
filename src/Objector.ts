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

/* eslint-disable no-restricted-syntax */

type Merge<T, U> = Omit<T, keyof U> & U;

type MergeAll<T extends object[]> =
  T extends [infer First extends object, ...infer Rest extends object[]]
    ? Rest extends []
      ? First // Base case: If there are no more items, just return the object
      : Merge<First, MergeAll<Rest>> // Otherwise, keep merging
    : unknown;

/**
 * Class to manipulate objects
 */
export class Objector {
  // constructor() {
  // }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static deepClone<T>(obj: T, memo: WeakMap<any, any> = new WeakMap<any, any>()): T {
    // Check if the input is null or not an object/array
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // Check if the object is already in the memo
    if (memo.has(obj)) {
      return memo.get(obj);
    }

    // Handle built-in types.
    // Every branch registers its clone in the memo *before* recursing into
    // children, so self-referential structures terminate instead of
    // overflowing the stack, and repeated references stay shared.
    if (obj instanceof Date) {
      const clonedDate = new Date(obj.getTime());
      memo.set(obj, clonedDate);
      return clonedDate as unknown as T;
    }
    if (obj instanceof RegExp) {
      const clonedRegExp = new RegExp(obj.source, obj.flags);
      memo.set(obj, clonedRegExp);
      return clonedRegExp as unknown as T;
    }
    if (obj instanceof Map) {
      const clonedMap = new Map();
      memo.set(obj, clonedMap);
      obj.forEach((value, key) => clonedMap.set(key, Objector.deepClone(value, memo)));
      return clonedMap as unknown as T;
    }
    if (obj instanceof Set) {
      const newSet = new Set();
      memo.set(obj, newSet);
      for (const item of obj) {
        newSet.add(Objector.deepClone(item, memo));
      }
      return newSet as unknown as T;
    }

    // Handle arrays
    if (Array.isArray(obj)) {
      const clonedArray: unknown[] = new Array(obj.length);
      memo.set(obj, clonedArray);
      obj.forEach((item, index) => {
        clonedArray[index] = Objector.deepClone(item, memo);
      });
      return clonedArray as unknown as T;
    }

    // Handle objects
    const clonedObj = Object.create(Object.getPrototypeOf(obj)) as Record<string | symbol, unknown>;
    memo.set(obj, clonedObj);

    // Cast the source 'obj' to a record so we can read its keys dynamically
    const sourceObj = obj as Record<string | symbol, unknown>;

    // per Gemini
    /**
     * While it appears to be two steps, the first step (Object.keys()) is a native C++ function in the JavaScript engine.
     * It's highly optimized for this specific task and is often faster than the JIT compiler can make the for...in loop with its conditional checks.
     */
    Object.keys(sourceObj).forEach((key) => {
      clonedObj[key] = Objector.deepClone(sourceObj[key], memo);
    });
    /*
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = Objector.deepClone(obj[key], memo);
      }
    }
    */

    // Symbol keys
    Object.getOwnPropertySymbols(sourceObj).forEach((sym) => {
      if (Object.prototype.propertyIsEnumerable.call(sourceObj, sym)) {
        clonedObj[sym] = Objector.deepClone(sourceObj[sym], memo);
      }
    });

    return clonedObj as unknown as T;
  }

  /**
   * Structurally compares two values.
   *
   * Handles the same shapes `deepClone` does — Date, RegExp, Map, Set, arrays,
   * plain objects and symbol keys — and tolerates circular references by
   * remembering which pairs are already being compared.
   *
   * NaN equals NaN, and +0 does not equal -0, matching `Object.is` rather than
   * `===`. Objects must share a prototype to be considered equal.
   *
   * @example
   * Objector.deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] }); // true
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static deepEqual(a: unknown, b: unknown, seen: WeakMap<any, Set<any>> = new WeakMap()): boolean {
    if (Object.is(a, b)) {
      return true;
    }

    if (
      a === null || b === null ||
      typeof a !== 'object' || typeof b !== 'object'
    ) {
      return false;
    }

    if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
      return false;
    }

    // Already comparing this exact pair further up the stack: treat as equal
    // and let the rest of the traversal decide.
    const pairs = seen.get(a);
    if (pairs?.has(b)) {
      return true;
    }
    if (pairs) {
      pairs.add(b);
    } else {
      seen.set(a, new Set([b]));
    }

    if (a instanceof Date) {
      return a.getTime() === (b as Date).getTime();
    }

    if (a instanceof RegExp) {
      return a.source === (b as RegExp).source && a.flags === (b as RegExp).flags;
    }

    if (a instanceof Map) {
      const other = b as Map<unknown, unknown>;

      if (a.size !== other.size) {
        return false;
      }

      return [...a.entries()].every(
        ([key, value]) => other.has(key) && Objector.deepEqual(value, other.get(key), seen),
      );
    }

    if (a instanceof Set) {
      const other = b as Set<unknown>;

      if (a.size !== other.size) {
        return false;
      }

      const remaining = [...other];

      // Members have no keys to match on, so each one is paired against the
      // first structurally equal member not already claimed.
      return [...a].every((value) => {
        const match = remaining.findIndex((candidate) => Objector.deepEqual(value, candidate, seen));

        if (match === -1) {
          return false;
        }

        remaining.splice(match, 1);
        return true;
      });
    }

    if (Array.isArray(a)) {
      const other = b as unknown[];

      if (a.length !== other.length) {
        return false;
      }

      return a.every((value, index) => Objector.deepEqual(value, other[index], seen));
    }

    const aRecord = a as Record<string | symbol, unknown>;
    const bRecord = b as Record<string | symbol, unknown>;

    const aKeys = Object.keys(aRecord);
    const bKeys = Object.keys(bRecord);

    if (aKeys.length !== bKeys.length) {
      return false;
    }

    const keysMatch = aKeys.every(
      (key) => Object.prototype.hasOwnProperty.call(bRecord, key) &&
        Objector.deepEqual(aRecord[key], bRecord[key], seen),
    );

    if (!keysMatch) {
      return false;
    }

    const aSymbols = Object.getOwnPropertySymbols(aRecord)
      .filter((sym) => Object.prototype.propertyIsEnumerable.call(aRecord, sym));
    const bSymbols = Object.getOwnPropertySymbols(bRecord)
      .filter((sym) => Object.prototype.propertyIsEnumerable.call(bRecord, sym));

    if (aSymbols.length !== bSymbols.length) {
      return false;
    }

    return aSymbols.every(
      (sym) => Object.prototype.propertyIsEnumerable.call(bRecord, sym) &&
        Objector.deepEqual(aRecord[sym], bRecord[sym], seen),
    );
  }

  /**
   * Deeply merges one or more source objects into a target object.
   *
   * - Each property from the sources is deep-cloned before being assigned.
   * - Existing properties in the target are overwritten by matching keys in later sources.
   * - Does not use spread or Object.assign.
   * - Mutates and returns the target object.
   *
   * @template T - The type of the target object.
   * @param {T} target - The object to extend.
   * @param {...U[]} sources - One or more source objects whose properties will be copied to the target.
   * @returns {T & U} The mutated target object containing all deep-cloned properties from the sources.
   *
   * @throws {TypeError} If the target is null or undefined.
   *
   * @example
   * const target = { a: 1 };
   * const source = { b: { nested: 2 } };
   * Objector.extender(target, source);
   * // target is now { a: 1, b: { nested: 2 } }
   */
  public static extender<T extends object, U extends object[]>(
    target: T,
    ...sources: U
  ): MergeAll<[T, ...U]> {
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }

    const to = Object(target) as Record<string | symbol, unknown>;

    // eslint-disable-next-line no-restricted-syntax
    for (const source of sources) {
      if (source != null) {
        // Cast the source to an indexable record
        const s = source as Record<string | symbol, unknown>;
        // String keys
        // eslint-disable-next-line no-restricted-syntax
        for (const key of Object.keys(s)) {
          to[key] = Objector.deepClone(s[key]);
        }

        // Symbol keys
        const symbols = Object.getOwnPropertySymbols(s);
        // eslint-disable-next-line no-restricted-syntax
        for (const sym of symbols) {
          if (Object.prototype.propertyIsEnumerable.call(s, sym)) {
            to[sym] = Objector.deepClone(s[sym]);
          }
        }
      }
    }

    return to as MergeAll<[T, ...U]>;
  }
}

