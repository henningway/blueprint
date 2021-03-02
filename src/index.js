const { Enum, empty, assert } = require('./helpers');
const { MissingKeyError, IllegalModifierError } = require('./errors');

const MissingKey = Symbol('missing key');

const Modifier = new Enum({
    MAYBE: 'maybe',
    OPTIONAL: 'optional'
});

// @TODO rename (too clunky)
const DescriptorTypeValue = new Enum({
    ARRAY: 'array',
    FACTORY: 'factory',
    PRIMITIVE: 'primitive'
});

class Blueprint {
    constructor(specification = {}) {
        this.specification = specification;
    }

    make(raw = {}) {
        const result = {};
        const makeNullObject = empty(raw);

        Object.entries(this.specification).forEach(([key, descriptor]) => {
            descriptor = descriptor.eject();
            descriptor.setKey(key);
            const extractor = new Extractor(descriptor);

            if (makeNullObject) {
                result[key] = extractor.makeNullValue();
                return;
            }

            const value = extractor.extract(raw);
            if (value !== MissingKey) result[key] = extractor.extract(raw);
        });

        return result;
    }
}

/**
 * Knows how to use a descriptor to extract a value from a raw object.
 */
class Extractor {
    constructor(descriptor) {
        this.descriptor = descriptor.eject();
        return this;
    }

    /**
     * Takes a raw value or object. Unpacks the value to be converted when a key is present. Runs the conversion.
     */
    extract(raw) {
        this.descriptor.checkIsReady();

        if (typeof raw === 'object' && !raw.hasOwnProperty(this.descriptor.key)) {
            if (this.descriptor.hasModifier(Modifier.MAYBE)) return null;
            if (this.descriptor.hasModifier(Modifier.OPTIONAL)) return MissingKey;
            throw new MissingKeyError(this.descriptor.key);
        }

        return this.convert(this.descriptor.hasKey ? raw[this.descriptor.key] : raw);
    }

    /**
     * Converts a value according to descriptor. Applies mutator when applicable.
     */
    convert(value) {
        const caster = this.applyMutator(this.caster);

        return this.descriptor.descriptorTypeValue === DescriptorTypeValue.ARRAY ||
            this.descriptor.descriptorTypeValue === DescriptorTypeValue.FACTORY
            ? value.map((x) => caster(x))
            : caster(value);
    }

    get caster() {
        if (this.descriptor.descriptorTypeValue === DescriptorTypeValue.ARRAY)
            return (raw) => new Extractor(this.descriptor.type).extract(raw);

        return this.descriptor.type;
    }

    applyMutator(caster) {
        return this.descriptor.hasMutator ? (raw) => caster(this.descriptor.mutator(raw)) : caster;
    }

    makeNullValue() {
        return this.convert(this.descriptor.descriptorTypeValue === DescriptorTypeValue.ARRAY ? [] : '');
    }
}

class Descriptor extends Function {
    constructor(type = null, ejected = false) {
        super();
        this.type = type;
        this.key = null;
        this.mutator = null;
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

                if (typeof prop === 'string') throw new IllegalModifierError(prop);
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
        if (args.length > 0 && (args[0] instanceof Descriptor || args[0] instanceof Function))
            this.setType(args.shift());

        if (args.length > 0) this.setKey(args.shift());
        if (args.length > 0) this.setMutator(args.shift());

        return this;
    }

    setType(type) {
        this.type = type;
        this.checkType();
        return this;
    }

    setKey(key) {
        assert(typeof key === 'string', `Key should be a string, but it is not.`);

        if (empty(this.key)) this.key = key;
        return this;
    }

    setMutator(mutator) {
        assert(typeof mutator === 'function', `Mutator should be a function, but it is not.`);

        this.mutator = mutator;
        return this;
    }

    addModifier(modifiers) {
        this.modifiers.push(modifiers);
    }

    checkType() {
        assert(!empty(this.type), 'Descriptor type is not set.');
        assert(this.descriptorTypeValue !== null, `The type of the descriptor is not valid.`);
    }

    get hasKey() {
        return this.key !== null;
    }

    hasModifier(modifier) {
        return this.modifiers.includes(modifier);
    }

    get descriptorTypeValue() {
        if ([String, Boolean, Number].includes(this.type)) return DescriptorTypeValue.PRIMITIVE;
        if (this.type instanceof Descriptor) return DescriptorTypeValue.ARRAY;
        if (this.type instanceof Function) return DescriptorTypeValue.FACTORY;
        return null;
    }

    get hasMutator() {
        return typeof this.mutator === 'function';
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

// @TODO use everywhere instead of new Blueprint()
const blueprint = (specification) => new Blueprint(specification);
const factory = (specification) => (raw) => blueprint(specification).make(raw);

module.exports = {
    Blueprint,
    blueprint,
    factory,
    $String,
    $Number,
    $Boolean,
    $Many,
    MissingKeyError,
    IllegalModifierError
};
