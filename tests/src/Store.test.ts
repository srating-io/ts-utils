/* eslint-disable no-restricted-syntax */
import { jest } from '@jest/globals';
import { Store } from '../../src/Kontororu/Store.js';

interface User {
  user_id: string;
  name: string;
  // Rows are loaded loosely, so a replacement row need not carry every column.
  team?: string;
  active?: boolean;
}

// The index signature keeps reads of an unknown table type-checkable, which
// several tests below rely on.
interface TestStore {
  user: Record<string, User>;
  [table: string]: Record<string, User>;
}

const seed = () => {
  const store = new Store<TestStore>();
  store.load({
    user: {
      1: { user_id: '1', name: 'Ada', team: 'red', active: true },
      2: { user_id: '2', name: 'Grace', team: 'blue', active: false },
      3: { user_id: '3', name: 'Alan', team: 'red', active: true },
    },
  });
  return store;
};

describe('Store', () => {
  describe('read()', () => {
    test('returns the whole table when no arguments are given', () => {
      expect(Object.keys(seed().read('user'))).toEqual(['1', '2', '3']);
    });

    test('returns an empty object for an unknown table', () => {
      expect(seed().read('nope')).toEqual({});
    });

    test('looks a row up by primary key', () => {
      expect(seed().read('user', { user_id: '2' })).toEqual({
        2: { user_id: '2', name: 'Grace', team: 'blue', active: false },
      });
    });

    test('returns nothing for an unknown primary key', () => {
      expect(seed().read('user', { user_id: '99' })).toEqual({});
    });

    test('filters by a non-primary-key column', () => {
      expect(Object.keys(seed().read('user', { team: 'red' }))).toEqual(['1', '3']);
    });

    test('applies every filter, not just the first', () => {
      expect(Object.keys(seed().read('user', { team: 'red', active: true }))).toEqual(['1', '3']);
      expect(seed().read('user', { team: 'red', active: false })).toEqual({});
    });

    test('applies the remaining filters alongside a primary key', () => {
      // The primary key fast path still applies the remaining arguments, or a
      // filtered read would return a row that does not match the filter.
      expect(seed().read('user', { user_id: '2', active: true })).toEqual({});

      expect(seed().read('user', { user_id: '2', active: false })).toEqual({
        2: { user_id: '2', name: 'Grace', team: 'blue', active: false },
      });
    });

    test('treats an array argument as a membership test', () => {
      expect(Object.keys(seed().read('user', { name: ['Ada', 'Alan'] }))).toEqual(['1', '3']);
    });

    test('combines an array argument with the primary key', () => {
      expect(seed().read('user', { user_id: '1', team: ['red', 'green'] })).toEqual({
        1: { user_id: '1', name: 'Ada', team: 'red', active: true },
      });
      expect(seed().read('user', { user_id: '1', team: ['blue'] })).toEqual({});
    });

    test('compares non-key columns strictly, without type coercion', () => {
      // '1' is not 1; only the row-id lookup goes through JS key coercion.
      expect(seed().read('user', { name: 1 as unknown as string })).toEqual({});
      expect(seed().read('user', { active: 'true' })).toEqual({});
    });

    test('returns nothing when a column does not exist on any row', () => {
      expect(seed().read('user', { missing: 'x' })).toEqual({});
    });

    test('returns deep clones, so mutating results cannot corrupt the store', () => {
      const store = seed();
      const first = store.read('user', { user_id: '1' });

      first['1'].name = 'MUTATED';

      expect(store.read('user', { user_id: '1' })['1'].name).toBe('Ada');
    });

    test('returns deep clones for whole-table reads too', () => {
      const store = seed();
      const all = store.read('user');

      all['1'].name = 'MUTATED';

      expect(store.read('user')['1'].name).toBe('Ada');
    });

    test('returns deep clones for filtered reads too', () => {
      const store = seed();
      const reds = store.read('user', { team: 'red' });

      reds['1'].name = 'MUTATED';

      expect(store.read('user', { team: 'red' })['1'].name).toBe('Ada');
    });
  });

  describe('get()', () => {
    test('returns the first matching row', () => {
      expect(seed().get('user', { team: 'red' })).toEqual({
        user_id: '1', name: 'Ada', team: 'red', active: true,
      });
    });

    test('returns the row for a primary key lookup', () => {
      expect(seed().get('user', { user_id: '3' })?.name).toBe('Alan');
    });

    test('returns null when nothing matches', () => {
      expect(seed().get('user', { team: 'green' })).toBeNull();
    });

    test('returns null for an unknown table', () => {
      expect(seed().get('nope')).toBeNull();
    });

    test('honours every filter', () => {
      expect(seed().get('user', { user_id: '2', active: true })).toBeNull();
    });
  });

  describe('load()', () => {
    test('replaces previously loaded data', () => {
      const store = seed();
      store.load({ user: { 9: { user_id: '9', name: 'Nine' } } });

      expect(Object.keys(store.read('user'))).toEqual(['9']);
    });

    test('an unloaded store reads as empty', () => {
      expect(new Store().read('user')).toEqual({});
    });
  });

  describe('inheritance', () => {
    test('is an event target, like Kontororu', () => {
      const store = new Store();
      const listener = jest.fn();

      store.addEventListener('changed', listener);
      store.dispatchEvent(new Event('changed'));

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
