// Handles toast components throughout the app
class Toaster {
    constructor() {
        this.listeners = [];
        this.toasts = [];
    }
    // React component will subscribe to this
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }
    notify() {
        this.listeners.forEach((listener) => listener(this.toasts));
    }
    requestClose(id) {
        this.toasts = this.toasts.map((t) => {
            if (t.id === id) {
                return { ...t, exiting: true };
            }
            return t;
        });
        this.notify();
    }
    add(message, type = 'info') {
        const id = Date.now();
        this.toasts = [...this.toasts, { id, message, type }];
        this.notify();
        // Auto-remove
        setTimeout(() => {
            this.requestClose(id);
        }, 4000);
    }
    remove(id) {
        this.toasts = this.toasts.filter((t) => t.id !== id);
        this.notify();
    }
}
export const toaster = new Toaster();
// Helper function for cleaner usage in your app
export const toast = {
    info: (msg) => toaster.add(msg, 'info'),
    error: (msg) => toaster.add(msg, 'error'),
    success: (msg) => toaster.add(msg, 'success'),
};
