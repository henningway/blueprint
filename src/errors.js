exports.MissingKeyError = class extends Error {
    constructor(key) {
        super(`The key '${key}' is missing from the object to be converted.`);
        this.name = 'MissingKeyError';
    }
};

exports.IllegalModifierError = class extends Error {
    constructor(modifier = null) {
        super(`'${modifier}' is not a valid modifier.`);
        this.name = 'IllegalModifierError';
    }
};
