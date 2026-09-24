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

import { Textor } from '../dist/esm/index.js';
import { suite, bench } from './harness.js';

const shortA = 'Kansas City Chiefs';
const shortB = 'Kansas City Royals';

const longA = 'a'.repeat(200);
const longB = `${'a'.repeat(150)}${'b'.repeat(50)}`;

suite('Textor.levenshtein', () => {
  // O(a*b) in both time and memory, so cost grows sharply with length.
  bench('18 x 18 chars', () => Textor.levenshtein(shortA, shortB));
  bench('200 x 200 chars', () => Textor.levenshtein(longA, longB));
  bench('empty short circuit', () => Textor.levenshtein('', shortB));
});

suite('Textor (formatting)', () => {
  bench('toKebabCase()', () => Textor.toKebabCase('backgroundColorPrimary'));
  bench('toSentenceCase()', () => Textor.toSentenceCase('  THE QUICK BROWN FOX  '));
});
