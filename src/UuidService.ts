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

import crypto from 'node:crypto';

/**
 * Generate UUIDv7
 */
class UuidService {
  private lastTimestamp = -1;
  private seqCounter = 0;

  public generateUUIDv7Buffer(): Buffer {
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
    const buf = crypto.randomBytes(16);

    // 1. Write 48-bit Unix timestamp into bytes 0..5
    buf.writeUIntBE(Math.floor(now / 0x100000000), 0, 2);
    buf.writeUIntBE(now % 0x100000000, 2, 4);

    // 2. Byte 6: Version 7 (0x70) + upper 4 bits of 12-bit counter
    buf[6] = 0x70 | ((this.seqCounter >> 8) & 0x0f);

    // 3. Byte 7: Lower 8 bits of 12-bit counter
    buf[7] = this.seqCounter & 0xff;

    // 4. Byte 8: Set Variant RFC 4122 (0x80) on remaining random bits
    buf[8] = (buf[8] & 0x3f) | 0x80;

    return buf;
  }

  /**
   * Convert a UUID to binary Buffer
   */
  public static uuidToBin(uuid: string): Buffer {
    return Buffer.from(uuid.replaceAll('-', ''), 'hex');
  }

  /**
   * Convert binary Buffer to UUID
   */
  public static binToUuid(buffer: Buffer): string {
    const hex = buffer.toString('hex');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
}
// export as a singleton
export const uuidService = new UuidService();
