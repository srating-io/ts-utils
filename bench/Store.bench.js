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

import { Store, Sorter, uuidService } from '../dist/esm/index.js';
import { suite, bench } from './harness.js';

const CONFERENCES = ['east', 'west', 'north', 'south'];

const users = {};
for (let i = 0; i < 5_000; i++) {
  users[i] = {
    user_id: String(i),
    name: `User ${i}`,
    active: i % 3 !== 0,
    conference: CONFERENCES[i % CONFERENCES.length],
  };
}

const store = new Store();
store.load({ user: users });

suite('Store.read (5k rows)', () => {
  // Every read deep-clones what it returns, so the result size drives the cost
  // far more than the scan does.
  bench('primary key hit', () => store.read('user', { user_id: '2500' }));
  bench('primary key + filter', () => store.read('user', { user_id: '2500', active: true }));
  bench('scan, 1 match', () => store.read('user', { name: 'User 2500' }));
  bench('scan, ~1250 matches', () => store.read('user', { conference: 'east' }));
  bench('scan, array membership', () => store.read('user', { conference: ['east', 'west'] }));
  bench('whole table clone', () => store.read('user'));
  bench('get() single row', () => store.get('user', { user_id: '2500' }));
});

// A realistically wide table: the clone cost per matched row scales with the
// column count, and the scan cost with the row count.
const WIDE_ROWS = 50_000;
const WIDE_COLS = 20;

const wide = {};
for (let i = 0; i < WIDE_ROWS; i++) {
  const row = {
    wide_id: String(i),
    team: i % 2 ? 'red' : 'blue',
    rare: i < 10 ? 'yes' : 'no',
  };

  for (let c = 0; c < WIDE_COLS - 3; c++) {
    row[`col${c}`] = `v${i}_${c}`;
  }

  wide[String(i)] = row;
}

const wideStore = new Store();
wideStore.load({ wide });

suite('Store.read (50k rows x 20 cols)', () => {
  bench('primary key', () => wideStore.read('wide', { wide_id: '25000' }));
  bench('1 column, 10 matches', () => wideStore.read('wide', { rare: 'yes' }));

  // The case that punishes cloning before the filter is fully decided: the
  // first column matches half the table, the second narrows it to five.
  bench('2 columns, 5 matches', () => wideStore.read('wide', { team: 'red', rare: 'yes' }));

  bench('no matches', () => wideStore.read('wide', { team: 'green' }));
  bench('array membership', () => wideStore.read('wide', { team: ['red', 'green'], rare: 'yes' }));

  // Dominated by deepClone of 25k wide rows, not by the scan.
  bench('1 column, 25k matches', () => wideStore.read('wide', { team: 'red' }));
});

const rows = Object.values(users);

suite('Sorter', () => {
  const byName = Sorter.getComparator('desc', 'name');

  bench('getComparator()', () => Sorter.getComparator('desc', 'name'));
  bench('sort 5k rows', () => [...rows].sort(byName));
});

const bin = uuidService.generateUUIDv7Bytes();
const uuid = uuidService.binToUuid(bin);

suite('uuidService', () => {
  bench('generateUUIDv7Bytes()', () => uuidService.generateUUIDv7Bytes());
  bench('uuidToBin()', () => uuidService.uuidToBin(uuid));
  bench('binToUuid()', () => uuidService.binToUuid(bin));
  bench('isValid()', () => uuidService.isValid(uuid));
});
