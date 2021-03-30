import {
    assert,
    empty,
    factory,
    Blueprint,
    Extractor,
    DescriptorType,
    NestedDescriptorType,
    Modifier,
    IllegalModifierError,
    BlueprintSpecificationError,
    HigherOrderDescriptorType
} from './internal';

/**
 * Each instance is a characterization of one property of the target object. Does not contain any logic about the actual
 * extraction and conversion of
 */
export class Descriptor {
    type;
    key;
    nested;
    defaultValue;
    mutator = (x) => x;
    _modifiers = [];

    constructor(type) {
        this.type = type;

        return new Proxy(this, {
            get(target, prop, receiver) {
                if (Reflect.has(target, prop)) return Reflect.get(target, prop, receiver);

                target._addModifier(prop);
                return receiver;
            }
        });
    }

    // SET
    setKey(key) {
        assert(typeof key === 'string', 'Key should be a string, but it is not.');

        if (empty(this.key)) this.key = key;
        return this;
    }

    trySetNested(value) {
        const attempts = [
            {
                condition: (x) => x instanceof DescriptorProxy,
                set: (proxy) => (this.nested = (raw) => new Extractor(proxy.eject()).extract(raw)) // not a 'true' factory -> does not produce null values!
            },
            {
                condition: (x) => x instanceof Descriptor,
                set: (descriptor) => (this.nested = (raw) => new Extractor(descriptor).extract(raw)) // not a 'true' factory -> does not produce null values!
            },
            {
                condition: (x) => x instanceof Function,
                set: (fn) => (this.nested = fn) // produces null values depending on what is given
            },
            {
                condition: (x) => x instanceof Blueprint,
                set: (blueprint) => (this.nested = (raw) => blueprint.make(raw)) // 'true' factory -> produces null values reliably
            },
            {
                condition: (x) => typeof x === 'object',
                set: (specification) => (this.nested = factory(specification)) // 'true' factory -> produces null values reliably
            }
        ];

        return attempts.some((attempt) => {
            if (attempt.condition(value)) {
                attempt.set(value);
                return true;
            }

            return false;
        });
    }

    default(value) {
        this.defaultValue = value;
        return this;
    }

    setMutator(mutator) {
        assert(typeof mutator === 'function', 'Mutator should be a function, but it is not.');

        this.mutator = mutator;
    }

    _addModifier(modifier) {
        assert(typeof modifier === 'string', 'Modifier is expected to be of type string.');

        if (!Modifier.has(modifier)) throw new IllegalModifierError(modifier);

        this._modifiers.push(modifier);
    }

    // INTERROGATE
    get hasKey() {
        return this.key !== undefined;
    }

    get hasDefault() {
        return this.defaultValue !== undefined;
    }

    hasModifier(modifier) {
        return this._modifiers.includes(modifier);
    }

    // CHECK
    checkIsReady() {
        this._checkType();

        if (this.type instanceof HigherOrderDescriptorType) {
            assert(!empty(this.nested), 'Descriptor has higher order type but is not nested.');
            assert(typeof this.nested === 'function', 'Nested should be wrapped as a function.');
        }
    }

    _checkType() {
        assert(!empty(this.type), 'Descriptor type is not set.');
        assert(this.type instanceof DescriptorType, 'The descriptor type is not valid.');
    }

    // FACTORY
    static fromSpecificationValue(specificationValue) {
        if (specificationValue instanceof Descriptor) return specificationValue;

        if (specificationValue instanceof DescriptorProxy) return specificationValue.eject();

        const descriptor = new Descriptor(NestedDescriptorType);

        if (!descriptor.trySetNested(specificationValue))
            throw new BlueprintSpecificationError(typeof specificationValue);

        return descriptor;
    }
}

export class DescriptorProxy extends Function {
    _type;

    constructor(type) {
        super();

        this._type = type;

        return new Proxy(this, {
            get: (target, prop, receiver) => {
                return target._get(target, prop, receiver);
            },
            apply: (target, thisArg, args) => {
                return target._call(...args);
            }
        });
    }

    _get(target, prop, receiver) {
        if (Reflect.has(target, prop)) return Reflect.get(target, prop, receiver);

        if (Modifier.has(prop)) {
            const descriptor = target.eject();
            descriptor._addModifier(prop);

            return descriptor;
        }

        if (prop === 'default') {
            const descriptor = target.eject();

            return (value) => {
                descriptor.default(value);
                return descriptor;
            };
        }

        if (typeof prop === 'string') throw new IllegalModifierError(prop);
    }

    _call(...args) {
        const descriptor = this.eject();

        if (args.length < 1) return descriptor;

        if (descriptor.type instanceof HigherOrderDescriptorType) {
            if (!descriptor.trySetNested(args.shift())) throw new BlueprintSpecificationError();
        }

        if (args.length < 1) return descriptor;
        descriptor.setKey(args.shift());

        if (args.length < 1) return descriptor;
        descriptor.setMutator(args.shift());

        return descriptor;
    }

    eject() {
        return new Descriptor(this._type);
    }
}

export function CustomDescriptor(name, convert, makeNullValue) {
    return new DescriptorProxy(new DescriptorType(name, convert, makeNullValue));
}

export function CustomHigherOrderDescriptor(name, convert, makeNullValue) {
    return new DescriptorProxy(new HigherOrderDescriptorType(name, convert, makeNullValue));
}
