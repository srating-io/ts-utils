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

  requestClose(id: number): void {
    this.toasts = this.toasts.map((t) => {
      if (t.id === id) {
        return { ...t, exiting: true };
      }
      return t;
    });
    this.notify();
  }

  add(message: string, type = 'info'): void {
    const id = Date.now();
    this.toasts = [...this.toasts, { id, message, type }];
    this.notify();

    // Auto-remove
    setTimeout(() => {
      this.requestClose(id);
    }, 4000);
  }

  remove(id: number): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
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
