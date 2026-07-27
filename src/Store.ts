
import { Kontororu } from './Kontororu.js';
import { Objector } from './Objector.js';

type StoreData = {
  [table: string]: {
    [id: string]: Record<string, unknown>;
  }
};

export class Store extends Kontororu {
  private store: StoreData = {};

  // constructor() {
  //   super();
  // }


  /**
   * Load an object into the store
   */
  load(data: StoreData) {
    this.store = data;
  }

  get(table: string, args: Record<string, unknown> = {}): Record<string, unknown> | null {
    const results = this.read(table, args);
    const firstId = Object.keys(results)[0];
    return firstId ? results[firstId] : null;
  }

  read(table: string, args: Record<string, unknown> = {}): Record<string, Record<string, unknown>> {
    const data = this.store[table];
    if (!data) {
      return {};
    }

    const primaryKey = `${table}_id`;

    // Fast path: Direct primary key lookup
    if (primaryKey in args) {
      const id = args[primaryKey] as string;
      if (data[id]) {
        return { [id]: Objector.deepClone(data[id]) as Record<string, unknown> };
      }
      return {};
    }


    // If no arguments are provided, return a deep clone of the entire table
    if (Object.keys(args).length === 0) {
      return Objector.deepClone(data) as Record<string, Record<string, unknown>>;
    }

    const matches: Record<string, Record<string, unknown>> = {};
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
        const rowVal = row[column];

        if (
          rowVal === argVal
        ) {
          match = true;
        } else if (
          Array.isArray(argVal) &&
          argVal.includes(rowVal)
        ) {
          match = true;
        }

        if (match) {
          matches[id] = Objector.deepClone(row) as Record<string, unknown>;
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
