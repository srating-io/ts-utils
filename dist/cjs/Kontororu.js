"use strict";
// コントロール
Object.defineProperty(exports, "__esModule", { value: true });
exports.Kontororu = void 0;
class Kontororu extends EventTarget {
    constructor() {
        super();
        this.listeners = {};
    }
    addEventListener(type, listener) {
        super.addEventListener(type, listener);
        if (!this.listeners[type]) {
            this.listeners[type] = [];
        }
        this.listeners[type].push(listener);
    }
    removeEventListener(type, listener) {
        super.removeEventListener(type, listener);
        if (this.listeners[type]) {
            this.listeners[type] = this.listeners[type].filter((l) => l !== listener);
        }
    }
    getListeners(type) {
        return this.listeners[type] || [];
    }
}
exports.Kontororu = Kontororu;
