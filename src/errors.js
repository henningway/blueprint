exports.MissingKeyError = class MissingKeyError extends Error {
    constructor(key) {
        super(`The key '${key}' is missing from the object to be converted.`);
        this.name = 'MissingKeyError';
    }
};

// @TODO make use of
exports.IllegalModifierError = class IllegalModifierError extends Error {
    constructor(modifier) {
        super(`'${modifier}' is not a valid modifier.`);
        this.name = 'IllegalModifierError';
    }
};
