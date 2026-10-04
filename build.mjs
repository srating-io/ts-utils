import * as esbuild from 'esbuild';
import { readdirSync } from 'fs';
import path from 'path';

const srcDir = 'src';

// One output file per source file, rather than a single bundle. Tree-shaking in
// a consumer's bundler works at file granularity -- "nothing is imported from
// this file and it has no import-time side effects, so drop it" -- so
// concatenating the package into one module forces every consumer to carry the
// whole thing. See the sideEffects field in package.json.
function getEntryPoints(dir, entries = []) {
  for (const file of readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      getEntryPoints(filePath, entries);
    } else if (file.name.endsWith('.ts') && !file.name.endsWith('.d.ts')) {
      entries.push(filePath.split(path.sep).join('/'));
    }
  }

  return entries;
}

const entryPoints = getEntryPoints(srcDir);

const sharedConfig = {
  entryPoints,
  // Transpile in place: nothing is inlined, so the module graph a consumer
  // resolves is the one in src/, and no devDependency can be pulled in.
  bundle: false,
  outbase: srcDir,
  platform: 'neutral',
  sourcemap: true,
  // Published libraries ship readable code: the consumer's own minifier does a
  // better job with the whole program in view, and their stack traces survive.
  minify: false,
  target: 'es2022',
};

async function build() {
  const start = performance.now();

  await Promise.all([
    esbuild.build({
      ...sharedConfig,
      format: 'esm',
      outdir: 'dist/esm',
    }),

    esbuild.build({
      ...sharedConfig,
      format: 'cjs',
      outdir: 'dist/cjs',
    }),
  ]);

  const stop = performance.now();

  console.log(`Build complete - ${entryPoints.length} modules in ${((stop - start) / 1000).toFixed(2)}s`);
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
