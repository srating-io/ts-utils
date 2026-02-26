export declare class Arrayifier {
    /**
      * Shuffle / ranomize elements in an array
      * @param {array} array The array to shuffle
      * @return array
      */
    static shuffle<T>(array: T[]): T[];
    /**
      *
      * @param {Array} arr
      * @param {number} n
      * @param {number} r
      * @param {number} index
      * @param {Array} data
      * @param {number} i
      * @param {Array} results
      * @returns Array
      */
    static combination<T>(arr: T[], n: number, r: number, index: number, data: T[], i: number, results: T[][]): T[][];
    /**
      * Get all combinations of every value in the provided array for a specified number
      * @param {Array} arr
      * @param {number} n
      * @param {number} r
      * @returns Array
      */
    static getCombinations<T>(arr: T[], n: number, r: number): T[][];
}
//# sourceMappingURL=Arrayifier.d.ts.map