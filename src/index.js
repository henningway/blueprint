const helpers = require('./helpers');

class Blueprint {
    constructor(specification = {}) {
        this.specification = specification;
    }

    make(raw) {
        const result = {};

        Object.entries(this.specification).forEach(([key, descriptor]) => {
            descriptor = Descriptor.resolve(descriptor);
            if (descriptor.requiresKey()) descriptor.key(key);
            result[key] = descriptor.extract(raw);
        });

        return result;
    }
}

class Descriptor {
    constructor() {
        this._type = null; // this should be set at some point
        this._key = null; // null is *fine* - Blueprint.make will make sure to set the key
        this._compound = false;
        return this;
    }

    type(type) {
        this._type = type;
        return this;
    }

    key(key) {
        this._key = key;
        return this;
    }

    requiresKey() {
        return helpers.empty(this._key);
    }

    compound(type) {
        this._type = type;
        this._compound = true;
        return this;
    }

    convert(value) {
        const caster = this._compound ? Descriptor.resolve(this._type)._type : this._type;

        return this._compound ? value.map((x) => caster(x)) : caster(value);
    }

    extract(raw) {
        return this.convert(raw[this._key]);
    }

    static resolve(descriptor) {
        const isResolved = descriptor instanceof Descriptor;
        return isResolved ? descriptor : descriptor();
    }
}

const $String = (key) => new Descriptor().type(String).key(key);
const $Number = (key) => new Descriptor().type(Number).key(key);
const $Boolean = (key) => new Descriptor().type(Boolean).key(key);
const $Many = (containedDescriptor, key) => new Descriptor().compound(containedDescriptor).key(key);

module.exports = { Blueprint, $String, $Number, $Boolean, $Many };
