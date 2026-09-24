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

import { Arrayifier } from '../dist/esm/index.js';
import { suite, bench } from './harness.js';

const SEASONS = [2023, 2024, 2025, 2026];
const STATUSES = ['final', 'live', 'scheduled', 'postponed'];

const games = Array.from({ length: 10_000 }, (unused, i) => ({
  game_id: i,
  team: `Team ${i % 400}`,
  season: SEASONS[i % SEASONS.length],
  status: STATUSES[i % STATUSES.length],
  rating: Math.random() * 2000,
}));

const numbers = Array.from({ length: 10_000 }, () => Math.floor(Math.random() * 2000));

suite('Arrayifier (10k rows)', () => {
  bench('groupBy() 4 keys', () => Arrayifier.groupBy(games, (g) => g.season));
  bench('groupBy() 400 keys', () => Arrayifier.groupBy(games, (g) => g.team));
  bench('countBy()', () => Arrayifier.countBy(games, (g) => g.status));

  // The string path goes through Intl.Collator, the numeric path does not.
  bench('sortBy() numeric', () => Arrayifier.sortBy(games, (g) => g.rating));
  bench('sortBy() string', () => Arrayifier.sortBy(games, (g) => g.team));

  bench('unique()', () => Arrayifier.unique(numbers));
  bench('uniqueBy()', () => Arrayifier.uniqueBy(games, (g) => g.team));
  bench('partition()', () => Arrayifier.partition(games, (g) => g.status === 'final'));
  bench('chunk(100)', () => Arrayifier.chunk(games, 100));
  bench('range(10k)', () => Arrayifier.range(10_000));
});

suite('Arrayifier (combinatorial)', () => {
  const players = Arrayifier.range(16);

  // Grows as C(n, r); this is the shape that actually gets expensive.
  bench('getCombinations(16, 2)', () => Arrayifier.getCombinations(players, 2));
  bench('getCombinations(16, 4)', () => Arrayifier.getCombinations(players, 4));
});
