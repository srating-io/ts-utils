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

import { Dates } from '../dist/esm/index.js';
import { suite, bench } from './harness.js';

const isoDate = '2026-03-14';
const messy = '03/14/2026 11:30:00 pm';
const instance = new Date(2026, 2, 14, 23, 30);

suite('Dates.parse', () => {
  // Three different branches of the parser, with very different costs.
  bench('Date instance', () => Dates.parse(instance));
  bench('ISO date string', () => Dates.parse(isoDate));
  bench('messy string', () => Dates.parse(messy));
});

suite('Dates.format', () => {
  // The local path builds two Intl.DateTimeFormat instances per call for the
  // timezone tokens; the UTC path short circuits both.
  bench('local, no tz token', () => Dates.format(instance, 'Y-m-d H:i:s'));
  bench('local, with tz token', () => Dates.format(instance, 'Y-m-d H:i:s T'));
  bench('utc', () => Dates.format(instance, 'Y-m-d H:i:s', true));
});

suite('Dates (calendar)', () => {
  bench('getStartOfDay()', () => Dates.getStartOfDay(instance));
  bench('getEndOfMonth()', () => Dates.getEndOfMonth(instance));
  bench('isSameDay()', () => Dates.isSameDay(instance, isoDate));
  bench('isBetween()', () => Dates.isBetween(instance, '2026-01-01', '2026-12-31'));
  bench('diff()', () => Dates.diff(instance, isoDate));

  // A full month grid, the shape a calendar component renders.
  bench('eachDayOfInterval() 6wk', () => Dates.eachDayOfInterval(
    Dates.getStartOfGrid(instance),
    Dates.getEndOfGrid(instance),
  ));
});
