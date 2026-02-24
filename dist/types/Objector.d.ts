type Merge<T, U> = Omit<T, keyof U> & U;
type MergeAll<T extends object[]> = T extends [infer First, ...infer Rest] ? First extends object ? Rest extends object[] ? Merge<First, MergeAll<Rest>> : First : unknown : unknown;
/**
 * Class to manipulate objects
 */
export declare class Objector {
    static deepClone<T>(obj: T, memo?: WeakMap<any, any>): T;
    /**
     * Deeply merges one or more source objects into a target object.
     *
     * - Each property from the sources is deep-cloned before being assigned.
     * - Existing properties in the target are overwritten by matching keys in later sources.
     * - Does not use spread or Object.assign.
     * - Mutates and returns the target object.
     *
     * @template T - The type of the target object.
     * @param {T} target - The object to extend.
     * @param {...U[]} sources - One or more source objects whose properties will be copied to the target.
     * @returns {T & U} The mutated target object containing all deep-cloned properties from the sources.
     *
     * @throws {TypeError} If the target is null or undefined.
     *
     * @example
     * const target = { a: 1 };
     * const source = { b: { nested: 2 } };
     * Objector.extender(target, source);
     * // target is now { a: 1, b: { nested: 2 } }
     */
    static extender<T extends object, U extends object[]>(target: T, ...sources: U): MergeAll<[T, ...U]>;
}
export {};
//# sourceMappingURL=Objector.d.ts.map