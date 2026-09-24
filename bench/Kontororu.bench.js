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

import { setMaxListeners } from 'node:events';

import { Kontororu } from '../dist/esm/index.js';
import { suite, bench } from './harness.js';

// Node's EventTarget warns past 10 listeners; these suites are about what
// happens well beyond that.
const pool = (n) => Array.from({ length: n }, (unused, i) => () => i);

const thousand = pool(1_000);
const tenThousand = pool(10_000);

function loaded(listeners) {
  const bus = new Kontororu();
  setMaxListeners(listeners.length + 10, bus);

  for (let i = 0; i < listeners.length; i++) {
    bus.addEventListener('tick', listeners[i]);
  }

  return bus;
}

suite('Kontororu (registration)', () => {
  bench('add 1k listeners', () => loaded(thousand));
  bench('add 10k listeners', () => loaded(tenThousand));
});

suite('Kontororu (teardown)', () => {
  // Registration is excluded from the timing: this measures removal alone,
  // which is where a per-listener scan of the whole type would show up.
  bench('removeAll from 1k', (bus) => bus.removeAllEventListeners(), {
    setup: () => loaded(thousand),
  });

  bench('removeAll from 10k', (bus) => bus.removeAllEventListeners(), {
    setup: () => loaded(tenThousand),
  });
});

suite('Kontororu (dispatch)', () => {
  const quiet = loaded([]);
  const busy = loaded(thousand);

  bench('dispatch, no listeners', () => quiet.dispatchEvent(new Event('tick')));
  bench('dispatch, 1k listeners', () => busy.dispatchEvent(new Event('tick')));
  bench('getListeners() of 1k', () => busy.getListeners('tick'));
});
