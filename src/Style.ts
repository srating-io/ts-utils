/* eslint-disable no-restricted-syntax */
/* eslint-disable no-bitwise */




type CSSMap = Map<string, string>;

/**
 * Class to get the style
 * Has base CSS functions
 */
export class Style {
  public static getStyle() {
    return {
      zIndex: Style.getZIndex(),
    };
  }

  public static getZIndex() {
    return {
      appBar: 1100,
      drawer: 1200,
      fab: 1050,
      calendar: 1000,
      mobileStepper: 1000,
      modal: 1300,
      toast: 1400,
      speedDial: 1050,
      tooltip: 1500,
    };
  }

  public static getNavBar() {
    return {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      zIndex: Style.getZIndex().appBar,
      position: 'fixed',
      overflowX: 'scroll',
      overflowY: 'hidden',
      scrollbarWidth: 'none',
    };
  }

  public static getShadow(depth: number): string {
    const shadows = [
      'none',
      '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
      '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
      '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
      '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
      '0px 3px 5px -1px rgba(0,0,0,0.2),0px 5px 8px 0px rgba(0,0,0,0.14),0px 1px 14px 0px rgba(0,0,0,0.12)',
      '0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)',
      '0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)',
      '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
      '0px 5px 6px -3px rgba(0,0,0,0.2),0px 9px 12px 1px rgba(0,0,0,0.14),0px 3px 16px 2px rgba(0,0,0,0.12)',
      '0px 6px 6px -3px rgba(0,0,0,0.2),0px 10px 14px 1px rgba(0,0,0,0.14),0px 4px 18px 3px rgba(0,0,0,0.12)',
      '0px 6px 7px -4px rgba(0,0,0,0.2),0px 11px 15px 1px rgba(0,0,0,0.14),0px 4px 20px 3px rgba(0,0,0,0.12)',
      '0px 7px 8px -4px rgba(0,0,0,0.2),0px 12px 17px 2px rgba(0,0,0,0.14),0px 5px 22px 4px rgba(0,0,0,0.12)',
      '0px 7px 8px -4px rgba(0,0,0,0.2),0px 13px 19px 2px rgba(0,0,0,0.14),0px 5px 24px 4px rgba(0,0,0,0.12)',
      '0px 7px 9px -4px rgba(0,0,0,0.2),0px 14px 21px 2px rgba(0,0,0,0.14),0px 5px 26px 4px rgba(0,0,0,0.12)',
      '0px 8px 9px -5px rgba(0,0,0,0.2),0px 15px 22px 2px rgba(0,0,0,0.14),0px 6px 28px 5px rgba(0,0,0,0.12)',
      '0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)',
      '0px 8px 11px -5px rgba(0,0,0,0.2),0px 17px 26px 2px rgba(0,0,0,0.14),0px 6px 32px 5px rgba(0,0,0,0.12)',
      '0px 9px 11px -5px rgba(0,0,0,0.2),0px 18px 28px 2px rgba(0,0,0,0.14),0px 7px 34px 6px rgba(0,0,0,0.12)',
      '0px 9px 12px -6px rgba(0,0,0,0.2),0px 19px 29px 2px rgba(0,0,0,0.14),0px 7px 36px 6px rgba(0,0,0,0.12)',
      '0px 10px 13px -6px rgba(0,0,0,0.2),0px 20px 31px 3px rgba(0,0,0,0.14),0px 8px 38px 7px rgba(0,0,0,0.12)',
      '0px 10px 13px -6px rgba(0,0,0,0.2),0px 21px 33px 3px rgba(0,0,0,0.14),0px 8px 40px 7px rgba(0,0,0,0.12)',
      '0px 10px 14px -6px rgba(0,0,0,0.2),0px 22px 35px 3px rgba(0,0,0,0.14),0px 8px 42px 7px rgba(0,0,0,0.12)',
      '0px 11px 14px -7px rgba(0,0,0,0.2),0px 23px 36px 3px rgba(0,0,0,0.14),0px 9px 44px 8px rgba(0,0,0,0.12)',
      '0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)',
    ];

    if (depth > shadows.length || depth < 0) {
      throw new Error(`min depth is 0, max depth is ${shadows.length}. Sent ${depth}`);
    }

    return shadows[depth];
  }

  /**
   *
   *
   *
   *
   * Below is all the CSS injection from js
   *
   *
   *
   */

  /**
   * Call this to add css as a style-sheet, so you can do css selectors like hover td {} etc
   */
  public static getStyleClassName(cssString: string | object, debug = false) {
    if (debug) {
      console.log('getStyleClassName', cssString);
    }
    // console.time('getStyleClassName')
    const className = `css-${this.hashCSS(cssString, debug)}`;

    this.injectStyle(className, cssString, debug);
    // console.timeEnd('getStyleClassName')
    return className;
  }

  public static getMap() {
    return this.cssMap;
  }

  // SSR helper to get all collected styles
  public static getCSS(): string {
    console.warn('this does not work yet, in root layout need to add a context thing so it attaches css to style when streamed from server');
    return Array.from(this.cssMap.values()).join('\n');
  }

  // Call after SSR render to clean up for next render
  public static flush(): void {
    this.styleCache.clear();
    this.cssMap.clear();
  }

  private static styleCache: Set<string> = new Set();

  private static cssMap: CSSMap = new Map(); // key: className, value: finalCSS

  private static hashCSS(css: string | object, debug = false) {
    const canonicalize = (obj: object | string | number): object | string | number => {
      if (typeof obj !== 'object' || obj === null) {
        // Return primitives as is
        return obj;
      }

      if (Array.isArray(obj)) {
        // Recursively canonicalize array elements
        return obj.map(canonicalize);
      }

      // 1. Get and sort the keys of the current object level
      const sortedKeys = Object.keys(obj).sort();
      const canonical: { [key: string]: unknown } = {};

      // cast object to record
      const sourceObj = obj as Record<string, string | number>;

      // 2. Build a new object using the sorted keys, and recursively process values
      for (const key of sortedKeys) {
        canonical[key] = canonicalize(sourceObj[key]);
      }

      return canonical;
    };

    const normalize = (val: string | object): string => {
      if (typeof val === 'string') {
        return val;
      }
      if (typeof val === 'object' && val !== null) {
        const canonicalObject = canonicalize(val);
        // Step B: Stringify the canonical object without a replacer
        return JSON.stringify(canonicalObject);
      }
      return String(val);
    };

    const normalizedInput = normalize(css);

    if (debug) {
      console.log('normalizedInput', normalizedInput);
    }

    // Example hash using a simple DJB2 hash (or use a stronger hash like SHA-1/MD5 if needed)
    let hash = 5381;
    for (let i = 0; i < normalizedInput.length; i++) {
      hash = (hash * 33) ^ normalizedInput.charCodeAt(i);
    }
    return (hash >>> 0).toString(36); // base36 for short string
  }

  private static injectStyle(className: string, css: string | object, debug = false): void {
    if (
      this.styleCache.has(className)
    ) {
      return;
    }

    const finalCSS = this.processCSS(className, css, false, debug);

    // If on server, store it only
    if (typeof window === 'undefined') {
      this.cssMap.set(className, finalCSS);
    } else {
      const styleEl = document.createElement('style');
      styleEl.textContent = finalCSS;
      document.head.appendChild(styleEl);
    }

    this.styleCache.add(className);
    this.cssMap.set(className, finalCSS);
  }

  private static processCSS(className: string, css: string | object, isRecursive = false, debug = false): string {
    // Helper: remove trailing colon from selectors (e.g. 'td:' -> 'td')
    const cleanSelector = (sel:string): string => {
      return sel.replace(/:$/g, '');
    };

    // Convert camelCase to kebab-case for property names
    const toKebabCase = (str: string): string => {
      return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    };

    // Helper: Remove the specific '}' that closed the block from the accumulated lines
    // so we don't duplicate it when wrapping the result in new braces.
    const removeLastBrace = (lines: string[]) => {
      if (lines.length === 0) return;
      const lastIdx = lines.length - 1;
      const lastLine = lines[lastIdx];

      const braceIdx = lastLine.lastIndexOf('}');
      if (braceIdx !== -1) {
        // Remove the brace
        const newLine = lastLine.substring(0, braceIdx) + lastLine.substring(braceIdx + 1);

        // If the line is now empty (or just whitespace), remove it entirely
        if (!newLine.trim()) {
          lines.pop();
        } else {
          // eslint-disable-next-line no-param-reassign
          lines[lastIdx] = newLine;
        }
      }
    };

    const requiresQuotes = new Set([
      'content',
      'quotes',
      'cue',
      'cue-before',
      'cue-after',
      'src',
    ]);

    // List of properties that should have units if the value is a number
    const lengthProps = new Set([
      'width', 'height', 'top', 'left', 'right', 'bottom',
      'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'font-size', 'border-width', 'border-radius', 'gap', 'column-gap', 'row-gap',
      'min-width', 'min-height', 'max-width', 'max-height',
    ]);

    const non_recursive_at_rules = [
      '@keyframes',
      '@-webkit-keyframes',
      '@font-face',
      '@counter-style',
    ];

    const isNonRecursiveRule = (ruleName: string) => {
      return non_recursive_at_rules.some((prefix) => ruleName.startsWith(prefix));
    };

    const normalizeValue = (property: string, value: string | number): string | number => {
      if (!lengthProps.has(property)) {
        return value;
      }

      // If it's a number, add px
      if (typeof value === 'number') {
        return `${value}px`;
      }

      // If it's a numeric string with no unit, add px
      if (typeof value === 'string') {
        const trimmed = value.trim();

        // Match numeric string (integer or decimal), no unit
        if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
          return `${trimmed}px`;
        }

        // If it ends in known units or keywords, leave it alone
        return trimmed;
      }

      return value;
    };

    // Convert a line like "backgroundColor: red;" to "background-color: red;"
    const normalizeCSSLine = (line: string): string => {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) {
        return line; // Not a CSS property line
      }

      const rawProperty = line.slice(0, colonIndex).trim();
      let value: string | number = line.slice(colonIndex + 1).trim();

      const property = toKebabCase(rawProperty);

      // Remove trailing comma
      if (value.endsWith(',')) {
        value = value.slice(0, -1).trim();
      }

      // Only strip quotes if it's NOT a property like 'content'
      if (!requiresQuotes.has(property)) {
        value = value
          .split(',')
          .map((part) => {
            const trimmed = part.trim();
            // Check if the part is wrapped in quotes
            const match = trimmed.match(/^["'](.*)["']$/);

            if (match) {
              const innerValue = match[1];
              // If there's a space, keep the quotes (e.g., "Segoe UI")
              // If no space, strip them (e.g., "Arial" -> Arial)
              return innerValue.includes(' ') ? trimmed : innerValue;
            }
            return trimmed;
          })
          .join(', ');
      }

      value = normalizeValue(property, value);

      let cssLine = `${property}: ${value}`;
      if (!cssLine.endsWith(';')) {
        cssLine += ';';
      }

      return cssLine;
    };

    // Convert CSS object into flat lines
    const objectToLines = (obj: object): string[] => {
      const lines: string[] = [];

      const sourceObj = obj as Record<string, unknown>;

      for (const key in sourceObj) {
        const value = sourceObj[key];

        if (typeof value === 'object' && value !== null) {
          lines.push(`${key} {`);
          const nested = objectToLines(value);
          lines.push(...nested);
          lines.push('}');
        } else {
          // Note:
          // - We add a comma here to support object syntax, normalizeCSSLine will handle removing it and adding semicolons later.
          // - Don't stringify strings, to avoid double-escaping quotes (e.g. content: '"*"')
          const finalValue = typeof value === 'string' ? value : String(value);
          lines.push(`${key}: ${finalValue},`);
        }
      }

      return lines;
    };

    // Prepare raw lines
    const lines = typeof css === 'string'
      ? css.trim().split('\n').map((line) => line.trim()).filter(Boolean)
      : objectToLines(css);


    const topLevelRules: string[] = [];
    const nestedRules: string[] = [];
    const atRules: string[] = [];

    let currentNestedSelector: string | null = null;
    let currentAtRule: string | null = null;
    let atRuleLines: string[] = [];
    let atRuleBraceCount = 0;
    let nestedLines: string[] = [];
    let nestedBraceCount = 0;

    for (const line of lines) {
      // 1. AT-RULE HANDLING (@media, @keyframes)
      if (line.startsWith('@') || currentAtRule) {
        if (!currentAtRule) currentAtRule = line.split('{')[0].trim();
        atRuleLines.push(line);
        atRuleBraceCount += (line.match(/{/g) || []).length;
        atRuleBraceCount -= (line.match(/}/g) || []).length;

        if (atRuleBraceCount === 0) {
          const rawBlock = atRuleLines.join('\n');
          const contentOnly = rawBlock.substring(rawBlock.indexOf('{') + 1, rawBlock.lastIndexOf('}')).trim();

          if (currentAtRule.startsWith('@keyframes')) {
            // Keyframes: Process units/semicolons but DO NOT wrap in class
            const processed = contentOnly.split('\n').map((l) => {
              if (l.includes('{') || l.includes('}')) return l;
              return normalizeCSSLine(l);
            }).join(' ');
            atRules.push(`${currentAtRule} { ${processed} }`);
          } else {
            // Media Queries: Recursive call to wrap in class
            const processed = this.processCSS(className, contentOnly, false, debug);
            atRules.push(`${currentAtRule} { ${processed} }`);
          }
          currentAtRule = null;
          atRuleLines = [];
        }
        continue;
      }

      // 2. NESTED SELECTOR HANDLING (&:hover, ::before)
      if (line.includes('{') || currentNestedSelector) {
        if (!currentNestedSelector) {
          currentNestedSelector = line.split('{')[0].trim();
          if (currentNestedSelector.startsWith(':') && !currentNestedSelector.startsWith('&')) {
            currentNestedSelector = `&${currentNestedSelector}`;
          }
        } else if (!line.includes('}')) {
          nestedLines.push(normalizeCSSLine(line));
        }

        nestedBraceCount += (line.match(/{/g) || []).length;
        nestedBraceCount -= (line.match(/}/g) || []).length;

        if (nestedBraceCount === 0) {
          const selector = currentNestedSelector.replace(/&/g, `.${className}`);
          nestedRules.push(`${selector} { ${nestedLines.join(' ')} }`);
          currentNestedSelector = null;
          nestedLines = [];
        }
        continue;
      }

      // 3. TOP LEVEL PROPERTIES
      topLevelRules.push(normalizeCSSLine(line));
    }

    const topLevelCSS = (!isRecursive && topLevelRules.length > 0)
      ? `.${className} { ${topLevelRules.join(' ')} }`
      : topLevelRules.join(' ');

    return `${topLevelCSS} ${nestedRules.join(' ')} ${atRules.join(' ')}`.replace(/\s\s+/g, ' ').trim();
  }
}

