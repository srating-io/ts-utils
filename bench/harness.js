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
/* Suites run one at a time so their measurements do not contend for the CPU,
   which needs an awaited loop rather than an array iteration. */

import { Bench } from 'tinybench';

// Deltas smaller than this are indistinguishable from run-to-run noise on a
// machine that is also running an editor, so they are reported as unchanged.
const NOISE_FLOOR_PERCENT = 5;

// Above this relative margin of error the sample is too unstable to compare.
const UNSTABLE_RME_PERCENT = 5;

const suites = [];
let open = null;

/**
 * Group related benchmarks, the way `describe` groups tests.
 */
export function suite(name, define) {
  if (open) {
    throw new Error(`suite('${name}') cannot be nested inside suite('${open.name}')`);
  }

  open = { name, benches: [] };
  suites.push(open);

  try {
    define();
  } finally {
    open = null;
  }
}

/**
 * Register one benchmark. `setup` runs before every iteration, untimed, and
 * its return value is passed to `fn`. Use it when the benchmark consumes what
 * it is given -- a teardown, a drain, anything destructive -- so each iteration
 * measures the same work rather than an already-emptied fixture. A fixture the
 * benchmark only reads is cheaper to build once at module scope.
 */
export function bench(name, fn, { setup } = {}) {
  if (!open) {
    throw new Error(`bench('${name}') must be called inside a suite()`);
  }

  open.benches.push({ name, fn, setup });
}

export function getSuites() {
  return suites;
}

const colors = {
  reset: '\u001B[0m',
  dim: '\u001B[2m',
  bold: '\u001B[1m',
  red: '\u001B[31m',
  green: '\u001B[32m',
  yellow: '\u001B[33m',
};

function paint(text, color) {
  return process.stdout.isTTY ? `${colors[color]}${text}${colors.reset}` : text;
}

function formatOps(opsPerSecond) {
  return `${Math.round(opsPerSecond).toLocaleString('en-US')} ops/s`;
}

/**
 * A duration given in milliseconds, rendered in whichever unit keeps it
 * readable.
 */
function formatDuration(ms) {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)} s`;
  }
  if (ms >= 1) {
    return `${ms.toFixed(2)} ms`;
  }
  if (ms >= 0.001) {
    return `${(ms * 1000).toFixed(2)} us`;
  }

  return `${(ms * 1_000_000).toFixed(2)} ns`;
}

function formatDelta(current, previous) {
  if (previous === undefined) {
    return '';
  }

  const percent = ((current - previous) / previous) * 100;

  if (Math.abs(percent) < NOISE_FLOOR_PERCENT) {
    return paint('same', 'dim');
  }

  // Throughput, so a higher number is the faster one.
  const sign = percent > 0 ? '+' : '';
  return paint(`${sign}${percent.toFixed(1)}%`, percent > 0 ? 'green' : 'red');
}

// tinybench's own saturation criteria, in plain words.
const SATURATION_NOTES = {
  'zero-mad': 'at timer resolution',
  'zero-dominated': 'faster than the clock',
  'low-distinct': 'too few distinct timings',
};

function matches(filter, suiteName, benchName) {
  if (!filter) {
    return true;
  }

  const needle = filter.toLowerCase();
  return `${suiteName} ${benchName}`.toLowerCase().includes(needle);
}

/**
 * Run every registered suite and print a table per suite.
 *
 * @returns the results, keyed `suite > bench`, for baseline comparison.
 */
export async function runSuites({ filter, time = 500, baseline = {} } = {}) {
  const results = {};

  for (const group of suites) {
    const selected = group.benches.filter((entry) => matches(filter, group.name, entry.name));

    if (selected.length === 0) {
      continue;
    }

    const runner = new Bench({ name: group.name, time, warmupTime: Math.min(100, time) });

    // tinybench decides for itself when a task ran faster than the clock can
    // resolve; listening beats re-deriving the criteria here.
    const saturated = new Map();
    runner.addEventListener('warning', (event) => {
      if (event.task && event.reason) {
        saturated.set(event.task.name, event.reason);
      }
    });

    for (const entry of selected) {
      if (!entry.setup) {
        runner.add(entry.name, () => entry.fn());
        continue;
      }

      // Rebuilt per iteration through tinybench's untimed beforeEach hook, so
      // a benchmark that consumes its fixture still measures the real work on
      // every pass.
      let fixture;
      runner.add(entry.name, () => entry.fn(fixture), {
        beforeEach() {
          fixture = entry.setup();
        },
      });
    }

    process.stdout.write(`\n${paint(group.name, 'bold')}\n`);

    // eslint-disable-next-line no-await-in-loop
    await runner.run();

    const width = Math.max(...selected.map((entry) => entry.name.length));

    for (const task of runner.tasks) {
      const { latency, throughput } = task.result;
      const key = `${group.name} > ${task.name}`;

      results[key] = { hz: throughput.mean, mean: latency.mean, rme: latency.rme };

      const notes = [];
      const reason = saturated.get(task.name);

      if (reason) {
        notes.push(paint(SATURATION_NOTES[reason] ?? reason, 'yellow'));
      }
      if (latency.rme > UNSTABLE_RME_PERCENT) {
        notes.push(paint('unstable', 'yellow'));
      }

      process.stdout.write([
        `  ${task.name.padEnd(width)}`,
        formatOps(throughput.mean).padStart(18),
        paint(`+-${latency.rme.toFixed(1)}%`.padStart(8), 'dim'),
        formatDuration(latency.mean).padStart(12),
        paint(`${latency.samplesCount.toLocaleString('en-US')} runs`.padStart(14), 'dim'),
        formatDelta(throughput.mean, baseline[key]?.hz).padStart(8),
        notes.length > 0 ? `  ${notes.join(' ')}` : '',
      ].join('  ').trimEnd());
      process.stdout.write('\n');
    }
  }

  return results;
}
