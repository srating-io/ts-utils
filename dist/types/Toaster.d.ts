export interface ToastItem {
    id: number;
    message: string;
    type: string;
    exiting?: boolean;
}
export type ToastListener = (toasts: ToastItem[]) => void;
declare class Toaster {
    private listeners;
    private toasts;
    subscribe(listener: ToastListener): () => void;
    notify(): void;
    requestClose(id: number): void;
    add(message: string, type?: string): void;
    remove(id: number): void;
}
export declare const toaster: Toaster;
export declare const toast: {
    info: (msg: string) => void;
    error: (msg: string) => void;
    success: (msg: string) => void;
};
export {};
//# sourceMappingURL=Toaster.d.ts.map