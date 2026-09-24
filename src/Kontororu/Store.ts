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

import { Kontororu } from '../Kontororu.js';
import { Objector } from '../Objector.js';


export type StoreData = Record<string, Record<string, unknown>>;

/**
 * A query resolved once, ahead of the row scan.
 *
 * `values` and `lists` mirror `columns` by index. Resolving them per row costs
 * a lookup into `args` and an Array.isArray() call for every column of every
 * row, none of which can change between rows.
 */
interface Filter {
  columns: string[];
  values: unknown[];
  lists: boolean[];
}

function toFilter(args: Record<string, unknown>, skip?: string): Filter {
  const columns: string[] = [];
  const values: unknown[] = [];
  const lists: boolean[] = [];

  for (const column of Object.keys(args)) {
    if (column === skip) {
      continue;
    }

    const value = args[column];

    columns.push(column);
    values.push(value);
    lists.push(Array.isArray(value));
  }

  return { columns, values, lists };
}

/**
 * Whether a row satisfies every column of the filter, by strict equality or by
 * membership when the argument is an array.
 */
function matchesRow(row: unknown, { columns, values, lists }: Filter): boolean {
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    return false;
  }

  const record = row as Record<string, unknown>;

  for (let i = 0; i < columns.length; i++) {
    const rowValue = record[columns[i]];

    if (rowValue === values[i]) {
      continue;
    }

    if (lists[i] && (values[i] as unknown[]).includes(rowValue)) {
      continue;
    }

    return false;
  }

  return true;
}

export class Store<TStore extends StoreData = StoreData> extends Kontororu {
  private store: TStore = {} as TStore;

  /**
   * Load an object into the store
   */
  load(data: TStore) {
    this.store = data;
  }

  /**
   * Get the first result
   */
  get<K extends keyof TStore>(table: K, args: Record<string, unknown> = {}): TStore[K][string] | null {
    const results = this.read(table, args);
    const firstId = Object.keys(results)[0];
    return firstId ? (results[firstId] as TStore[K][string]) : null;
  }

  /**
   * Read the results
   */
  read<K extends keyof TStore>(table: K, args: Record<string, unknown> = {}): Record<string, TStore[K][string]> {
    const data = this.store[table];
    if (!data) {
      return {};
    }

    const primaryKey = `${String(table)}_id`;

    // Fast path: Direct primary key lookup.
    // Any remaining arguments still have to be applied to the row we found,
    // otherwise `read('user', { user_id: '1', active: true })` would return
    // user 1 even when that user is inactive.
    if (primaryKey in args) {
      const id = args[primaryKey] as string;
      const row = data[id];

      return row && matchesRow(row, toFilter(args, primaryKey))
        ? { [id]: Objector.deepClone(row) as TStore[K][string] }
        : {};
    }

    // If no arguments are provided, return a deep clone of the entire table
    if (Object.keys(args).length === 0) {
      return Objector.deepClone(data) as Record<string, TStore[K][string]>;
    }

    const filter = toFilter(args);
    const matches: Record<string, TStore[K][string]> = {};

    // Cloning only full matches matters more than the scan itself: a row is
    // wide, so cloning one that a later column rejects costs far more than
    // testing all of its columns first.
    for (const id in data) {
      const row = data[id];

      if (matchesRow(row, filter)) {
        matches[id] = Objector.deepClone(row) as TStore[K][string];
      }
    }

    return matches;
  }
}
