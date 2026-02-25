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
* [Objector](#objector)
* [Sorter](#sorter)
* [Style](#style)
* [Textor](#textor)
* [Theme](#theme)
* [Toaster](#toaster)


* [Testing](#testing)
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



---

## CSV

Utilities for data exportation.

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



### Palette Accessors (e.g., `getGrey()`, `getAmber()`, etc.)

The class provides access to the standard Material Design color ramps.

* **Example 1: Using Specific Color Weights**
```ts
const theme = new Theme('light');
const greys = theme.getGrey();

const dividerStyle = {
  backgroundColor: greys[300] // Light grey for dividers
};

const secondaryText = {
  color: greys[600] // Medium grey for subtext
};

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

Adds a new notification to the stack. Defaults to `'info'` type. Automatically triggers a close request after 4 seconds.

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

```



### `requestClose(id)`

Starts the "exit" phase for a toast. It marks the toast as `exiting: true`, allowing the UI to play a fade-out animation before the toast is fully removed 500ms later.

* **Example 1: Manual Dismiss Button**
```ts
// Inside your UI component's "X" button click handler
const handleClose = (toastId) => {
  toaster.requestClose(toastId);
};

```



### `remove(id)`

Immediately removes a toast from the list without waiting for an animation or timeout.

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





