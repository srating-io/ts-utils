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

// Handles toast components throughout the app

export interface ToastItem {
  id: number;
  message: string;
  type: string;
  exiting?: boolean;
}

// Define the shape of the listener function
export type ToastListener = (toasts: ToastItem[]) => void;

export class Toaster {
  private listeners: ToastListener[] = [];

  private toasts: ToastItem[] = [];

  // Monotonic counter. Date.now() collides when two toasts are added inside
  // the same millisecond, which makes remove()/requestClose() affect every
  // toast that shares the timestamp.
  private nextId = 0;

  // How long the UI has to play its exit animation before the toast is
  // dropped from the list.
  public static readonly EXIT_ANIMATION_MS = 500;

  // How long a toast stays up before it starts exiting.
  public static readonly AUTO_DISMISS_MS = 4000;

  /**
   * The current toasts.
   *
   * Returns a copy, so callers cannot mutate the internal list.
   */
  getToasts(): ToastItem[] {
    return [...this.toasts];
  }

  // React component will subscribe to this
  subscribe(listener: ToastListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify(): void {
    this.listeners.forEach((listener) => listener(this.toasts));
  }

  /**
   * Start a toast's exit: flag it so the UI can animate, then drop it once the
   * animation has had time to play.
   *
   * Calling this twice for the same toast does not schedule a second removal.
   */
  requestClose(id: number): void {
    const target = this.toasts.find((t) => t.id === id);

    if (!target || target.exiting) {
      return;
    }

    this.toasts = this.toasts.map((t) => {
      if (t.id === id) {
        return { ...t, exiting: true };
      }
      return t;
    });
    this.notify();

    // Safety net, not the primary path. A UI normally removes the toast itself
    // when its exit animation ends, which is sooner than this. That callback
    // can fail to arrive though -- a backgrounded tab, an unmount mid-animation,
    // reduced-motion settings -- and nothing else would ever drop the toast.
    // remove() is silent when the consumer already handled it.
    setTimeout(() => {
      this.remove(id);
    }, Toaster.EXIT_ANIMATION_MS);
  }

  /**
   * Add a toast and return its id, so callers can dismiss it early.
   */
  add(message: string, type = 'info'): number {
    this.nextId += 1;
    const id = this.nextId;
    this.toasts = [...this.toasts, { id, message, type }];
    this.notify();

    // Auto-remove
    setTimeout(() => {
      this.requestClose(id);
    }, Toaster.AUTO_DISMISS_MS);

    return id;
  }

  /**
   * Remove a toast immediately, without waiting for an exit animation.
   *
   * Removing an id that is not present is silent: it broadcasts nothing, so a
   * consumer that has already removed the toast itself does not get a
   * redundant re-render from the safety-net removal in `requestClose`.
   */
  remove(id: number): void {
    const remaining = this.toasts.filter((t) => t.id !== id);

    if (remaining.length === this.toasts.length) {
      return;
    }

    this.toasts = remaining;
    this.notify();
  }
}

export const toaster: Toaster = new Toaster();

export const toast: {
  info: (msg: string) => void;
  error: (msg: string) => void;
  success: (msg: string) => void;
} = {
  info: (msg: string) => toaster.add(msg, 'info'),
  error: (msg: string) => toaster.add(msg, 'error'),
  success: (msg: string) => toaster.add(msg, 'success'),
};
