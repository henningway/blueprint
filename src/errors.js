exports.MissingKeyError = class MissingKeyError extends Error {
    constructor(key) {
        super(`The key '${key}' is missing from the object to be converted.`);
        this.name = 'MissingKeyError';
    }
};
