export const MissingKeyError = class MissingKeyError extends Error {
    constructor(key: string) {
        super(`The key '${key}' is missing from the object to be converted.`);
        this.name = 'MissingKeyError';

        Object.setPrototypeOf(this, MissingKeyError.prototype);
    }
};

export const IllegalModifierError = class IllegalModifierError extends Error {
    constructor(modifier: string) {
        super(`'${modifier}' is not a valid modifier.`);
        this.name = 'IllegalModifierError';

        Object.setPrototypeOf(this, IllegalModifierError.prototype);
    }
};
