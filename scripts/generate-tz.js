import { writeFileSync } from 'fs';

const zones = Intl.supportedValuesOf('timeZone');
const typeContent = `export type IANATimeZone = \n  | '${zones.join("'\n  | '")}';\n`;

writeFileSync('./src/Timezones.ts', typeContent);
console.log('✅ timezones.ts generated successfully!');
