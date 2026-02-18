"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sorter = void 0;
/**
 * Table sorting helper utility
 */
class Sorter {
    static descendingComparator(a, b, orderBy, direction_) {
        if ((orderBy in a) && b[orderBy] === null) {
            return 1;
        }
        if (a[orderBy] === null && (orderBy in b)) {
            return -1;
        }
        const a_value = a[orderBy];
        const b_value = b[orderBy];
        const direction = direction_ || 'lower';
        if (b_value < a_value) {
            return direction === 'higher' ? 1 : -1;
        }
        if (b_value > a_value) {
            return direction === 'higher' ? -1 : 1;
        }
        return 0;
    }
    static getComparator(order, orderBy, direction) {
        return order === 'desc'
            ? (a, b) => this.descendingComparator(a, b, orderBy, direction)
            : (a, b) => -this.descendingComparator(a, b, orderBy, direction);
    }
}
exports.Sorter = Sorter;
