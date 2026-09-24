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

import { Numbers } from '../dist/esm/index.js';
import { suite, bench } from './harness.js';

const locales = ['en-US', 'de-DE', 'fr-FR', 'ja-JP'];
let spin = 0;

suite('Numbers (formatting)', () => {
  bench('format()', () => Numbers.format(1_234_567.891, 2));
  bench('formatSigned()', () => Numbers.formatSigned(1234.5, 1));
  bench('formatPercent()', () => Numbers.formatPercent(0.1234));
  bench('formatCompact()', () => Numbers.formatCompact(1_234_567));
  bench('formatDuration()', () => Numbers.formatDuration(3_725_000, 3));
  bench('formatBytes()', () => Numbers.formatBytes(1_536_000));
  bench('formatOrdinal()', () => Numbers.formatOrdinal(23));
});

suite('Numbers (formatter cache)', () => {
  // One locale reuses a single cached Intl.NumberFormat.
  bench('format() one locale', () => Numbers.format(1234.5, 2, 'en-US'));

  // Rotating locales still hits the cache, just across four entries. If this
  // ever collapses toward the cost of construction, the cache key is wrong.
  bench('format() 4 locales', () => {
    spin = (spin + 1) % locales.length;
    return Numbers.format(1234.5, 2, locales[spin]);
  });

  // The floor to compare against: what an uncached call actually costs.
  bench('uncached Intl baseline', () => new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(1234.5));
});
