"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Arithmetic = void 0;
class Arithmetic {
    static clamp(number, min, max) {
        return Math.max(min, Math.min(number, max));
    }
}
exports.Arithmetic = Arithmetic;
