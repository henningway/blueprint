export const MissingKeyError = class extends Error {
    constructor(key, raw) {
        super(`The key '${key}' is missing from the object to be converted: ${JSON.stringify(raw, null, 2)}.`);
        this.name = 'MissingKeyError';
    }
};

export const IllegalModifierError = class extends Error {
    constructor(modifier = null) {
        super(`'${modifier}' is not a valid modifier.`);
        this.name = 'IllegalModifierError';
    }
};

export const BlueprintSpecificationError = class extends Error {
    constructor(type) {
        super(`Blueprint specification contains illegal element of type ${type}.`);
        this.name = 'BlueprintSpecificationError';
    }
};
