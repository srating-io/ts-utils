/**
 * Class to get the style
 * Has base CSS functions
 */
export declare class Style {
    static getStyle(): {
        zIndex: {
            appBar: number;
            drawer: number;
            fab: number;
            calendar: number;
            mobileStepper: number;
            modal: number;
            toast: number;
            speedDial: number;
            tooltip: number;
        };
    };
    static getZIndex(): {
        appBar: number;
        drawer: number;
        fab: number;
        calendar: number;
        mobileStepper: number;
        modal: number;
        toast: number;
        speedDial: number;
        tooltip: number;
    };
    static getNavBar(): {
        width: string;
        display: string;
        justifyContent: string;
        zIndex: number;
        position: string;
        overflowX: string;
        overflowY: string;
        scrollbarWidth: string;
    };
    static getShadow(depth: number): string;
    /**
     *
     *
     *
     *
     * Below is all the CSS injection from js
     *
     *
     *
     */
    /**
     * Call this to add css as a style-sheet, so you can do css selectors like hover td {} etc
     */
    static getStyleClassName(cssString: string | object, debug?: boolean): string;
    static getCSS(): string;
    static flush(): void;
    private static styleCache;
    private static cssMap;
    private static hashCSS;
    private static injectStyle;
    private static processCSS;
}
//# sourceMappingURL=Style.d.ts.map