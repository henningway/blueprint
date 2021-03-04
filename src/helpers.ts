/**
 * Checks whether a value is empty (null, undefined, '', [], {}).
 *
 * Adapted from https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_isempty
 */
export const empty = function (value: any) {
    if (['number', 'boolean'].includes(typeof value)) return false;

    return [Object, Array].includes((value || {}).constructor) && !Object.entries(value || {}).length;
};

/**
 * Javascript lacks assertions. But it's simple to roll our own.
 *
 * Shamelessly adapted from https://stackoverflow.com/a/15313435
 *
 * @param condition
 * @param message
 */
export const assert = function (condition: boolean, message: string = '') {
    if (!condition) {
        message = ['Assertion failed', message].join(': ');
        if (typeof Error !== 'undefined') {
            throw new Error(message);
        }
        throw message; // Fallback
    }
};
