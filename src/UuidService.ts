/* eslint-disable no-bitwise */
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
 * Generate UUIDv7
 */
class UuidService {
  private lastTimestamp = -1;
  private seqCounter = 0;

  private getRandomBytes(size: number): Uint8Array {
    if (typeof globalThis.crypto?.getRandomValues === 'function') {
      const bytes = new Uint8Array(size);
      globalThis.crypto.getRandomValues(bytes);
      return bytes;
    }

    throw new Error('Secure crypto functionality is not available in this environment.');
  }

  public generateUUIDv7Bytes(): Uint8Array {
    let now = Date.now();

    if (now === this.lastTimestamp) {
      this.seqCounter++;

      // 12-bit counter overflow (> 4095 IDs in 1ms): advance timestamp artificially
      if (this.seqCounter > 0x0fff) {
        this.lastTimestamp++;
        now = this.lastTimestamp;
        this.seqCounter = 0;
      }
    } else if (now < this.lastTimestamp) {
      // Clock drift / NTP rollback: hold timestamp and increment counter to maintain monotonicity
      this.seqCounter++;
      if (this.seqCounter > 0x0fff) {
        this.lastTimestamp++;
        this.seqCounter = 0;
      }
      now = this.lastTimestamp;
    } else {
      // New millisecond: update state and reset sequence counter
      this.lastTimestamp = now;
      this.seqCounter = 0;
    }

    // Allocate 16 random bytes for remaining entropy (rand_b)
    const buf = this.getRandomBytes(16);

    // 1. Write 48-bit Unix timestamp into bytes 0..5
    buf[0] = Math.floor(now / 0x10000000000) & 0xff;
    buf[1] = Math.floor(now / 0x100000000) & 0xff;
    buf[2] = (now >>> 24) & 0xff;
    buf[3] = (now >>> 16) & 0xff;
    buf[4] = (now >>> 8) & 0xff;
    buf[5] = now & 0xff;

    // 2. Byte 6: Version 7 (0x70) + upper 4 bits of 12-bit counter
    buf[6] = 0x70 | ((this.seqCounter >> 8) & 0x0f);

    // 3. Byte 7: Lower 8 bits of 12-bit counter
    buf[7] = this.seqCounter & 0xff;

    // 4. Byte 8: Set Variant RFC 4122 (0x80) on remaining random bits
    buf[8] = (buf[8] & 0x3f) | 0x80;

    return buf;
  }

  /**
   * Convert a UUID string to binary Uint8Array
   */
  public static uuidToBin(uuid: string): Uint8Array {
    const hex = uuid.replaceAll('-', '');

    if (!/^[0-9a-fA-F]{32}$/.test(hex)) {
      throw new Error(`Invalid UUID: ${uuid}`);
    }

    const bytes = new Uint8Array(16);

    for (let i = 0; i < 16; i++) {
      bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }

    return bytes;
  }

  /**
   * Convert binary Uint8Array/Buffer to formatted UUID string
   */
  public static binToUuid(buffer: Uint8Array): string {
    if (buffer.length !== 16) {
      throw new Error('UUID buffer must contain exactly 16 bytes.');
    }
    let hex = '';
    for (let i = 0; i < buffer.length; i++) {
      hex += buffer[i].toString(16).padStart(2, '0');
    }

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
}
// export as a singleton
export const uuidService = new UuidService();
