export declare class Dates {
    static parse(str?: Date | string | number | undefined | null, utc?: boolean): Date;
    static utc(date: Date | string | number): Date;
    static getMonthsShort(): string[];
    static getMonths(): string[];
    static getDaysShort(): string[];
    static getDays(): string[];
    /**
     * Format a date using php syntax
     *
      | Token | Meaning                   | Example |
      | ----- | ------------------------- | ------- |
      | `Y`   | 4-digit year              | 2025    |
      | `y`   | 2-digit year              | 25      |
      | `m`   | 2-digit month             | 03      |
      | `n`   | month (no leading zero)   | 3       |
      | `d`   | day (2-digit)             | 09      |
      | `j`   | day (no leading zero)     | 9       |
      | `S`   | Ordinal suffix            | th      |
      | `H`   | 24-hour                   | 14      |
      | `G`   | 24-hour (no leading zero) | 14      |
      | `h`   | 12-hour                   | 02      |
      | `g`   | 12-hour (no leading zero) | 2       |
      | `i`   | minutes                   | 05      |
      | `s`   | seconds                   | 09      |
      | `A`   | AM/PM                     | PM      |
      | `a`   | am/pm                     | pm      |
      | `w`   | day of week (0–6)         | 1       |
      | `N`   | day of week (1–7)         | 2       |
      | `M`   | short month name          | Mar     |
      | `F`   | full month name           | March   |
      | `D`   | short weekday             | Mon     |
      | `l`   | full weekday              | Monday  |
     */
    static format(dateInput: Date | string, format: string): string;
    static add(date: Date | string, amount: number, unit: 'years' | 'months' | 'days' | 'hours' | 'minutes'): Date;
    static subtract(date: Date | string, amount: number, unit: 'years' | 'months' | 'days' | 'hours' | 'minutes'): Date;
    static fromNow(date: Date | string): string;
    /**
     * Find the closest date in an array of dates
     */
    static getClosestDate(dateToMatch: string | Date, datesArray: string[]): string | null;
    static getTodayEST(): string;
    static getStartOfDay(date: Date | string): Date;
    static getStartOfMonth(date: Date | string): Date;
    static getStartOfGrid(date: Date | string): Date;
    static isSameDay(date1: Date | string, date2: Date | string): boolean;
    static isBeforeDay(date1: Date | string, date2: Date | string): boolean;
    static isAfterDay(date1: Date | string, date2: Date | string): boolean;
}
//# sourceMappingURL=Dates.d.ts.map