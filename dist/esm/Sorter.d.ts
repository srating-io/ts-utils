/**
 * Table sorting helper utility
 */
export declare class Sorter {
    static descendingComparator(a: Record<string, string | number>, b: Record<string, string | number>, orderBy: string, direction_?: string): number;
    static getComparator(order: string, orderBy: string, direction?: string): (a: Record<string, string | number>, b: Record<string, string | number>) => number;
}
//# sourceMappingURL=Sorter.d.ts.map