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

import fs from 'fs';
import path from 'path';

/**
 * Line endings are a checkout artifact, not content. Comparing normalized
 * avoids rewriting a whole generated file on a machine where git checked it
 * out as CRLF.
 */
function sameContent(a, b) {
  return a.replace(/\r\n/g, '\n') === b.replace(/\r\n/g, '\n');
}

/**
 * Write `content` to `filePath`, but only when it differs from what is already
 * there, and never by truncating the target in place.
 *
 * Generated files are rewritten on every build, which makes them the files most
 * likely to be open in an editor, indexed, or watched by a sync agent. On
 * Windows those holders can refuse an O_CREAT|O_TRUNC open ('w') while still
 * permitting a rename over the path, so the write goes to a sibling temp file
 * and is moved into place. The move is atomic, so a crash mid-write cannot
 * leave a half-generated file behind either.
 *
 * @returns whether anything was written.
 */
export function writeIfChanged(filePath, content) {
  const resolved = path.resolve(filePath);

  if (fs.existsSync(resolved)) {
    try {
      if (sameContent(fs.readFileSync(resolved, 'utf8'), content)) {
        return false;
      }
    } catch {
      // Unreadable is not a reason to skip: fall through and rewrite it.
    }
  }

  const directory = path.dirname(resolved);
  // Same directory, so the rename stays on one volume and is a true move.
  // The pid keeps concurrent builds from colliding on the temp name.
  const temporary = path.join(directory, `.${path.basename(resolved)}.${process.pid}.tmp`);

  fs.mkdirSync(directory, { recursive: true });

  try {
    fs.writeFileSync(temporary, content);
    fs.renameSync(temporary, resolved);
  } catch (error) {
    try {
      fs.rmSync(temporary, { force: true });
    } catch {
      // Best effort: the original failure is the one worth reporting.
    }

    throw new Error(`Could not write ${filePath}: ${error.message}`, { cause: error });
  }

  return true;
}
