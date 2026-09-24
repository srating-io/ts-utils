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

import { Arithmetic } from '../dist/esm/index.js';
import { suite, bench } from './harness.js';

const ratings = Array.from({ length: 10_000 }, () => 1000 + Math.random() * 1000);

// Few distinct values, as a rating bucket or a score column would have.
const buckets = Array.from({ length: 10_000 }, () => Math.floor(Math.random() * 50));

suite('Arithmetic (10k values)', () => {
  bench('sum()', () => Arithmetic.sum(ratings));
  bench('mean()', () => Arithmetic.mean(ratings));
  bench('variance()', () => Arithmetic.variance(ratings));
  bench('stdDev()', () => Arithmetic.stdDev(ratings));

  // Both sort a copy, so they carry the O(n log n) the others avoid.
  bench('median()', () => Arithmetic.median(ratings));
  bench('percentile(95)', () => Arithmetic.percentile(ratings, 95));

  bench('mode() few distinct', () => Arithmetic.mode(buckets));
  bench('mode() all distinct', () => Arithmetic.mode(ratings));
});

suite('Arithmetic (scalar)', () => {
  bench('clamp()', () => Arithmetic.clamp(1500, 1000, 2000));
  bench('lerp()', () => Arithmetic.lerp(0, 100, 0.25));
  bench('round(2)', () => Arithmetic.round(1234.5678, 2));
  bench('mapRange()', () => Arithmetic.mapRange(1500, 1000, 2000, 0, 100));
});
