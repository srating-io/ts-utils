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

export class Kontororu extends EventTarget {
  constructor() {
    super();
    this.listeners = {};
  }

  private listeners: {
    [type: string]: Array<(...args: unknown[]) => void>;
  };

  addEventListener(type: string, listener: (...args: unknown[]) => void) {
    super.addEventListener(type, listener);

    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  }

  removeEventListener(type: string, listener: (...args: unknown[]) => void) {
    super.removeEventListener(type, listener);

    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter((l) => l !== listener);
    }
  }

  removeAllEventListeners() {
    for (const type in this.listeners) {
      for (let i = 0; i <= this.listeners[type].length; i++) {
        this.removeEventListener(type, this.listeners[type][i]);
      }
    }
  }

  getListeners(type: string) {
    return this.listeners[type] || [];
  }
}


