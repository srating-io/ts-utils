export declare class Kontororu extends EventTarget {
    constructor();
    private listeners;
    addEventListener(type: string, listener: (...args: unknown[]) => void): void;
    removeEventListener(type: string, listener: (...args: unknown[]) => void): void;
    getListeners(type: string): ((...args: unknown[]) => void)[];
}
//# sourceMappingURL=Kontororu.d.ts.map