"use strict";
/* eslint-disable one-var-declaration-per-line */
/* eslint-disable one-var */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dates = void 0;
class Dates {
    // constructor() {
    // }
    /*
     * Robust Date Parsing
     * Handles:
     * - Date Objects / Numbers (Timestamps)
     * - ISO Strings (2025-01-01) -> Forces Local Midnight
     * - US Formats (01/05/2026)
     * - Mixed Time Formats (23:00 pm, 5:00pm, 14:30:00)
     */
    static parse(str, utc = false) {
        // 1. Handle Null / Undefined -> Return Now
        if (!str) {
            return new Date();
        }
        // 2. Handle Existing Date Objects -> Return Copy
        if (str instanceof Date) {
            return new Date(str.getTime());
        }
        // 3. Handle Timestamps (Numbers)
        if (typeof str === 'number') {
            return new Date(str);
        }
        // 4. Handle Strings
        if (typeof str === 'string') {
            const input = str.trim();
            // CASE A: Strict ISO Date "YYYY-MM-DD"
            // Native JS parses this as UTC Midnight, which often shows as
            // previous day 7pm EST. We force "T00:00:00" to make it Local Midnight.
            if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
                return new Date(`${input}T00:00:00`);
            }
            // CASE B: Manual Parsing for Complex Strings
            // This handles "2026-01-05 23:03:19 pm", "01/05/2026", etc.
            // Step 1: Extract Date Part (YYYY-MM-DD or MM/DD/YYYY)
            // Regex looks for: (Group 1: Year/Month) -or/ (Group 2: Month/Day) -or/ (Group 3: Day/Year)
            let year, month, day, timePart = '';
            // Match YYYY-MM-DD or YYYY/MM/DD
            const isoMatch = input.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(.*)$/);
            // Match MM/DD/YYYY or MM-DD-YYYY
            const usMatch = input.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(.*)$/);
            if (isoMatch) {
                year = parseInt(isoMatch[1], 10);
                month = parseInt(isoMatch[2], 10) - 1; // JS Months are 0-11
                day = parseInt(isoMatch[3], 10);
                timePart = isoMatch[4];
            }
            else if (usMatch) {
                year = parseInt(usMatch[3], 10);
                month = parseInt(usMatch[1], 10) - 1;
                day = parseInt(usMatch[2], 10);
                timePart = usMatch[4];
            }
            else {
                // Fallback: Let the browser try its best if our regex fails
                const d = new Date(input);
                return isNaN(d.getTime()) ? new Date() : d;
            }
            // Step 2: Extract Time Part
            let hours = 0;
            let minutes = 0;
            let seconds = 0;
            // Look for HH:MM(:SS) and optional AM/PM in the remaining string
            if (timePart && timePart.trim().length > 0) {
                // Matches: 23:03, 23:03:19, 5:00pm, 5:00 pm
                const timeMatch = timePart.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(am|pm|AM|PM)?/);
                if (timeMatch) {
                    hours = parseInt(timeMatch[1], 10);
                    minutes = parseInt(timeMatch[2], 10);
                    seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
                    const meridiem = timeMatch[4] ? timeMatch[4].toLowerCase() : null;
                    // Step 3: Normalize Hours (12h to 24h)
                    if (meridiem === 'pm' && hours < 12) {
                        hours += 12;
                    }
                    if (meridiem === 'am' && hours === 12) {
                        hours = 0;
                    }
                    // Note: If input is "23:00 pm", we ignore the 'pm' because 23 > 12.
                }
            }
            if (utc) {
                return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
            }
            // Step 4: Construct Date in Local Time
            return new Date(year, month, day, hours, minutes, seconds);
        }
        return new Date();
    }
    static utc(date) {
        const d = this.parse(date);
        return new Date(d.getTime() + (d.getTimezoneOffset() * 60000));
    }
    static getMonthsShort() {
        return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }
    static getMonths() {
        return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    }
    static getDaysShort() {
        return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    }
    static getDays() {
        return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    }
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
    static format(dateInput, format) {
        const date = this.parse(dateInput);
        const pad = (n) => String(n).padStart(2, '0');
        const monthsShort = this.getMonthsShort();
        const monthsLong = this.getMonths();
        const daysShort = this.getDaysShort();
        const daysLong = this.getDays();
        /*
        const Y = date.getUTCFullYear();
        const y = String(Y).slice(-2);
        const month = date.getUTCMonth(); // 0-11
        const dateNum = date.getUTCDate(); // 1-31
        const day = date.getUTCDay(); // 0-6, Sun = 0
        const hours = date.getUTCHours(); // 0-23
        const minutes = date.getUTCMinutes();
        const seconds = date.getUTCSeconds();
        */
        const Y = date.getFullYear();
        const y = String(Y).slice(-2);
        const month = date.getMonth(); // 0-11
        const dateNum = date.getDate(); // 1-31
        const day = date.getDay(); // 0-6, Sun = 0
        const hours = date.getHours(); // 0-23
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        // Logic for ordinal suffix (st, nd, rd, th)
        const getOrdinalSuffix = (n) => {
            const v = n % 100;
            // 11th, 12th, 13th are exceptions to the 1st, 2nd, 3rd rule
            if (v >= 11 && v <= 13) {
                return 'th';
            }
            switch (n % 10) {
                case 1: {
                    return 'st';
                }
                case 2: {
                    return 'nd';
                }
                case 3: {
                    return 'rd';
                }
                default: {
                    return 'th';
                }
            }
        };
        const tokens = {
            /// Year
            Y: String(Y),
            y,
            // Month
            m: pad(month + 1),
            n: String(month + 1),
            M: monthsShort[month],
            F: monthsLong[month],
            // Day
            d: pad(dateNum),
            j: String(dateNum),
            D: daysShort[day],
            l: daysLong[day],
            w: String(day), // 0 (Sun) - 6
            N: String(day === 0 ? 7 : day), // 1 (Mon) - 7 (Sun)
            S: getOrdinalSuffix(dateNum),
            // Time
            H: pad(hours),
            G: String(hours),
            h: pad(((hours + 11) % 12) + 1),
            g: String(((hours + 11) % 12) + 1),
            i: pad(minutes),
            s: pad(seconds),
            // AM/PM
            A: hours < 12 ? 'AM' : 'PM',
            a: hours < 12 ? 'am' : 'pm',
        };
        // Replace tokens using regex
        return format.replace(/\\(.)|([a-zA-Z])/g, (_, esc, token) => {
            if (esc) {
                // literal escaped char like \H or \Y → return the raw letter
                return esc;
            }
            return tokens[token] ?? token;
        });
    }
    static add(date, amount, unit) {
        const d = this.parse(date);
        if (unit === 'years') {
            const originalDay = d.getDate();
            d.setFullYear(d.getFullYear() + amount);
            // Handle Leap Year Rollover:
            // Feb 29, 2024 + 1 year -> Mar 1, 2025 (Standard JS behavior)
            // If strict "same day or last day of month" logic is desired (turning it into Feb 28):
            if (d.getDate() !== originalDay) {
                d.setDate(0); // Set to last day of previous month (Feb 28)
            }
        }
        else if (unit === 'months') {
            const originalDay = d.getDate();
            d.setMonth(d.getMonth() + amount);
            // Handle rollover: Jan 31 + 1 month -> Feb 28/29
            if (d.getDate() !== originalDay) {
                d.setDate(0); // Set to last day of previous month
            }
        }
        else if (unit === 'days') {
            // Use setDate to be DST safe (24h addition via ms is unsafe across DST)
            d.setDate(d.getDate() + amount);
        }
        else {
            const map = {
                hours: amount * 60 * 60 * 1000,
                minutes: amount * 60 * 1000,
            };
            // Use getTime() for day/hour/minute units for simple millisecond addition
            d.setTime(d.getTime() + map[unit]);
        }
        return d;
    }
    static subtract(date, amount, unit) {
        return this.add(date, -amount, unit);
    }
    static fromNow(date) {
        const d = this.parse(date);
        const diff = Date.now() - d.getTime();
        const mins = Math.floor(diff / 60000);
        if (Math.abs(mins) < 1) {
            return 'just now';
        }
        // Handle future dates roughly
        if (mins < 0) {
            return 'in the future';
        }
        if (mins < 60) {
            return `${mins}m ago`;
        }
        const hours = Math.floor(mins / 60);
        if (hours < 24) {
            return `${hours}h ago`;
        }
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }
    /**
     * Find the closest date in an array of dates
     */
    static getClosestDate(dateToMatch, datesArray) {
        if (!datesArray.length) {
            return null;
        }
        const matchDate = this.parse(dateToMatch).getTime();
        let closestDate = null;
        let closestDist = Infinity;
        // eslint-disable-next-line no-restricted-syntax
        for (const dateStr of datesArray) {
            const currDate = this.parse(dateStr).getTime();
            const dist = Math.abs(currDate - matchDate);
            if (dist < closestDist) {
                closestDist = dist;
                closestDate = dateStr;
            }
            else if (dist === closestDist) {
                // Tie-breaker: Prefer the date that is in the future relative to the matchDate
                // Or if both are same direction, just keep the current one (or implementation defined)
                // Requirement: "Both 17th and 19th have same dist. It should pick 19th"
                if (currDate > matchDate) {
                    closestDate = dateStr;
                }
            }
        }
        return closestDate;
    }
    static getTodayEST() {
        return this.format(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }), 'Y-m-d');
    }
    static getStartOfDay(date) {
        const d = this.parse(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }
    static getStartOfMonth(date) {
        const d = this.parse(date);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
    }
    static getStartOfGrid(date) {
        const d = this.getStartOfMonth(date);
        const dayOfWeek = d.getDay(); // 0 (Sunday) is the start in standard JS
        // Move back to the beginning of the week
        const result = this.parse(d);
        // Subtract days to get to the start of the week (Sunday)
        result.setDate(d.getDate() - dayOfWeek);
        return result;
    }
    static isSameDay(date1, date2) {
        if (!date1 || !date2) {
            return false;
        }
        const d1 = this.parse(date1);
        const d2 = this.parse(date2);
        return (d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate());
    }
    // Helper to check if one date is before another (ignoring time)
    static isBeforeDay(date1, date2) {
        if (!date1 || !date2) {
            return false;
        }
        return this.getStartOfDay(date1).getTime() < this.getStartOfDay(date2).getTime();
    }
    // Helper to check if one date is after another (ignoring time)
    static isAfterDay(date1, date2) {
        if (!date1 || !date2) {
            return false;
        }
        return this.getStartOfDay(date1).getTime() > this.getStartOfDay(date2).getTime();
    }
}
exports.Dates = Dates;
