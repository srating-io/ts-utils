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

/**
 * Everything to help with CSV generation
 */
export class CSV {
  /**
   * Escape a single value for CSV.
   *
   * RFC 4180 escapes an embedded quote by doubling it, so JSON.stringify()
   * (which uses a backslash) cannot be used here.
   */
  private static escape(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    const str = String(value);

    if (/[",\r\n]/.test(str)) {
      return `"${str.replaceAll('"', '""')}"`;
    }

    return str;
  }

  /**
   * Convert an object of rows into a CSV string.
   *
   * Headers are the union of every row's keys, so rows that carry extra
   * columns are not silently truncated to the shape of the first row.
   */
  public static stringify(data: Record<string, Record<string, unknown>>): string {
    const headers: string[] = [];
    const seen = new Set<string>();

    for (const id in data) {
      Object.keys(data[id] ?? {}).forEach((key) => {
        if (!seen.has(key)) {
          seen.add(key);
          headers.push(key);
        }
      });
    }

    if (headers.length === 0) {
      return '';
    }

    const rows: string[] = [headers.map((header) => CSV.escape(header)).join(',')];

    for (const id in data) {
      const row = data[id] ?? {};
      // escape() handles the empty cases itself, so no `||` default here:
      // 0, false and '' are real values and have to survive as written.
      rows.push(headers.map((header) => CSV.escape(row[header])).join(','));
    }

    return rows.join('\n');
  }

  /**
   * Convert an object to a CSV file and then download it
   */
  public static download(data: Record<string, Record<string, unknown>>): void {
    const content = CSV.stringify(data);

    // Create a Blob and trigger download
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'srating-data.csv';

    // Trigger download and clean up
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  }
}
