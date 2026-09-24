# ts-utils

A modular collection of TypeScript utilities for modern web development.

* Data transformation & CSV generation
* CSS-in-JS styling & Material Design shadows
* Comprehensive color manipulation
* Robust date parsing and formatting
* Object deep cloning and merging
* Event handling systems
* Array shuffling and combinations

# Table of Contents

* [Installation](#installation)
* [Modules](#modules)
* [Arithmetic](#arithmetic)
* [Arrayifier](#arrayifier)
* [Color](#color)
* [CSV](#csv)
* [Dates](#dates)
* [Kontororu (Events)](#kontororu-events)
* [Numbers](#numbers)
* [Objector](#objector)
* [Sorter](#sorter)
* [Style](#style)
* [Tasker](#tasker)
* [Textor](#textor)
* [Theme](#theme)
* [Toaster](#toaster)
* [UuidService](#uuidservice)


* [Testing](#testing)
  * [Benchmarks](#benchmarks)
* [License](#license)

---

# Installation

```bash
npm install @esmalley/ts-utils
# or
yarn add @esmalley/ts-utils

```

---

# Modules

## Arithmetic

Math helpers for bounding and calculation.

### `clamp(number, min, max)`

Restricts a given number to be within the specified minimum and maximum range.

* **Example 1: Restricting UI Scroll**
Ensure a scroll position never goes out of bounds.
```ts
import { Arithmetic } from '@esmalley/ts-utils';

const rawScroll = -50;
const boundedScroll = Arithmetic.clamp(rawScroll, 0, 500);
console.log(boundedScroll); // Output: 0

```


* **Example 2: Normalizing Health Points**
Prevent health from exceeding maximum or falling below zero.
```ts
const currentHealth = 120;
const actualHealth = Arithmetic.clamp(currentHealth, 0, 100);
console.log(actualHealth); // Output: 100

```


### `lerp(a, b, amount)`

Linearly interpolates between two numbers. `amount` is clamped to 0–1, so the result never overshoots.

```ts
Arithmetic.lerp(0, 100, 0.25); // 25
```

### `round(value, precision?)`

Rounds to a fixed number of decimal places, handling the half-way cases that naive scaling gets wrong. A negative precision rounds to tens, hundreds, and so on.

```ts
Arithmetic.round(1.005, 2); // 1.01  (not 1 as with Math.round(v * 100) / 100)
Arithmetic.round(1234, -2); // 1200
```

### `mapRange(value, inMin, inMax, outMin, outMax)` / `normalize(value, min, max)`

Re-maps a number from one range onto another. `normalize` is the special case that maps onto 0–1, and is the inverse of `lerp`.

```ts
// A 1000-2000 rating expressed as a 0-100 score
Arithmetic.mapRange(1500, 1000, 2000, 0, 100); // 50
Arithmetic.normalize(1500, 1000, 2000);        // 0.5
```

### Descriptive statistics

`sum`, `mean`, `median`, `mode`, `variance`, `stdDev`, and `percentile`.

Aggregates over an empty list return `NaN` rather than `0`, so an empty data set is visibly empty instead of silently reading as a real zero. `variance` and `stdDev` are sample statistics (dividing by `n - 1`); pass `true` as the second argument for the population form.

```ts
const scores = [88, 72, 95, 64, 79];

Arithmetic.mean(scores);            // 79.6
Arithmetic.median(scores);          // 79
Arithmetic.stdDev(scores);          // 11.97...
Arithmetic.percentile(scores, 90);  // 92.2
Arithmetic.mode([1, 2, 2, 3]);      // [2]   (every tied value, in first-seen order)
```

---

## Arrayifier

Utilities for manipulating arrays and generating sets.

### `shuffle(array)`

Randomizes the order of elements in an array in-place using the Fisher-Yates algorithm.

* **Example 1: Shuffling a Deck**
```ts
import { Arrayifier } from '@esmalley/ts-utils';

const deck = ['Ace', 'King', 'Queen', 'Jack'];
Arrayifier.shuffle(deck);
console.log(deck); // e.g., ['Queen', 'Ace', 'Jack', 'King']

```



### `getCombinations(arr, r)`

Returns all possible combinations of a specific size `r` from an array.

* **Example 1: Tournament Matchups**
Get all unique pairs from a list of players.
```ts
const players = [1, 2, 3, 4];
const matchups = Arrayifier.getCombinations(players, 2);
// Output: [[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]]

```

A three-argument form, `getCombinations(arr, n, r)`, draws from only the first `n` elements.

### `groupBy(arr, keyFn)` / `countBy(arr, keyFn)`

Buckets or counts items by a derived key.

```ts
Arrayifier.groupBy(games, (g) => g.season);
// { 2025: [...], 2026: [...] }

Arrayifier.countBy(games, (g) => g.status);
// { final: 12, live: 3 }
```

### `chunk(arr, size)`

Splits an array into consecutive chunks of at most `size`.

```ts
Arrayifier.chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
```

### `unique(arr)` / `uniqueBy(arr, keyFn)`

Removes duplicates, keeping the first occurrence. `unique` compares by identity; `uniqueBy` compares a derived key, which is what you want for objects.

```ts
Arrayifier.unique([1, 2, 2, 3]);              // [1, 2, 3]
Arrayifier.uniqueBy(players, (p) => p.team_id);
```

### `sortBy(arr, keyFn, direction?)`

Sorts by a derived value without mutating the input. Numbers compare numerically, everything else as strings, and null/undefined keys sort last in both directions.

```ts
Arrayifier.sortBy(teams, (t) => t.rating, 'desc');
```

### `partition(arr, predicate)`

Splits into the items that satisfy the predicate and those that do not.

```ts
const [wins, losses] = Arrayifier.partition(games, (g) => g.won);
```

### `range(start, end?, step?)`

A sequence of numbers, excluding the end. With one argument, counts from 0.

```ts
Arrayifier.range(4);        // [0, 1, 2, 3]
Arrayifier.range(1, 4);     // [1, 2, 3]
Arrayifier.range(3, 0, -1); // [3, 2, 1]
```

---

## Color

Comprehensive suite for hex, RGB, and HSL manipulation.

### `lerpColor(a, b, amount)`

Linearly interpolates between two hexadecimal colors.

* **Example 1: Health Bar Gradient**
Get the color at the 50% mark between Red and Green.
```ts
import { Color } from '@esmalley/ts-utils';
const midPoint = Color.lerpColor('#ff0000', '#00ff00', 0.5);
console.log(midPoint); // Output: #7f7f00

```



### `getTextColor(color, backgroundColor)`

Determines a high-contrast text color based on the background color to ensure accessibility (WCAG compliance).

* **Example 1: Dynamic Label Styling**
```ts
const bg = '#000000'; // Black background
const text = Color.getTextColor('#333333', bg); 
console.log(text); // Output: #FFFFFF (returns white for better contrast)

```



### `darken(hex, amount)`

Darkens a hex color by a specified percentage (0 to 1).

* **Example 1: Button Hover State**
```ts
const primary = '#3498db';
const hover = Color.darken(primary, 0.2); // 20% darker

```



### `alphaColor(hex, alpha)`

Converts a hex color to an `rgba()` string with the provided transparency.

* **Example 1: Transparent Overlay**
```ts
const overlay = Color.alphaColor('#000000', 0.5);
console.log(overlay); // Output: rgba(0, 0, 0, 0.5)

```

### Conversions: `hexToRgb`, `rgbToHex`, `rgbToHsl`, `hslToRgb`

The full set of conversions is public, so you can move between representations in either direction. `hexToRgb` accepts shorthand (`#fff`) and throws on malformed input rather than silently reporting black. `rgbToHex` rounds and clamps its channels, so an out-of-range value cannot produce a malformed string.

```ts
Color.hexToRgb('#ff8000');     // [255, 128, 0]
Color.rgbToHex(255, 128, 0);   // '#FF8000'
Color.rgbToHsl(255, 0, 0);     // [0, 100, 50]   (hue 0-360, sat/lightness 0-100)
Color.hslToRgb(0, 100, 50);    // [255, 0, 0]

// Rotate a hue without leaving hex
const [h, s, l] = Color.rgbToHsl(...Color.hexToRgb('#3498db'));
const shifted = Color.rgbToHex(...Color.hslToRgb((h + 180) % 360, s, l));
```

---

## CSV

Utilities for data exportation.

### `stringify(data)`

Converts a nested object into an RFC 4180 CSV string. Headers are the union of every row's keys, so a row carrying extra columns is not truncated to the shape of the first one. Values containing a comma, quote or newline are quoted, and embedded quotes are doubled. `null` and `undefined` become empty cells, while `0`, `false` and `''` survive as written.

* **Example 1: Building a CSV in Memory**
```ts
import { CSV } from '@esmalley/ts-utils';

const csv = CSV.stringify({
  1: { team: 'Tigers', wins: 0, note: 'Rebuilding, "again"' },
  2: { team: 'Bears', wins: 12, streak: 3 },
});

// team,wins,note,streak
// Tigers,0,"Rebuilding, ""again""",
// Bears,12,,3

```



### `download(data)`

Takes a nested object and triggers a browser download of a generated `.csv` file.

* **Example 1: Exporting User Lists**
```ts
import { CSV } from '@esmalley/ts-utils';

const userData = {
  user_1: { name: 'Alice', email: 'alice@example.com' },
  user_2: { name: 'Bob', email: 'bob@example.com' }
};

CSV.download(userData); // Triggers download of 'srating-data.csv'

```



---

## Dates

Powerful date parsing, formatting, and arithmetic.

### `parse(input, utc?)`

A robust parser that handles ISO strings, US formats, timestamps, and mixed time strings (e.g., "5:00pm").

* **Example 1: Parsing US Format**
```ts
import { Dates } from '@esmalley/ts-utils';
const date = Dates.parse('01/25/2026 5:30 pm');

```



### `format(date, formatString)`

Formats a date using a variety of tokens (Y, y, m, n, F, M, d, j, D, l, H, h, G, g, i, s, a, A).

* **Example 1: Friendly Date String**
```ts
const now = new Date();
console.log(Dates.format(now, 'l, F jS, Y')); // Output: "Sunday, January 25th, 2026"

```



### `add(date, amount, unit)`

Adds a specific amount of time to a date (years, months, days, hours, minutes).

* **Example 1: Expiration Calculation**
```ts
const today = new Date();
const nextYear = Dates.add(today, 1, 'years');

```



### `isSameDay(date1, date2)`

Checks if two dates refer to the same calendar day, ignoring time.

* **Example 1: Calendar Highlighting**
```ts
const d1 = '2026-01-25 10:00';
const d2 = '2026-01-25 18:00';
console.log(Dates.isSameDay(d1, d2)); // true

```

### Period boundaries

`getStartOfDay` / `getEndOfDay`, `getStartOfMonth` / `getEndOfMonth`, and `getDaysInMonth`.

```ts
Dates.getEndOfDay('2026-03-15');    // 2026-03-15 23:59:59.999 local
Dates.getEndOfMonth('2026-02-10');  // 2026-02-28 23:59:59.999
Dates.getDaysInMonth('2024-02-01'); // 29
```

### `eachDayOfInterval(start, end)`

Every day from `start` to `end` inclusive, as local midnights. Steps by calendar day, so it stays correct across DST boundaries.

* **Example: Building a month grid**
Pair with `getStartOfGrid` / `getEndOfGrid` to get whole Sunday-to-Saturday weeks covering the month.
```ts
const cells = Dates.eachDayOfInterval(
  Dates.getStartOfGrid('2026-03-01'),
  Dates.getEndOfGrid('2026-03-01'),
);
// cells.length is always a multiple of 7
```

### `isBetween(date, start, end, inclusive?)`

Whether a date falls between two others. The bounds may be given in either order, and comparison is by exact instant — pair with `getStartOfDay` / `getEndOfDay` for a whole-day range.

```ts
Dates.isBetween('2026-03-05', '2026-03-01', '2026-03-10'); // true
```

---

## Tasker

Wrappers for controlling how and when other functions run.

### `debounce(fn, wait, leading?)`

Delays a function until it has stopped being called for `wait` ms. The returned function carries `cancel()`, `flush()`, and `pending()`.

* **Example: Search-as-you-type**
```ts
import { Tasker } from '@esmalley/ts-utils';

const search = Tasker.debounce((term: string) => runQuery(term), 300);

search('gon');
search('gonz');   // only this one runs, 300ms after the last keystroke
```

### `throttle(fn, wait)`

Allows a function to run at most once per `wait` ms. The first call runs immediately; a call made during the cooling-off period runs when it ends, carrying the most recent arguments.

```ts
window.addEventListener('scroll', Tasker.throttle(() => measure(), 100));
```

### `retry(fn, options?)`

Calls an async function until it succeeds, backing off between attempts. Rethrows the final error once attempts are exhausted.

```ts
const data = await Tasker.retry(() => fetchRatings(), {
  attempts: 5,
  delay: 500,
  onRetry: (error, attempt) => console.warn(`retry ${attempt}`, error),
});
```

### `backoff(attempt, options?)`

The delay before a given retry attempt, growing exponentially and capped at `maxDelay`. Pass `jitter` to randomize across `0..computed` and avoid a thundering herd.

```ts
Tasker.backoff(0); // 1000
Tasker.backoff(3); // 8000
```

### `memoize(fn, keyFn?)` / `once(fn)`

Caches results by arguments, or restricts a function to a single call. The memoized function carries `clear()` and `size()`.

```ts
const ratingFor = Tasker.memoize((teamId: number) => compute(teamId));
const init = Tasker.once(() => connect());
```

### `sleep(ms)`

Resolves after a delay.

```ts
await Tasker.sleep(250);
```

---

## Numbers

Human-readable number formatting.

### `formatOrdinal(n)` / `ordinalSuffix(n)`

A number with its English ordinal suffix, or just the suffix.

```ts
Numbers.formatOrdinal(1);  // '1st'
Numbers.formatOrdinal(23); // '23rd'
Numbers.ordinalSuffix(11); // 'th'
```

### `format(value, decimals?, locale?)` / `formatSigned(value, decimals?)`

Locale grouping separators, optionally with an explicit sign for deltas such as a change in rank.

```ts
Numbers.format(1234567);      // '1,234,567'
Numbers.format(1234.5, 2);    // '1,234.50'
Numbers.formatSigned(3);      // '+3'
```

### `formatCompact(value, decimals?)`

A large number shortened with a magnitude suffix. Implemented directly rather than through Intl's compact notation, whose exact output varies with the runtime's ICU data.

```ts
Numbers.formatCompact(1234);      // '1.2K'
Numbers.formatCompact(2_000_000); // '2M'
```

### `formatPercent(value, decimals?, fromRatio?)`

A ratio as a percentage. Pass `false` for `fromRatio` if the input is already scaled.

```ts
Numbers.formatPercent(0.1234); // '12.3%'
```

### `formatDuration(ms, parts?)` / `formatBytes(bytes, decimals?)`

```ts
Numbers.formatDuration(3_725_000);    // '1h 2m'
Numbers.formatDuration(3_725_000, 3); // '1h 2m 5s'
Numbers.formatBytes(1536);            // '1.5 KB'
```

---

## Objector

Utilities for deep object manipulation.

### `deepClone(obj)`

Creates a full, recursive copy of an object, including Maps, Sets, Dates, and RegEx.

* **Example 1: State Immutability**
```ts
import { Objector } from '@esmalley/ts-utils';
const state = { user: { id: 1 } };
const newState = Objector.deepClone(state);
newState.user.id = 2;
console.log(state.user.id); // 1 (unchanged)

```



### `extender(target, ...sources)`

Deeply merges multiple source objects into a target object.

* **Example 1: Configuration Merging**
```ts
const defaults = { theme: 'light', flags: { debug: false } };
const userConfig = { flags: { debug: true } };
Objector.extender(defaults, userConfig);
// defaults is now { theme: 'light', flags: { debug: true } }

```

### `deepEqual(a, b)`

Structurally compares two values — the counterpart to `deepClone`. Handles the same shapes (Date, RegExp, Map, Set, arrays, plain objects, symbol keys) and tolerates circular references.

`NaN` equals `NaN` and `+0` does not equal `-0`, matching `Object.is` rather than `===`. Objects must share a prototype to be considered equal.

* **Example 1: Change detection**
```ts
if (!Objector.deepEqual(previousFilters, nextFilters)) {
  refetch();
}

```

* **Example 2: Verifying a clone**
```ts
const copy = Objector.deepClone(state);
Objector.deepEqual(state, copy); // true
copy.user.id = 2;
Objector.deepEqual(state, copy); // false

```



---

## Sorter

Table and collection sorting helpers.

### `getComparator(order, orderBy)`

Returns a comparison function for use with `Array.sort()`.

* **Example 1: Sorting Table Data**
```ts
import { Sorter } from '@esmalley/ts-utils';
const rows = [{ val: 10 }, { val: 5 }, { val: 20 }];
const comparator = Sorter.getComparator('desc', 'val');
rows.sort(comparator); // [{ val: 20 }, { val: 10 }, { val: 5 }]

```



---

## Style

Utilities for dynamic CSS injection and style management.

### `getStyleClassName(css, debug?)`

Hashes a CSS object/string, generates a unique class name, and injects the style into the document head.

* **Example 1: Scoped Dynamic Styling**
```ts
import { Style } from '@esmalley/ts-utils';

const className = Style.getStyleClassName({
  backgroundColor: 'red',
  '&:hover': {
    backgroundColor: 'blue'
  },
  '@media (max-width: 600px)': {
    fontSize: 12
  }
});

// Returns a unique hash like 'css-1a2b3c' and injects the CSS.

```



### `getShadow(depth)`

Returns a Material Design elevation shadow string (0-24).

* **Example 1: Component Elevation**
```ts
const shadow = Style.getShadow(4);
// Returns: "0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14)..."

```


## Textor

String manipulation and linguistic utility functions.

### `toKebabCase(str)`

Converts camelCase or PascalCase to kebab-case. Used internally to turn CSS-in-JS property names into real CSS properties, but general purpose.

```ts
Textor.toKebabCase('backgroundColor'); // 'background-color'
```

### `levenshtein(a, b)`

Calculates the Levenshtein distance between two strings. This is a string metric for measuring the difference between two sequences (the minimum number of single-character edits required to change one word into the other).

* **Example 1: Search Suggestions / "Did you mean?"**
Determine how close a user's typo is to a correct keyword.
```ts
import { Textor } from '@esmalley/ts-utils';

const input = 'Gogle';
const target = 'Google';
const distance = Textor.levenshtein(input, target);

console.log(distance); // Output: 1
if (distance <= 2) {
  console.log(`Did you mean ${target}?`);
}

```


* **Example 2: Deduplicating Data**
Check if two strings are likely the same record with minor variations.
```ts
const user1 = "Johnathan Doe";
const user2 = "Jonathan Doe";
const diff = Textor.levenshtein(user1, user2);

// A distance of 1 suggests a very high similarity
const isLikelySame = diff < 3; 

```



### `toSentenceCase(str)`

Converts a string to sentence case by capitalizing the first letter of the first word and making the rest of the string lowercase. It also handles trimming whitespace.

* **Example 1: Formatting User-Generated Content**
Clean up a messy title submitted via a form.
```ts
const rawTitle = "  WELCOME TO THE DASHBOARD  ";
const cleanTitle = Textor.toSentenceCase(rawTitle);

console.log(cleanTitle); // Output: "Welcome to the dashboard"

```


* **Example 2: Normalizing Table Headers**
```ts
const keys = ["USER_NAME", "EMAIL_ADDRESS"];
const labels = keys.map(k => Textor.toSentenceCase(k.replace('_', ' ')));

console.log(labels); // Output: ["User name", "Email address"]

```



---

## Theme

A comprehensive Material Design-inspired theming engine providing light and dark modes with a full 50-900 color palette.

### `constructor(mode)`

Initializes the theme engine with either `'light'` or `'dark'`. Throws an error if an invalid mode is provided.

* **Example 1: Dynamic Theme Initialization**
```ts
import { Theme } from '@esmalley/ts-utils';

const userPreference = localStorage.getItem('theme') || 'light';
const themeEngine = new Theme(userPreference);

```



### `getTheme()`

Returns the full theme object (background, primary, secondary, warning, success, error, and text palettes) based on the mode selected in the constructor.

* **Example 1: Consuming Theme in a Style Object**
```ts
const myTheme = new Theme('dark').getTheme();

const headerStyle = {
  backgroundColor: myTheme.header.main,
  color: myTheme.text.primary,
  borderBottom: `1px solid ${myTheme.primary.main}`
};

```



### `getDarkTheme()` / `getLightTheme()`

Explicitly retrieves the configuration for a specific mode, regardless of the current instance state.

* **Example 1: Comparing Modes**
```ts
const theme = new Theme('light');
const dark = theme.getDarkTheme();
const light = theme.getLightTheme();

console.log(dark.background.main); // #121212
console.log(light.background.main); // #ffffff

```



---

## Toaster

A global state manager for UI notifications (Toasts). It supports subscriptions, auto-dismissal, and exit animations.

### `subscribe(listener)`

Allows a UI component (like a React or Vue component) to listen for changes to the toast list. Returns an unsubscribe function.

* **Example 1: Integrating with a Framework (React-like)**
```ts
import { toaster } from '@esmalley/ts-utils';

const unsubscribe = toaster.subscribe((newList) => {
  console.log("Toasts updated:", newList);
  this.setState({ toasts: newList });
});

// Later, clean up the listener
// unsubscribe();

```



### `add(message, type)`

Adds a new notification to the stack and returns its id, which `requestClose(id)` and `remove(id)` take. Defaults to `'info'` type. Automatically triggers a close request after `Toaster.AUTO_DISMISS_MS` (4 seconds); the exit phase then lasts `Toaster.EXIT_ANIMATION_MS` (500ms). Both are public constants, so a UI can drive its animation from the same numbers.

* **Example 1: Error Handling**
```ts
try {
  await api.save();
  toaster.add("Changes saved successfully!", "success");
} catch (e) {
  toaster.add("Failed to save changes. Please try again.", "error");
}

```


* **Example 2: Basic Notification**
```ts
toaster.add("You have a new message."); // Defaults to 'info'

// Hold on to the id to dismiss a toast before it auto-dismisses.
const id = toaster.add("Uploading...");
await upload();
toaster.remove(id);

```



### `requestClose(id)`

Starts the "exit" phase for a toast. It marks the toast as `exiting: true` so the UI can play a fade-out animation.

Your UI is expected to call `remove(id)` once that animation ends — that is the normal path, and it is what gets the toast off the list. As a safety net, the toast is also dropped 500ms later in case the animation callback never arrives (a backgrounded tab, an unmount mid-animation, reduced-motion settings). That late removal is silent when the UI already handled it, so it costs no extra render.

* **Example 1: Manual Dismiss Button**
```ts
// Inside your UI component's "X" button click handler
const handleClose = (toastId) => {
  toaster.requestClose(toastId);
};

```

* **Example 2: Removing when the animation ends**
```tsx
<div
  className={isExiting ? 'toast-fade-out' : 'toast-slide-up'}
  onAnimationEnd={() => {
    if (isExiting) {
      toaster.remove(toast.id);
    }
  }}
>

```



### `remove(id)`

Immediately removes a toast from the list without waiting for an animation or timeout. Removing an id that is not present is a no-op and notifies nobody.

* **Example 1: Force Clearing a specific alert**
```ts
toaster.remove(currentToastId);

```



### `getToasts()`

Returns the current array of active `ToastItem` objects.

* **Example 1: Checking Toast Count**
```ts
const activeToasts = toaster.getToasts();
if (activeToasts.length > 5) {
   console.log("The user is being flooded with notifications!");
}

```



---

## Kontororu (Events)

An EventTarget wrapper for managing custom listeners.

### `addEventListener(type, listener)`

Registers an event handler.

* **Example 1: Custom Socket Events**
```ts
import { Kontororu } from '@esmalley/ts-utils';
const bus = new Kontororu();
bus.addEventListener('data', (payload) => console.log(payload));

```

---

## UuidService

A singleton that generates UUIDv7 identifiers — time-ordered, so they sort chronologically and index well as a primary key.

### `generateUUIDv7Bytes()`

Returns the raw 16 bytes. Monotonic within a millisecond via a 12-bit counter, and holds steady if the wall clock jumps backwards.

```ts
import { uuidService } from '@esmalley/ts-utils';

const bytes = uuidService.generateUUIDv7Bytes();
const id = uuidService.binToUuid(bytes);
// '01997e4c-1f3a-7b21-9c04-5e6f70818293'
```

### `binToUuid(buffer)` / `uuidToBin(uuid)`

Converts between the 16-byte form and the canonical dashed string. Storing the binary form in a `BINARY(16)` column costs 16 bytes instead of 36.

```ts
const bin = uuidService.uuidToBin(id);
uuidService.binToUuid(bin) === id; // true
```

### `isValid(uuid)`

Whether a string is a well-formed UUID, dashed or bare.

```ts
uuidService.isValid(id);          // true
uuidService.isValid('not-a-id');  // false
```

---

# Testing

Unit tests run on Jest in ESM mode:

```bash
npm test                      # type-checks, then runs every suite
npm test -- Arithmetic        # one file
npm run typecheck             # tsc --noEmit on its own
```

`npm test` runs `typecheck` first via `pretest`. That matters because ts-jest is configured with `isolatedModules: true`, which makes it transpile tests without type-checking them — so Jest alone will happily run a test file full of type errors. `tsc --noEmit` covers `src`, `tests` and everything else the root `tsconfig.json` includes, while `npm run build` stays scoped to `src`.

## Benchmarks

Correctness is covered by Jest; execution time is covered by a separate benchmark suite built on [tinybench](https://github.com/tinylibs/tinybench). Benchmarks live in `bench/*.bench.js` and read like tests:

```js
import { Arithmetic } from '../dist/esm/index.js';
import { suite, bench } from './harness.js';

const ratings = Array.from({ length: 10_000 }, () => Math.random() * 2000);

suite('Arithmetic (10k values)', () => {
  bench('mean()', () => Arithmetic.mean(ratings));
  bench('median()', () => Arithmetic.median(ratings));
});
```

They import from `dist/esm`, not `src`, so they measure what consumers actually install. Build first:

```bash
npm run build
npm run bench                 # run everything
npm run bench -- Arithmetic   # filter by suite or bench name
npm run bench -- --time=1000  # sample each bench for 1000ms (default 500)
```

### Catching regressions

Record the current numbers, make a change, then re-run to see the difference:

```bash
npm run bench:save            # writes bench/baseline.json
# ...optimize something...
npm run bench                 # each row gains a delta column
```

```
Arithmetic (10k values)
  mean()         12,001 ops/s    +-0.9%    84.59 us    1,419 runs      same
  median()          471 ops/s    +-4.1%     2.17 ms       64 runs    +18.2%
```

Deltas are throughput, so a positive number is faster. Anything under 5% reports as `same`, because run-to-run noise on a working machine swamps it. The baseline is machine-specific and git-ignored — compare against your own hardware, never someone else's.

Two annotations flag numbers you should not trust:

* **`unstable`** — the margin of error exceeded 5%. Re-run with a longer `--time`, or close whatever else is busy.
* **`faster than the clock` / `at timer resolution`** — the work finished faster than the platform timer can resolve, so the figure is approximate. Benchmark a realistic batch instead of a single call.





