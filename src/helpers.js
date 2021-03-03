/**
 * Checks whether a value is empty (null, undefined, '', [], {}).
 *
 * Adapted from https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_isempty
 */
export const empty = function (value) {
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
export const assert = function (condition, message = '') {
    if (!condition) {
        message = ['Assertion failed', message].join(': ');
        if (typeof Error !== 'undefined') {
            throw new Error(message);
        }
        throw message; // Fallback
    }
};

export const Enum = class {
    constructor(elements = {}) {
        this.elements = elements;

        // proxy enables accessing enum values on the parent object via the elements-array
        // e.g. SomeEnum.someValue will resolve to SomeEnum.elements.someValue
        return new Proxy(this, {
            get(target, prop, receiver) {
                if (!Reflect.has(target, prop)) {
                    return target.elements[prop];
                }
                return Reflect.get(target, prop, receiver);
            }
        });
    }

    has(element) {
        return this.values.includes(element);
    }

    get values() {
        return Object.values(this.elements);
    }
};
