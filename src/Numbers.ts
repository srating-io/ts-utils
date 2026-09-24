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

import { Arithmetic } from './Arithmetic.js';

// Constructing an Intl formatter costs orders of magnitude more than using one,
// and these methods are called per row when rendering a table.
const FORMATTERS = new Map<string, Intl.NumberFormat>();

const MAGNITUDES: readonly (readonly [number, string])[] = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'K'],
];

const DURATIONS: readonly (readonly [number, string])[] = [
  [86_400_000, 'd'],
  [3_600_000, 'h'],
  [60_000, 'm'],
  [1_000, 's'],
  [1, 'ms'],
];

const BYTE_UNITS: readonly string[] = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

/**
 * Human-readable number formatting: ranks, compact counts, percentages,
 * durations, and file sizes.
 */
export class Numbers {
  /**
   * The English ordinal suffix for a number: 'st', 'nd', 'rd', or 'th'.
   *
   * @example
   * Numbers.ordinalSuffix(1);  // 'st'
   * Numbers.ordinalSuffix(12); // 'th'
   */
  public static ordinalSuffix(value: number): string {
    const absolute = Math.abs(Math.trunc(value));

    // 11th, 12th and 13th break the 1st/2nd/3rd pattern.
    if (absolute % 100 >= 11 && absolute % 100 <= 13) {
      return 'th';
    }

    switch (absolute % 10) {
      case 1: {
        return 'st';
      }
      case 2: {
        return 'nd';
      }
      case 3: {
        return 'rd';
      }
      default: {
        return 'th';
      }
    }
  }

  /**
   * A number with its ordinal suffix attached.
   *
   * @example
   * Numbers.formatOrdinal(3); // '3rd'
   */
  public static formatOrdinal(value: number): string {
    const whole = Math.trunc(value);

    return `${whole}${Numbers.ordinalSuffix(whole)}`;
  }

  /**
   * A number with locale grouping separators.
   *
   * @example
   * Numbers.format(1234567.891, 2); // '1,234,567.89'
   */
  public static format(value: number, decimals?: number, locale: string = 'en-US'): string {
    if (!Number.isFinite(value)) {
      return String(value);
    }

    const maximumFractionDigits = decimals ?? 20;
    const key = `${locale}|${decimals ?? ''}|${maximumFractionDigits}`;

    let formatter = FORMATTERS.get(key);

    if (!formatter) {
      formatter = new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits,
      });
      FORMATTERS.set(key, formatter);
    }

    return formatter.format(value);
  }

  /**
   * A signed number, always carrying an explicit '+' or '-'.
   *
   * Useful for deltas such as a change in rank or rating.
   *
   * @example
   * Numbers.formatSigned(3);  // '+3'
   * Numbers.formatSigned(0);  // '0'
   */
  public static formatSigned(value: number, decimals?: number): string {
    if (value > 0) {
      return `+${Numbers.format(value, decimals)}`;
    }

    return Numbers.format(value, decimals);
  }

  /**
   * A large number shortened with a magnitude suffix.
   *
   * Implemented directly rather than through Intl's compact notation, whose
   * exact output varies with the runtime's ICU data.
   *
   * @example
   * Numbers.formatCompact(1234);      // '1.2K'
   * Numbers.formatCompact(1500000);   // '1.5M'
   */
  public static formatCompact(value: number, decimals: number = 1): string {
    if (!Number.isFinite(value)) {
      return String(value);
    }

    const absolute = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    const unit = MAGNITUDES.find(([threshold]) => absolute >= threshold);

    if (!unit) {
      return `${Arithmetic.round(value, decimals)}`;
    }

    const [threshold, suffix] = unit;
    // Trim a trailing '.0' so whole magnitudes read as '2M', not '2.0M'.
    const scaled = Arithmetic.round(absolute / threshold, decimals);

    return `${sign}${scaled}${suffix}`;
  }

  /**
   * A ratio rendered as a percentage.
   *
   * @param fromRatio When true (the default) the input is a 0..1 ratio;
   *   when false it is already a percentage.
   *
   * @example
   * Numbers.formatPercent(0.1234);        // '12.3%'
   * Numbers.formatPercent(12.34, 1, false); // '12.3%'
   */
  public static formatPercent(
    value: number,
    decimals: number = 1,
    fromRatio: boolean = true,
  ): string {
    if (!Number.isFinite(value)) {
      return String(value);
    }

    const percent = fromRatio ? value * 100 : value;

    return `${Numbers.format(Arithmetic.round(percent, decimals), decimals)}%`;
  }

  /**
   * A duration in milliseconds as a compact human string.
   *
   * @param parts How many magnitude units to show, largest first.
   *
   * @example
   * Numbers.formatDuration(3_725_000);    // '1h 2m'
   * Numbers.formatDuration(3_725_000, 3); // '1h 2m 5s'
   */
  public static formatDuration(ms: number, parts: number = 2): string {
    if (!Number.isFinite(ms)) {
      return String(ms);
    }

    const sign = ms < 0 ? '-' : '';
    let remaining = Math.abs(Math.trunc(ms));

    const pieces: [number, string][] = [];
    let started = false;

    for (let i = 0; i < DURATIONS.length; i++) {
      const [size, suffix] = DURATIONS[i];
      const amount = Math.floor(remaining / size);

      if (amount > 0) {
        started = true;
      }

      // Skip leading zero units, but keep interior ones (1h 0m 5s).
      if (started) {
        pieces.push([amount, suffix]);
        remaining -= amount * size;
      }
    }

    if (pieces.length === 0) {
      return '0ms';
    }

    const selected = pieces.slice(0, Math.max(1, parts));

    // Trailing zero units carry no information ('5s', not '5s 0ms'), unlike
    // the interior ones kept above.
    while (selected.length > 1 && selected[selected.length - 1][0] === 0) {
      selected.pop();
    }

    return `${sign}${selected.map(([amount, suffix]) => `${amount}${suffix}`).join(' ')}`;
  }

  /**
   * A byte count as a human-readable file size, using binary (1024) steps.
   *
   * @example
   * Numbers.formatBytes(1536); // '1.5 KB'
   */
  public static formatBytes(bytes: number, decimals: number = 1): string {
    if (!Number.isFinite(bytes)) {
      return String(bytes);
    }

    const absolute = Math.abs(bytes);
    const sign = bytes < 0 ? '-' : '';

    if (absolute < 1024) {
      return `${sign}${Math.trunc(absolute)} B`;
    }

    // Index of the largest unit that leaves a value of at least 1.
    const exponent = Math.min(
      Math.floor(Math.log(absolute) / Math.log(1024)),
      BYTE_UNITS.length - 1,
    );

    const scaled = Arithmetic.round(absolute / 1024 ** exponent, decimals);

    return `${sign}${scaled} ${BYTE_UNITS[exponent]}`;
  }
}
