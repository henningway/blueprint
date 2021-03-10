import { Enum, empty, assert } from './helpers';
import { MissingKeyError, IllegalModifierError, BlueprintSpecificationError } from './errors';

const MissingKeyOrValue = Symbol('missing key or value');

const Modifier = new Enum({
    MAYBE: 'maybe',
    OPTIONAL: 'optional'
});

const DescriptorType = new Enum({
    ANY: 'ANY', // CasterType.FACTORY (identity function)
    STRING: 'STRING', // CasterType.PRIMITIVE
    NUMBER: 'NUMBER', // CasterType.PRIMITIVE
    BOOLEAN: 'BOOLEAN', // CasterType.PRIMITIVE
    NESTED: 'NESTED', // CasterType.DESCRIPTOR || CasterType.FACTORY
    ARRAY: 'ARRAY' // CasterType.DESCRIPTOR || CasterType.FACTORY
});

const CasterType = new Enum({
    PASS_THROUGH: 'PASS_THROUGH',
    PRIMITIVE: 'PRIMITIVE',
    DESCRIPTOR: 'DESCRIPTOR',
    FACTORY: 'FACTORY'
});

class Blueprint {
    constructor(specification = {}) {
        this.specification = specification;
    }

    make(raw = {}) {
        const result = {};
        const makeNullObject = empty(raw);

        Object.entries(this.specification).forEach(([key, descriptor]) => {
            if (!(descriptor instanceof Descriptor)) {
                const type = typeof descriptor;
                if (descriptor instanceof Blueprint || type === 'function' || type === 'object')
                    descriptor = new Descriptor(DescriptorType.NESTED)(descriptor);
                else throw new BlueprintSpecificationError(type);
            }

            const extractor = new Extractor(descriptor.eject().setKey(key));

            if (makeNullObject) {
                result[key] = extractor.makeNullValue();
                return;
            }

            const value = extractor.extract(raw);
            if (value !== MissingKeyOrValue) result[key] = value;
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
            if (this.descriptor.hasDefault) return this.descriptor.defaultValue;
            if (this.descriptor.hasModifier(Modifier.MAYBE)) return null;
            if (this.descriptor.hasModifier(Modifier.OPTIONAL)) return MissingKeyOrValue;
            throw new MissingKeyError(this.descriptor.key);
        }

        return this.convert(this.descriptor.hasKey ? raw[this.descriptor.key] : raw);
    }

    /**
     * Converts a value according to descriptor. Applies mutator when applicable.
     */
    convert(value) {
        if ([null, undefined].includes(value)) {
            if (this.descriptor.hasModifier(Modifier.MAYBE)) return null;
            if (this.descriptor.hasModifier(Modifier.OPTIONAL)) return MissingKeyOrValue;
        }

        const caster = this.applyMutator(this.caster);

        return this.descriptor.type === DescriptorType.ARRAY ? value.map((x) => caster(x)) : caster(value);
    }

    get caster() {
        if (this.descriptor.casterType === CasterType.DESCRIPTOR)
            return (raw) => new Extractor(this.descriptor.caster).extract(raw);

        // both CasterType.PRIMITIVE and CasterType.FACTORY are meant to be callable just like that
        return this.descriptor.caster;
    }

    applyMutator(caster) {
        return this.descriptor.hasMutator ? (raw) => caster(this.descriptor.mutator(raw)) : caster;
    }

    makeNullValue() {
        const value = (() => {
            if (this.descriptor.hasDefault) return this.descriptor.defaultValue;

            switch (this.descriptor.type) {
                case DescriptorType.ARRAY:
                    return [];
                case DescriptorType.ANY:
                    return null;
                default:
                    return '';
            }
        })();

        return this.convert(value);
    }
}

class Descriptor extends Function {
    constructor(type, defaultValue = undefined, ejected = false) {
        super();

        this.type = type;
        this.defaultValue = defaultValue;
        this.ejected = ejected;

        this.key = null;
        this.caster = null;
        this.mutator = null;
        this.modifiers = [];

        switch (type) {
            case DescriptorType.ANY:
                this.caster = (x) => x;
                break;
            case DescriptorType.STRING:
                this.caster = String;
                break;
            case DescriptorType.NUMBER:
                this.caster = Number;
                break;
            case DescriptorType.BOOLEAN:
                this.caster = Boolean;
                break;
        }

        return new Proxy(this, {
            get: (target, prop, receiver) => {
                if (Reflect.has(target, prop)) return Reflect.get(target, prop, receiver);

                if (Modifier.has(prop)) {
                    target = target.eject();
                    target.addModifier(prop);
                    return target;
                }

                if (prop === 'default') {
                    target = target.eject();
                    return (value) => {
                        target.defaultValue = value;
                        return target;
                    };
                }

                if (typeof prop === 'string') throw new IllegalModifierError(prop);
            },
            apply: (target, thisArg, args) => {
                if (target.ejected) return Reflect.apply(target, thisArg, args);

                target = target.eject();
                return target.call(...args);
            }
        });
    }

    // when Descriptor is called as a function, examples: $String(...), $Many(...), etc.
    call(...args) {
        // nesting of descriptors, example: $Many($String, ...)
        if (args.length > 0) {
            if (args[0] instanceof Descriptor) this.setCaster(args.shift());
            else if (args[0] instanceof Function) this.setCaster(args.shift());
            else if (args[0] instanceof Blueprint) {
                const blueprint = args.shift();

                this.setCaster((raw) => blueprint.make(raw));
            } else if (typeof args[0] === 'object') this.setCaster(factory(args.shift()));
        }

        if (args.length > 0) this.setKey(args.shift());
        if (args.length > 0) this.setMutator(args.shift());

        return this;
    }

    setCaster(caster) {
        this.caster = caster;
        this.checkCaster();
        return this;
    }

    setKey(key) {
        assert(typeof key === 'string', 'Key should be a string, but it is not.');

        if (empty(this.key)) this.key = key;
        return this;
    }

    setMutator(mutator) {
        assert(typeof mutator === 'function', 'Mutator should be a function, but it is not.');

        this.mutator = mutator;
        return this;
    }

    addModifier(modifiers) {
        this.modifiers.push(modifiers);
    }

    checkType() {
        assert(!empty(this.type), 'Descriptor type is not set.');
        assert(DescriptorType.has(this.type), 'The descriptor type is not valid.');
    }

    checkCaster() {
        assert(!empty(this.caster), 'Caster is not set.');
        assert(CasterType.has(this.casterType), 'The caster is not valid.');
    }

    get hasKey() {
        return this.key !== null;
    }

    hasModifier(modifier) {
        return this.modifiers.includes(modifier);
    }

    get casterType() {
        if ([String, Boolean, Number].includes(this.caster)) return CasterType.PRIMITIVE;
        if (this.caster instanceof Descriptor) return CasterType.DESCRIPTOR;
        if (this.caster instanceof Function) return CasterType.FACTORY;
        throw new Error('Caster is not set.');
    }

    get hasMutator() {
        return typeof this.mutator === 'function';
    }

    checkIsReady() {
        assert(this.ejected, 'Descriptor has not been ejected.');
        this.checkType();
        this.checkCaster();
    }

    get hasDefault() {
        return this.defaultValue !== undefined;
    }

    /**
     * Vanilla descriptors like $String or $Number might be incomplete and require attributes to be set from inside the
     * library (example: key). If we set these attributes just like this, we pollute the public object, which is why we
     * have to create a new instance.
     */
    eject() {
        if (!this.ejected) return new Descriptor(this.type, this.defaultValue, true);

        return this;
    }
}

const $Any = new Descriptor(DescriptorType.ANY);
const $String = new Descriptor(DescriptorType.STRING);
const $Number = new Descriptor(DescriptorType.NUMBER);
const $Boolean = new Descriptor(DescriptorType.BOOLEAN);
const $One = new Descriptor(DescriptorType.NESTED);
const $Many = new Descriptor(DescriptorType.ARRAY);

const blueprint = (specification) => new Blueprint(specification);
const factory = (specification) => (raw) => blueprint(specification).make(raw);

export {
    Blueprint,
    blueprint,
    factory,
    $Any,
    $String,
    $Number,
    $Boolean,
    $One,
    $Many,
    MissingKeyError,
    IllegalModifierError
};
