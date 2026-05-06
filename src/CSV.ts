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
   * Convert an object to a CSV file and then download it
   */
  public static download(data: Record<string, Record<string, unknown>>): void {
    const rows: string[] = [];

    let setHeaders = false;
    let headers: string[] = [];
    for (const id in data) {
      const row = data[id];

      if (!setHeaders) {
        headers = Object.keys(row);
        rows.push(headers.join(','));
        setHeaders = true;
      }

      const values = headers.map((header) => JSON.stringify(row[header] || ''));
      rows.push(values.join(','));
    }

    const content = rows.join('\n');

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
