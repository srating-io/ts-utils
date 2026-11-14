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

import { Style } from './Style.js';

/**
 * One request's share of the rules the server generated.
 *
 * `Style` is a process-wide singleton and a server renders many requests through it at once, so
 * a request cannot be handed exactly its own rules. It can be handed everything requested after
 * it started, which is a superset: a concurrent request's rules ride along, and nothing this one
 * rendered can be missed. Create it at the top of the tree, before anything renders, and `flush`
 * on every streamed chunk.
 */
export class ServerStyleSheet {
  private since = Style.mark();

  private emitted: Set<string> = new Set();

  /** The rules not yet shipped to this request, or null when there are none. */
  public flush(): { classNames: string[]; css: string } | null {
    const classNames: string[] = [];
    const rules: string[] = [];

    // CONSIDER(style): this walks every class the process has seen; an ordered log would be O(new)
    for (const [className, css] of Style.touchedSince(this.since)) {
      if (this.emitted.has(className)) {
        continue;
      }
      this.emitted.add(className);
      classNames.push(className);
      rules.push(css);
    }

    if (!classNames.length) {
      return null;
    }

    return { classNames, css: rules.join('\n') };
  }
}
