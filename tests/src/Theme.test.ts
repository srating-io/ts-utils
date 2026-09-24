/* eslint-disable no-restricted-syntax */
import { Theme } from '../../src/Theme.js';

const HEX = /^#[0-9a-fA-F]{3,8}$/;

const SCALE_KEYS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
const ACCENT_KEYS = ['A100', 'A200', 'A400', 'A700'] as const;
const PALETTE_KEYS = [
  'grey', 'red', 'pink', 'purple', 'deepPurple', 'indigo', 'blue', 'lightBlue',
  'cyan', 'teal', 'green', 'lightGreen', 'lime', 'yellow', 'amber', 'orange',
  'deepOrange', 'brown',
] as const;
const SEMANTIC_KEYS = ['primary', 'secondary', 'warning', 'success', 'error', 'info'] as const;

describe('Theme', () => {
  describe('constructor', () => {
    test('accepts light and dark', () => {
      expect(() => new Theme('light')).not.toThrow();
      expect(() => new Theme('dark')).not.toThrow();
    });

    test('rejects any other mode', () => {
      expect(() => new Theme('blue')).toThrow('Unknown theme: blue');
      expect(() => new Theme('')).toThrow('Unknown theme: ');
      expect(() => new Theme('Light')).toThrow('Unknown theme: Light');
    });
  });

  describe('getTheme()', () => {
    test('returns the light theme for light mode', () => {
      expect(new Theme('light').getTheme().mode).toBe('light');
    });

    test('returns the dark theme for dark mode', () => {
      expect(new Theme('dark').getTheme().mode).toBe('dark');
    });

    test('matches the explicit getter for the same mode', () => {
      expect(new Theme('light').getTheme()).toEqual(new Theme('light').getLightTheme());
      expect(new Theme('dark').getTheme()).toEqual(new Theme('dark').getDarkTheme());
    });

    test('returns a fresh object each call, so callers cannot share state', () => {
      const theme = new Theme('light');
      const a = theme.getTheme();
      const b = theme.getTheme();

      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });

  describe.each([
    ['light', () => new Theme('light').getLightTheme()],
    ['dark', () => new Theme('dark').getDarkTheme()],
  ] as const)('%s theme', (mode, build) => {
    test('reports its own mode', () => {
      expect(build().mode).toBe(mode);
    });

    test('exposes every colour palette', () => {
      const theme = build() as unknown as Record<string, unknown>;

      for (const key of PALETTE_KEYS) {
        expect(theme[key]).toBeDefined();
      }
    });

    test('every palette scale has the full set of shades', () => {
      const theme = build() as unknown as Record<string, Record<string, string>>;

      for (const key of PALETTE_KEYS) {
        for (const shade of SCALE_KEYS) {
          expect(theme[key][shade]).toMatch(HEX);
        }
      }
    });

    test('every palette except brown has accent shades', () => {
      const theme = build() as unknown as Record<string, Record<string, string>>;

      for (const key of PALETTE_KEYS) {
        if (key === 'brown') {
          continue;
        }
        for (const accent of ACCENT_KEYS) {
          expect(theme[key][accent]).toMatch(HEX);
        }
      }
    });

    test('exposes main/light/dark for every semantic colour', () => {
      const theme = build() as unknown as Record<string, Record<string, string>>;

      for (const key of SEMANTIC_KEYS) {
        expect(theme[key].main).toMatch(HEX);
        expect(theme[key].light).toMatch(HEX);
        expect(theme[key].dark).toMatch(HEX);
      }
    });

    test('exposes background, header, text, link and action', () => {
      const theme = build();

      expect(theme.background.main).toMatch(HEX);
      expect(theme.header.main).toMatch(HEX);
      expect(theme.text.primary).toBeTruthy();
      expect(theme.text.secondary).toBeTruthy();
      expect(theme.text.disabled).toBeTruthy();
      expect(theme.link.primary).toMatch(HEX);
      expect(theme.action.active).toBeTruthy();
    });

    test('action opacities are fractions between 0 and 1', () => {
      const { action } = build();

      for (const opacity of [
        action.disabledOpacity,
        action.focusOpacity,
        action.hoverOpacity,
        action.selectedOpacity,
      ]) {
        expect(opacity).toBeGreaterThan(0);
        expect(opacity).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('derived colours', () => {
    test('the header colour is drawn from the grey ramp', () => {
      const dark = new Theme('dark').getDarkTheme();

      expect(dark.header.main).toBe(dark.grey[900]);
    });
  });

  describe('mode differences', () => {
    test('the light theme carries contrastText on semantic colours', () => {
      const theme = new Theme('light').getLightTheme() as unknown as Record<string, Record<string, string>>;

      for (const key of SEMANTIC_KEYS) {
        expect(theme[key].contrastText).toBeTruthy();
      }
    });

    test('the light theme has a secondary background', () => {
      expect(new Theme('light').getLightTheme().background.light).toMatch(HEX);
    });

    test('the dark theme has an icon text colour', () => {
      expect(new Theme('dark').getDarkTheme().text.icon).toBeTruthy();
    });

    test('the two modes use different backgrounds', () => {
      expect(new Theme('light').getLightTheme().background.main)
        .not.toBe(new Theme('dark').getDarkTheme().background.main);
    });

    test('the shared palettes are identical across modes', () => {
      const light = new Theme('light').getLightTheme() as unknown as Record<string, unknown>;
      const dark = new Theme('dark').getDarkTheme() as unknown as Record<string, unknown>;

      for (const key of PALETTE_KEYS) {
        expect(light[key]).toEqual(dark[key]);
      }
    });
  });
});
