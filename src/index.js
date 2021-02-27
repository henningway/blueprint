const { Enum, empty, assert } = require('./helpers');
const { MissingKeyError } = require('./errors');

const Modifier = new Enum({
    MAYBE: 'maybe'
});

class Blueprint {
    constructor(specification = {}) {
        this.specification = specification;
    }

    make(raw) {
        const result = {};

        Object.entries(this.specification).forEach(([key, descriptor]) => {
            descriptor = descriptor.eject();
            descriptor.setKey(key);
            const extractor = new Extractor(descriptor, key);
            result[key] = extractor.extract(raw);
        });

        return result;
    }
}

class Extractor {
    constructor(descriptor) {
        this.descriptor = descriptor.eject();
        return this;
    }

    convert(value) {
        let caster;

        if (this.descriptor.isHigherOrder) {
            const extractor = new Extractor(this.descriptor.type);
            caster = (raw) => extractor.extract(raw);
        } else {
            caster = this.descriptor.type;
        }

        return this.descriptor.isHigherOrder ? value.map((x) => caster(x)) : caster(value);
    }

    extract(raw) {
        this.descriptor.checkIsReady();

        if (typeof raw === 'object' && !raw.hasOwnProperty(this.descriptor.key)) {
            if (this.descriptor.hasModifier(Modifier.MAYBE)) return null;
            throw new MissingKeyError(this.descriptor.key);
        }

        return this.convert(this.descriptor.hasKey ? raw[this.descriptor.key] : raw);
    }
}

class Descriptor extends Function {
    constructor(type = null, ejected = false) {
        super();
        this.type = type;
        this.key = null;
        this.ejected = ejected;
        this.modifiers = [];

        return new Proxy(this, {
            get: (target, prop, receiver) => {
                if (Reflect.has(target, prop)) return Reflect.get(target, prop, receiver);

                if (Modifier.has(prop)) {
                    target = target.eject();
                    target.addModifier(prop);
                    return target;
                }
            },
            apply: (target, thisArg, args) => {
                target = target.eject();
                return target.call(...args);
            }
        });
    }

    // when Descriptor is called as a function, examples: $String(...), $Many(...), etc.
    call(...args) {
        // nesting of descriptors, example: $Many($String, ...)
        if (args[0] instanceof Descriptor) this.setType(args.shift());

        this.setKey(args.shift());

        return this;
    }

    setType(type) {
        this.type = type;
        this.checkType();
        return this;
    }

    setKey(key) {
        if (empty(this.key)) this.key = key;

        return this;
    }

    addModifier(modifiers) {
        this.modifiers.push(modifiers);
    }

    checkType() {
        assert(!empty(this.type), 'Descriptor type is not set.');
        assert(
            [String, Boolean, Number].includes(this.type) || this.type instanceof Descriptor,
            `${this.type} is not a valid blueprint descriptor.`
        );
    }

    get hasKey() {
        return this.key !== null;
    }

    hasModifier(modifier) {
        return this.modifiers.includes(modifier);
    }

    get isHigherOrder() {
        return this.type instanceof Descriptor;
    }

    checkIsReady() {
        assert(this.ejected, `Descriptor has not been ejected.`);
        this.checkType();
    }

    /**
     * Vanilla descriptors like $String or $Number might be incomplete and require attributes to be set from inside the
     * library (example: key). If we set these attributes just like this, we pollute the public object, which is why we
     * have to create a new instance.
     */
    eject() {
        if (!this.ejected) return new Descriptor(this.type, true);

        return this;
    }
}

const $String = new Descriptor(String);
const $Number = new Descriptor(Number);
const $Boolean = new Descriptor(Boolean);
const $Many = new Descriptor();

module.exports = { Blueprint, $String, $Number, $Boolean, $Many, MissingKeyError };
