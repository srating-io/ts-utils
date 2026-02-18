export declare class Arrayifier {
    /**
      * Shuffle / ranomize elements in an array
      * @param {array} array The array to shuffle
      * @return array
      */
    shuffle(array: Array<unknown>): Array<unknown>;
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
    combination(arr: Array<number>, n: number, r: number, index: number, data: number[], i: number, results: number[][]): number[][];
    /**
      * Get all combinations of every value in the provided array for a specified number
      * @param {Array} arr
      * @param {number} n
      * @param {number} r
      * @returns Array
      */
    getCombinations(arr: Array<number>, n: number, r: number): number[][];
}
//# sourceMappingURL=Arrayifier.d.ts.map