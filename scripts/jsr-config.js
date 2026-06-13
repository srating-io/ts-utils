
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const jsr = join(import.meta.dirname, '../jsr.json');

writeFileSync(jsr, JSON.stringify({
  name: pkg.name,
  version: pkg.version,
  license: pkg.license,
  description: pkg.description,
  exports: './src/index.ts',
}, null, 2));
