/*
 * Copyright 2026 Evan Smalley.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 */

export class Arrayifier {
  // constructor() {
  // }


  /**
    * Shuffle / ranomize elements in an array
    * @param {array} array The array to shuffle
    * @return array
    */
  public static shuffle<T>(array: T[]): T[] {
    let currentIndex: number = array.length;
    let randomIndex: number;

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
  }

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
  public static combination<T>(arr: T[], n: number, r: number, index: number, data: T[], i: number, results: T[][]) {
    if (index === r) {
      results.push(data.slice(0, r));
      return results;
    }

    if (i >= n) {
      return results;
    }

    data[index] = arr[i];
    this.combination(arr, n, r, index + 1, data, i + 1, results);
    this.combination(arr, n, r, index, data, i + 1, results);

    return results;
  }

  /**
    * Get all combinations of every value in the provided array for a specified number
    * @param {Array} arr
    * @param {number} n
    * @param {number} r
    * @returns Array
    */
  public static getCombinations<T>(arr: T[], n: number, r: number) {
    const data: T[] = new Array(r);

    let results: T[][] = [];
    results = this.combination(arr, n, r, 0, data, 0, results);
    return results;
  }
}
