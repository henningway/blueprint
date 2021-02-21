const helpers = require('./helpers');
const { MissingKeyError } = require('./errors');

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
    constructor(type, key = null) {
        this._type = type;
        this._key = key; // null is *fine* - Blueprint.make will make sure to set the key
        this._modifiers = [];
        return this;
    }

    key(key) {
        this._key = key;
        return this;
    }

    requiresKey() {
        return helpers.empty(this._key);
    }

    get maybe() {
        this._modifiers.push('maybe');
        return this;
    }

    modifiers(modifiers) {
        this._modifiers.push(...modifiers);
        return this;
    }

    convert(value) {
        const caster = this._type instanceof DescriptorFactory ? Descriptor.resolve(this._type)._type : this._type;

        return this._type instanceof DescriptorFactory ? value.map((x) => caster(x)) : caster(value);
    }

    extract(raw) {
        if (!raw.hasOwnProperty(this._key)) {
            if (this._modifiers.includes('maybe')) return null;
            throw new MissingKeyError(this._key);
        }

        return this.convert(raw[this._key]);
    }

    static resolve(descriptor) {
        return descriptor instanceof DescriptorFactory ? descriptor() : descriptor;
    }
}

class DescriptorFactory extends Function {
    constructor(type = null) {
        super();
        this.type = type;
        this.modifiers = [];
        return new Proxy(this, {
            get: (target, prop) => {
                target.modifiers.push(prop);
                return target._call();
            },
            apply: (target, thisArg, args) => target._call(...args)
        });
    }

    _call(...args) {
        // $Many($String, ...)
        if (args[0] instanceof DescriptorFactory) return new Descriptor(...args).modifiers(this.modifiers);

        // $String('title', ...)
        if (this.type) return new Descriptor(this.type, ...args).modifiers(this.modifiers);

        throw new Error("I don' know how to instantiate a descriptor.");
    }
}

const $String = new DescriptorFactory(String);
const $Number = new DescriptorFactory(Number);
const $Boolean = new DescriptorFactory(Boolean);
const $Many = new DescriptorFactory();

module.exports = { Blueprint, $String, $Number, $Boolean, $Many, MissingKeyError };
