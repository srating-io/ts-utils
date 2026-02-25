import { Color } from '../../src/Color.js';

describe('Color Utilities', () => {
  it('lerpColor() interpolates hex values', () => {
    // 50% between Black and White
    expect(Color.lerpColor('#000000', '#ffffff', 0.5)).toBe('#7f7f7f');
    // 50% between Red and Green
    expect(Color.lerpColor('#ff0000', '#00ff00', 0.5)).toBe('#7f7f00');
  });

  it('alphaColor() converts hex to rgba', () => {
    expect(Color.alphaColor('#000000', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
    expect(Color.alphaColor('#ffffff', 1)).toBe('rgba(255, 255, 255, 1)');
  });

  it('invertColor() flips hex values', () => {
    expect(Color.invertColor('#000000')).toBe('#FFFFFF');
    expect(Color.invertColor('#FF0000')).toBe('#00FFFF');
  });
});
