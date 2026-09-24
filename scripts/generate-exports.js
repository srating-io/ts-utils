import fs from 'fs';
import path from 'path';

import { writeIfChanged } from './write-if-changed.js';

// This file writes the index.ts for me, so I dont have to manually update it
// This script will run during the prebuild step

const srcDir = './src';
const indexFile = path.join(srcDir, 'index.ts');

function getFiles(dir, allFiles = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, allFiles);
    } else if (file.endsWith('.ts') && file !== 'index.ts' && !file.startsWith('_')) {
      // Convert OS-specific paths to web-friendly relative imports
      const relativePath = path.relative(srcDir, filePath)
        .split(path.sep).join('/')
        .replace('.ts', '.js');

      allFiles.push(`export * from './${relativePath}';`);
    }
  });

  return allFiles;
}

const exports = getFiles(srcDir);
const wrote = writeIfChanged(indexFile, `// Auto-generated barrel file\n\n${exports.join('\n')}\n`);

console.log(
  wrote
    ? `Exported ${exports.length} modules to index.ts`
    : `index.ts already lists all ${exports.length} modules`,
);
