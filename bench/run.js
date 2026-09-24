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

/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
/* Suite files are imported in order so the report reads predictably, and the
   console is this script's output device. */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

import { runSuites } from './harness.js';

const benchDir = './bench';
const baselineFile = path.join(benchDir, 'baseline.json');
const distEntry = './dist/esm/index.js';

const args = process.argv.slice(2);
const save = args.includes('--save');
const timeArg = args.find((arg) => arg.startsWith('--time='));
const filter = args.find((arg) => !arg.startsWith('--'));

const time = timeArg ? Number(timeArg.split('=')[1]) : 500;

if (!Number.isFinite(time) || time <= 0) {
  console.error(`--time must be a positive number of milliseconds. Sent ${timeArg}`);
  process.exit(1);
}

// Benchmarks import the built bundle, not src, so they measure what consumers
// actually install.
if (!fs.existsSync(distEntry)) {
  console.error('dist/esm is missing. Run `npm run build` before benchmarking.');
  process.exit(1);
}

function readBaseline() {
  if (save || !fs.existsSync(baselineFile)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(baselineFile, 'utf8')).results ?? {};
  } catch (error) {
    console.error(`Ignoring unreadable baseline: ${error.message}`);
    return {};
  }
}

const files = fs.readdirSync(benchDir)
  .filter((file) => file.endsWith('.bench.js'))
  .sort();

if (files.length === 0) {
  console.error(`No *.bench.js files found in ${benchDir}`);
  process.exit(1);
}

for (const file of files) {
  // Sequential: each import registers its suites into the shared registry, and
  // the order decides the report order.
  // eslint-disable-next-line no-await-in-loop
  await import(pathToFileURL(path.resolve(benchDir, file)).href);
}

const baseline = readBaseline();

if (Object.keys(baseline).length > 0) {
  console.log(`Comparing against baseline from ${baselineFile}`);
}

const results = await runSuites({ filter, time, baseline });

if (save) {
  const payload = {
    savedAt: new Date().toISOString(),
    node: process.version,
    platform: `${process.platform} ${process.arch}`,
    results,
  };

  fs.writeFileSync(baselineFile, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`\nSaved baseline to ${baselineFile}`);
} else {
  console.log('\nRun with --save to record these numbers as the baseline.');
}
