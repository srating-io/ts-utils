/* eslint-disable no-restricted-syntax */
import { Color } from '../../src/Color.js';

describe('Color Utilities', () => {
  describe('hexToRgb()', () => {
    test('parses a 6-character hex', () => {
      expect(Color.hexToRgb('#ffffff')).toEqual([255, 255, 255]);
      expect(Color.hexToRgb('#000000')).toEqual([0, 0, 0]);
      expect(Color.hexToRgb('#ff8000')).toEqual([255, 128, 0]);
    });

    test('expands a 3-character shorthand', () => {
      expect(Color.hexToRgb('#fff')).toEqual([255, 255, 255]);
      expect(Color.hexToRgb('#f00')).toEqual([255, 0, 0]);
      expect(Color.hexToRgb('#abc')).toEqual([170, 187, 204]);
    });

    test('works with or without the leading hash', () => {
      expect(Color.hexToRgb('ff0000')).toEqual(Color.hexToRgb('#ff0000'));
    });

    test('is case insensitive', () => {
      expect(Color.hexToRgb('#AABBCC')).toEqual(Color.hexToRgb('#aabbcc'));
    });

    test('rejects a hex of the wrong length', () => {
      expect(() => Color.hexToRgb('#ffff')).toThrow('Invalid hex color format');
      expect(() => Color.hexToRgb('#ff')).toThrow('Invalid hex color format');
      expect(() => Color.hexToRgb('')).toThrow('Invalid hex color format');
    });

    test('rejects non-hex characters instead of silently returning black', () => {
      // The characters are checked as well as the length: parseInt() on a
      // non-hex string yields NaN, which would read as black rather than fail.
      expect(() => Color.hexToRgb('#zzzzzz')).toThrow('Invalid hex color format');
      expect(() => Color.hexToRgb('xyzxyz')).toThrow('Invalid hex color format');
      expect(() => Color.hexToRgb('#ggg')).toThrow('Invalid hex color format');
    });
  });

  describe('rgbToHex()', () => {
    test('packs channels into a hex string', () => {
      expect(Color.rgbToHex(255, 0, 0)).toBe('#FF0000');
      expect(Color.rgbToHex(0, 0, 0)).toBe('#000000');
      expect(Color.rgbToHex(255, 128, 0)).toBe('#FF8000');
    });

    test('zero-pads each channel', () => {
      expect(Color.rgbToHex(1, 2, 3)).toBe('#010203');
    });

    test('round-trips with hexToRgb', () => {
      for (const hex of ['#FF0000', '#123456', '#FFFFFF', '#000000', '#A1B2C3']) {
        const [r, g, b] = Color.hexToRgb(hex);

        expect(Color.rgbToHex(r, g, b)).toBe(hex);
      }
    });

    test('rounds fractional channels to the nearest integer', () => {
      // 0.6 -> 1, 1.4 -> 1, 2.5 -> 3
      expect(Color.rgbToHex(0.6, 1.4, 2.5)).toBe('#010103');
    });

    test('clamps channels outside 0..255 instead of corrupting the string', () => {
      expect(Color.rgbToHex(300, -20, 128)).toBe('#FF0080');
      expect(Color.rgbToHex(510, 0, 0)).toBe('#FF0000');
    });
  });

  describe('rgbToHsl() and hslToRgb()', () => {
    test('converts the primaries to HSL', () => {
      expect(Color.rgbToHsl(255, 0, 0)).toEqual([0, 100, 50]);
      expect(Color.rgbToHsl(0, 255, 0)).toEqual([120, 100, 50]);
      expect(Color.rgbToHsl(0, 0, 255)).toEqual([240, 100, 50]);
    });

    test('reports greys as achromatic', () => {
      expect(Color.rgbToHsl(0, 0, 0)).toEqual([0, 0, 0]);
      expect(Color.rgbToHsl(255, 255, 255)).toEqual([0, 0, 100]);

      const [h, s] = Color.rgbToHsl(128, 128, 128);
      expect(h).toBe(0);
      expect(s).toBe(0);
    });

    test('converts HSL back to the primaries', () => {
      expect(Color.hslToRgb(0, 100, 50)).toEqual([255, 0, 0]);
      expect(Color.hslToRgb(120, 100, 50)).toEqual([0, 255, 0]);
      expect(Color.hslToRgb(240, 100, 50)).toEqual([0, 0, 255]);
    });

    test('converts the secondaries', () => {
      expect(Color.hslToRgb(60, 100, 50)).toEqual([255, 255, 0]);
      expect(Color.hslToRgb(180, 100, 50)).toEqual([0, 255, 255]);
      expect(Color.hslToRgb(300, 100, 50)).toEqual([255, 0, 255]);
    });

    test('handles zero saturation as a grey', () => {
      expect(Color.hslToRgb(0, 0, 0)).toEqual([0, 0, 0]);
      expect(Color.hslToRgb(200, 0, 100)).toEqual([255, 255, 255]);
    });

    test('never produces a channel outside 0..255', () => {
      for (let hue = 0; hue < 360; hue += 15) {
        for (const channel of Color.hslToRgb(hue, 100, 50)) {
          expect(channel).toBeGreaterThanOrEqual(0);
          expect(channel).toBeLessThanOrEqual(255);
        }
      }
    });

    test('round-trips rgb -> hsl -> rgb', () => {
      const colors: [number, number, number][] = [
        [255, 0, 0], [0, 255, 0], [0, 0, 255],
        [18, 52, 86], [200, 100, 50], [12, 200, 180],
      ];

      for (const [r, g, b] of colors) {
        const [h, s, l] = Color.rgbToHsl(r, g, b);
        const [r2, g2, b2] = Color.hslToRgb(h, s, l);

        expect(r2).toBeCloseTo(r, 0);
        expect(g2).toBeCloseTo(g, 0);
        expect(b2).toBeCloseTo(b, 0);
      }
    });
  });

  describe('lerpColor()', () => {
    test('interpolates hex values', () => {
      // 50% between Black and White
      expect(Color.lerpColor('#000000', '#ffffff', 0.5)).toBe('#7f7f7f');
      // 50% between Red and Green
      expect(Color.lerpColor('#ff0000', '#00ff00', 0.5)).toBe('#7f7f00');
    });

    test('returns the endpoints at 0 and 1', () => {
      expect(Color.lerpColor('#000000', '#ffffff', 0)).toBe('#000000');
      expect(Color.lerpColor('#000000', '#ffffff', 1)).toBe('#ffffff');
      expect(Color.lerpColor('#123456', '#abcdef', 0)).toBe('#123456');
    });

    test('clamps amounts outside 0..1', () => {
      // An amount outside 0..1 saturates at the endpoints; letting it run past
      // them carries into the neighbouring byte of the packed integer.
      expect(Color.lerpColor('#000000', '#ffffff', 2)).toBe('#ffffff');
      expect(Color.lerpColor('#ffffff', '#000000', 2)).toBe('#000000');
      expect(Color.lerpColor('#000000', '#ffffff', -1)).toBe('#000000');
    });

    test('supports 3-character shorthand', () => {
      // Shorthand expands before parsing; read raw, '#fff' is 0x0fff.
      expect(Color.lerpColor('#fff', '#000', 0)).toBe('#ffffff');
      expect(Color.lerpColor('#fff', '#000', 1)).toBe('#000000');
    });

    test('always returns a 6-digit hex', () => {
      for (const amount of [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1]) {
        expect(Color.lerpColor('#010203', '#fdfeff', amount)).toMatch(/^#[0-9a-f]{6}$/);
      }
    });
  });

  describe('alphaColor()', () => {
    test('converts hex to rgba', () => {
      expect(Color.alphaColor('#000000', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
      expect(Color.alphaColor('#ffffff', 1)).toBe('rgba(255, 255, 255, 1)');
    });

    test('accepts shorthand hex', () => {
      expect(Color.alphaColor('#f00', 0.25)).toBe('rgba(255, 0, 0, 0.25)');
    });
  });

  describe('invertColor()', () => {
    test('flips hex values', () => {
      expect(Color.invertColor('#000000')).toBe('#FFFFFF');
      expect(Color.invertColor('#FF0000')).toBe('#00FFFF');
    });

    test('is its own inverse', () => {
      expect(Color.invertColor(Color.invertColor('#123456'))).toBe('#123456');
    });

    test('maps mid-grey close to itself', () => {
      expect(Color.invertColor('#808080')).toBe('#7F7F7F');
    });
  });

  describe('darken()', () => {
    test('mixes the colour toward black', () => {
      expect(Color.darken('#ffffff', 0.5)).toBe('#808080');
      expect(Color.darken('#ff0000', 0.5)).toBe('#800000');
    });

    test('leaves the colour alone at 0', () => {
      expect(Color.darken('#3366cc', 0)).toBe('#3366CC');
    });

    test('produces black at 1', () => {
      expect(Color.darken('#ffffff', 1)).toBe('#000000');
    });

    test('black cannot get darker', () => {
      expect(Color.darken('#000000', 0.5)).toBe('#000000');
    });

    test('defaults to a 10% shade', () => {
      expect(Color.darken('#ffffff')).toBe(Color.darken('#ffffff', 0.1));
    });
  });

  describe('lighten()', () => {
    test('mixes the colour toward white', () => {
      expect(Color.lighten('#000000', 0.5)).toBe('#808080');
      expect(Color.lighten('#000000', 1)).toBe('#FFFFFF');
    });

    test('leaves the colour alone at 0', () => {
      expect(Color.lighten('#3366cc', 0)).toBe('#3366CC');
    });

    test('white cannot get lighter', () => {
      expect(Color.lighten('#ffffff', 0.5)).toBe('#FFFFFF');
    });

    test('defaults to a 10% tint', () => {
      expect(Color.lighten('#000000')).toBe(Color.lighten('#000000', 0.1));
    });

    test('is the mirror of darken for the extremes', () => {
      expect(Color.lighten('#000000', 1)).toBe(Color.invertColor(Color.darken('#ffffff', 1)));
    });
  });

  describe('shadeColor()', () => {
    test('scales each channel by the percentage', () => {
      expect(Color.shadeColor('#808080', 100)).toBe('#FFFFFF');
      expect(Color.shadeColor('#808080', -50)).toBe('#404040');
    });

    test('is a no-op at 0 percent', () => {
      expect(Color.shadeColor('#3366cc', 0)).toBe('#3366CC');
    });

    test('clamps to the 0..255 range', () => {
      expect(Color.shadeColor('#ffffff', 500)).toBe('#FFFFFF');
      expect(Color.shadeColor('#ffffff', -500)).toBe('#000000');
    });

    test('cannot move black, which has nothing to scale', () => {
      expect(Color.shadeColor('#000000', 100)).toBe('#000000');
    });
  });

  describe('getContrastRatio()', () => {
    test('black on white is the maximum 21:1', () => {
      expect(Color.getContrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
    });

    test('a colour against itself is 1:1', () => {
      expect(Color.getContrastRatio([120, 60, 30], [120, 60, 30])).toBeCloseTo(1, 5);
    });

    test('is symmetric', () => {
      const a: [number, number, number] = [10, 200, 90];
      const b: [number, number, number] = [240, 40, 15];

      expect(Color.getContrastRatio(a, b)).toBeCloseTo(Color.getContrastRatio(b, a), 10);
    });

    test('never drops below 1', () => {
      expect(Color.getContrastRatio([1, 2, 3], [3, 2, 1])).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getTextColor()', () => {
    test('keeps a colour that already meets the 4.5:1 target', () => {
      expect(Color.getTextColor('#000000', '#ffffff')).toBe('#000000');
    });

    test('adjusts a low-contrast colour until it is readable', () => {
      const result = Color.getTextColor('#eeeeee', '#ffffff');
      const [r, g, b] = Color.hexToRgb(result);

      expect(result).not.toBe('#EEEEEE');
      expect(Color.getContrastRatio([r, g, b], [255, 255, 255])).toBeGreaterThanOrEqual(4.5);
    });

    test('lightens against a dark background', () => {
      const result = Color.getTextColor('#222222', '#000000');
      const [r, g, b] = Color.hexToRgb(result);

      expect(Color.getContrastRatio([r, g, b], [0, 0, 0])).toBeGreaterThanOrEqual(4.5);
    });

    test('always returns a valid hex', () => {
      expect(Color.getTextColor('#777777', '#888888')).toMatch(/^#[0-9A-F]{6}$/);
    });
  });

  describe('areColorsSimilar()', () => {
    test('a colour is similar to itself', () => {
      expect(Color.areColorsSimilar('#3366cc', '#3366cc')).toBe(true);
    });

    test('black and white are not similar', () => {
      expect(Color.areColorsSimilar('#000000', '#ffffff')).toBe(false);
    });

    test('near neighbours are similar', () => {
      expect(Color.areColorsSimilar('#3366cc', '#3568ce')).toBe(true);
    });

    test('respects a custom threshold', () => {
      // Distance between #000000 and #0000ff is exactly 255.
      expect(Color.areColorsSimilar('#000000', '#0000ff', 256)).toBe(true);
      expect(Color.areColorsSimilar('#000000', '#0000ff', 254)).toBe(false);
    });
  });

  describe('getAnalogousColors()', () => {
    test('returns the two neighbours 30 degrees either side', () => {
      const result = Color.getAnalogousColors('#ff0000');

      expect(result).toHaveLength(2);
      for (const color of result) {
        expect(color).toMatch(/^#[0-9A-F]{6}$/);
      }
    });

    test('the neighbours differ from the source and from each other', () => {
      const [before, after] = Color.getAnalogousColors('#ff0000');

      expect(before).not.toBe(after);
      expect(before).not.toBe('#FF0000');
      expect(after).not.toBe('#FF0000');
    });

    test('returns the hues 30 degrees either side of pure red', () => {
      // hue2rgb breaks at 1/2 and 2/3. Any other breakpoints shift every hue
      // and push channels past 255.
      expect(Color.getAnalogousColors('#ff0000')).toEqual(['#FF0080', '#FF8000']);
    });

    test('round-trips the primary and secondary hues through HSL', () => {
      // 30 degrees either side of a primary lands on known colours.
      // The half-channel lands on 0x7F or 0x80 depending on floating-point
      // rounding in the hue conversion; both are the intended mid value.
      expect(Color.getAnalogousColors('#00ff00')).toEqual(['#80FF00', '#00FF80']);
      expect(Color.getAnalogousColors('#0000ff')).toEqual(['#007FFF', '#7F00FF']);
    });

    test('never produces a channel outside 0..255', () => {
      for (const hex of ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff', '#ff8000', '#123456']) {
        for (const color of Color.getAnalogousColors(hex)) {
          for (const channel of Color.hexToRgb(color)) {
            expect(channel).toBeGreaterThanOrEqual(0);
            expect(channel).toBeLessThanOrEqual(255);
          }
        }
      }
    });

    test('handles greys, which have no meaningful hue', () => {
      const result = Color.getAnalogousColors('#808080');

      expect(result).toHaveLength(2);
      for (const color of result) {
        expect(color).toMatch(/^#[0-9A-F]{6}$/);
      }
    });

    test('wraps around the hue circle without producing invalid values', () => {
      for (const hex of ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff']) {
        for (const color of Color.getAnalogousColors(hex)) {
          expect(color).toMatch(/^#[0-9A-F]{6}$/);
        }
      }
    });
  });
});
