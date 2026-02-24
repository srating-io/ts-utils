export declare class Color {
    /**
     * A linear interpolator for hexadecimal colors
     * @param {string} a
     * @param {string} b
     * @param {number} amount
     * @example
     * // returns #7F7F7F
     * lerpColor('#000000', '#ffffff', 0.5)
     * @return {string}
     */
    static lerpColor(a: string, b: string, amount: number): string;
    /**
     * Get a color that will look readable based on a background color
     */
    static getTextColor(color: string, backgroundColor: string, debug?: boolean): string;
    static getContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number;
    /**
     * Take a hex (#fff) and an amount and darken the color, return a hex
     * @param {string} hex
     * @param {number} amount
     * @return {string} hex
     */
    /**
     * Take a hex (#fff) and an amount and lighten the color, return a hex
     * @param {string} hex
     * @param {number} amount
     * @return {string} hex
     */
    /**
     * Mixes the color with black to create a Shade.
     * Prevents the "muddy/brown" look of HSL darkening.
     * @param {string} hex - The color to darken
     * @param {number} amount - 0 to 1 (e.g. 0.1 is 10% darker)
     * @return {string} hex
     */
    static darken(hex: string, amount?: number): string;
    /**
     * Mixes the color with white to create a Tint.
     * cleaner and less "washed out" than HSL lightness adjustment.
     * @param {string} hex - The color to lighten
     * @param {number} amount - 0 to 1 (e.g. 0.1 is 10% lighter)
     * @return {string} hex
     */
    static lighten(hex: string, amount?: number): string;
    static shadeColor(hex: string, percent: number): string;
    /**
     * Are 2 colors similar to each other?
     * @param {string} color1
     * @param {string} color2
     * @param {number} threshold
     * @return {boolean}
     */
    static areColorsSimilar(color1: string, color2: string, threshold?: number): boolean;
    /**
     * Inverts a hex color
     * @param {string} hex
     * @return {string} hex
     */
    static invertColor(hex: string): string;
    /**
     * Takes a hex (#fff) and returns an rgba with the provided alpha
     * @param {string} hex
     * @param {number} alpha
     * @return {string} rgba()
     */
    static alphaColor(hex: string, alpha: number): string;
    /**
     * Gets analogous colors
     * @param {string} hex
     * @return {Array<string>}
     */
    static getAnalogousColors(hex: string): string[];
    /**
     * Convert hex to rgb
     * @param {string} hex
     * @return {Array} rgb
     */
    static hexToRgb(hex: string): Array<number>;
    /**
     * Convert rgb to hex
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @return {string}
     */
    private static rgbToHex;
    private static rgbToHsl;
    private static hslToRgb;
    private static calculateBrightness;
    private static colorDistance;
}
//# sourceMappingURL=Color.d.ts.map