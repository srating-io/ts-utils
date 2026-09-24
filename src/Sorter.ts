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
 * Table sorting helper utility
 */
export class Sorter {
  public static descendingComparator(a: Record<string, string | number>, b: Record<string, string | number>, orderBy: string, direction_?: string): number {
    const a_value = a[orderBy];
    const b_value = b[orderBy];

    // Null/undefined values always sort to the end, regardless of direction.
    // Both branches must be checked against the *values* (not key presence),
    // otherwise two null rows compare as non-equal and the comparator stops
    // being antisymmetric, which yields an inconsistent sort order.
    const a_empty = a_value === null || a_value === undefined;
    const b_empty = b_value === null || b_value === undefined;

    if (a_empty && b_empty) {
      return 0;
    }
    if (b_empty) {
      return 1;
    }
    if (a_empty) {
      return -1;
    }

    const direction = direction_ || 'lower';

    if (b_value < a_value) {
      return direction === 'higher' ? 1 : -1;
    }
    if (b_value > a_value) {
      return direction === 'higher' ? -1 : 1;
    }
    return 0;
  }

  public static getComparator(order: string, orderBy: string, direction?: string): (a: Record<string, string | number>, b: Record<string, string | number>) => number {
    return order === 'desc'
      ? (a, b) => this.descendingComparator(a, b, orderBy, direction)
      : (a, b) => -this.descendingComparator(a, b, orderBy, direction);
  }
}
