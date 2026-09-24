import { writeIfChanged } from './write-if-changed.js';

const zones = Intl.supportedValuesOf('timeZone');
const typeContent = `export type IANATimeZone =\n  | '${zones.join("'\n  | '")}';\n`;

const wrote = writeIfChanged('./src/Timezones.ts', typeContent);

console.log(
  wrote
    ? `✅ timezones.ts generated successfully! (${zones.length} zones)`
    : `✅ timezones.ts already up to date (${zones.length} zones)`,
);
