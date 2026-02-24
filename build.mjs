import * as esbuild from 'esbuild';
import { readFile } from 'fs/promises';

// 1. Read package.json to identify external dependencies
const pkg = JSON.parse(await readFile(new URL('./package.json', import.meta.url)));

// Mark all dependencies and peerDependencies as external
// so they aren't bundled into your library
const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

const sharedConfig = {
  entryPoints: ['src/index.ts'], // Adjust this to your entry point
  bundle: true,
  minify: true,
  sourcemap: true,
  external,
  target: 'es2020', // or your browserslist equivalent
};

async function build() {
  const start = performance.now();
  await Promise.all([
    // ESM Build
    esbuild.build({
      ...sharedConfig,
      format: 'esm',
      outfile: 'dist/esm/index.js',
    }),

    // CJS Build
    esbuild.build({
      ...sharedConfig,
      format: 'cjs',
      outfile: 'dist/cjs/index.js',
      // Optional: esbuild doesn't need the fix:cjs hack if you use .cjs extension,
      // but if you want to keep your folder structure, keep the package.json hack.
    }),
  ]);

  const stop = performance.now();

  /*
  "build": "rm -rf dist && npm run build:esm && npm run build:cjs && npm run fix:cjs",
    "build:esm": "tsc -p tsconfig.build.json",
    "build:cjs": "tsc -p tsconfig.build.cjs.json",
    "fix:cjs": "echo '{\"type\": \"commonjs\"}' > dist/cjs/package.json",
    */

  console.log(`Build complete - ${(stop - start) / 1000}s`);
}

build().catch(() => process.exit(1));
