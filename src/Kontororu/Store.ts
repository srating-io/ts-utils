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

    // Fast path: Direct primary key lookup
    if (primaryKey in args) {
      const id = args[primaryKey] as string;
      if (data[id]) {
        return { [id]: Objector.deepClone(data[id]) as TStore[K][string] };
      }
      return {};
    }

    // If no arguments are provided, return a deep clone of the entire table
    if (Object.keys(args).length === 0) {
      return Objector.deepClone(data) as Record<string, TStore[K][string]>;
    }

    const matches: Record<string, TStore[K][string]> = {};
    const mismatches: Record<string, boolean> = {};

    for (const id in data) {
      if (id in mismatches) {
        continue;
      }

      const row = data[id];
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        continue;
      }

      for (const column in args) {
        let match = false;
        const argVal = args[column];
        const rowVal = (row as Record<string, unknown>)[column];

        if (rowVal === argVal) {
          match = true;
        } else if (Array.isArray(argVal) && argVal.includes(rowVal)) {
          match = true;
        }

        if (match) {
          matches[id] = Objector.deepClone(row) as TStore[K][string];
        } else {
          mismatches[id] = true;
          delete matches[id];
          break;
        }
      }
    }

    return matches;
  }
}
