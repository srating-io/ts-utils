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

// コントロール

type Listener = (...args: unknown[]) => void;

export class Kontororu extends EventTarget {
  /**
   * Set membership is what keeps registration, removal and teardown O(1) per
   * listener instead of a scan of everything registered for that type.
   *
   * A Map rather than an object literal because an event type is a
   * caller-supplied string: '__proto__' on an object literal resolves to the
   * prototype rather than to an entry of its own.
   */
  private listeners = new Map<string, Set<Listener>>();

  addEventListener(type: string, listener: Listener): this {
    super.addEventListener(type, listener);

    let registered = this.listeners.get(type);

    if (!registered) {
      registered = new Set();
      this.listeners.set(type, registered);
    }

    // EventTarget ignores a repeated (type, listener) pair, so the bookkeeping
    // must not record it twice either, or a single removeEventListener() would
    // leave a stale entry behind. A Set gives that without scanning.
    registered.add(listener);

    return this;
  }

  removeEventListener(type: string, listener: Listener): this {
    super.removeEventListener(type, listener);

    this.listeners.get(type)?.delete(listener);

    return this;
  }

  removeAllEventListeners() {
    // Removing entries from a Set mid-iteration is well defined -- an entry
    // deleted before it is reached is simply never visited -- so this walks
    // the live Set rather than a copy of it.
    this.listeners.forEach((registered, type) => {
      registered.forEach((listener) => {
        this.removeEventListener(type, listener);
      });
    });
  }

  getListeners(type: string): Listener[] {
    const registered = this.listeners.get(type);

    // A copy: the internal Set is the bookkeeping, and handing it out would let
    // a caller desynchronise it from the EventTarget underneath.
    return registered ? [...registered] : [];
  }
}


