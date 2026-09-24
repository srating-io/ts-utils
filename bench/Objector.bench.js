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

import { Objector } from '../dist/esm/index.js';
import { suite, bench } from './harness.js';

function makeRow(i) {
  return {
    game_id: i,
    home: { name: `Home ${i}`, rating: Math.random() * 2000, streak: [1, 0, 1, 1] },
    away: { name: `Away ${i}`, rating: Math.random() * 2000, streak: [0, 0, 1, 0] },
    played_at: new Date(2026, 0, (i % 28) + 1),
    tags: new Set(['ranked', 'conference']),
  };
}

const flat = Object.fromEntries(
  Array.from({ length: 500 }, (unused, i) => [i, { id: i, name: `Row ${i}`, value: i * 3 }]),
);

const nested = Array.from({ length: 200 }, (unused, i) => makeRow(i));
const nestedCopy = Objector.deepClone(nested);

// Worst case for deepEqual: identical until the very last leaf, so every
// comparison runs to completion.
const divergent = Objector.deepClone(nested);
divergent[nested.length - 1].away.rating = -1;

suite('Objector.deepClone', () => {
  bench('flat object (500 rows)', () => Objector.deepClone(flat));
  bench('nested + Date + Set (200 rows)', () => Objector.deepClone(nested));
});

suite('Objector.deepEqual', () => {
  bench('equal (200 rows)', () => Objector.deepEqual(nested, nestedCopy));
  bench('differs at last leaf', () => Objector.deepEqual(nested, divergent));
  bench('differs at first key', () => Objector.deepEqual(nested, [{ game_id: -1 }]));
});

suite('Objector.extender', () => {
  const target = { a: 1, nested: { deep: true } };
  const source = { b: 2, nested: { other: false } };

  bench('extender()', () => Objector.extender({ ...target }, source));
});
