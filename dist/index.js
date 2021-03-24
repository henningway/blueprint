(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Blueprint = {}));
}(this, (function (exports) { 'use strict';

    /**
     * Checks whether a value is empty (null, undefined, '', [], {}).
     *
     * Adapted from https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_isempty
     */
    const empty = function (value) {
        if (['number', 'boolean'].includes(typeof value)) return false;

        return [Object, Array].includes((value || {}).constructor) && !Object.entries(value || {}).length;
    };

    /**
     * Javascript lacks assertions. But it's simple to roll our own.
     *
     * Shamelessly adapted from https://stackoverflow.com/a/15313435
     *
     * @param condition
     * @param message
     */
    const assert = function (condition, message = '') {
        if (!condition) {
            message = ['Assertion failed', message].join(': ');
            if (typeof Error !== 'undefined') {
                throw new Error(message);
            }
            throw message; // Fallback
        }
    };

    const Enum = class {
        constructor(elements = {}) {
            this.elements = elements;

            // proxy enables accessing enum values on the parent object via the elements-array
            // e.g. SomeEnum.someValue will resolve to SomeEnum.elements.someValue
            return new Proxy(this, {
                get(target, prop, receiver) {
                    if (!Reflect.has(target, prop)) {
                        return target.elements[prop];
                    }
                    return Reflect.get(target, prop, receiver);
                }
            });
        }

        has(element) {
            return this.values.includes(element);
        }

        get values() {
            return Object.values(this.elements);
        }
    };

    const Modifier = new Enum({
        MAYBE: 'maybe',
        OPTIONAL: 'optional'
    });

    const MissingKeyOrValue = Symbol('missing key or value');

    const MissingKeyError = class extends Error {
        constructor(key, raw) {
            super(`The key '${key}' is missing from the object to be converted: ${JSON.stringify(raw, null, 2)}.`);
            this.name = 'MissingKeyError';
        }
    };

    const IllegalModifierError = class extends Error {
        constructor(modifier = null) {
            super(`'${modifier}' is not a valid modifier.`);
            this.name = 'IllegalModifierError';
        }
    };

    const BlueprintSpecificationError = class extends Error {
        constructor(type) {
            super(`Blueprint specification contains illegal element of type ${type}.`);
            this.name = 'BlueprintSpecificationError';
        }
    };

    class DescriptorType {
        _convertValue;
        _makeNullValue;

        constructor(convertValue, makeNullValue) {
            assert(typeof convertValue === 'function', "Parameter 'convertValue' should be a function.");
            assert(typeof makeNullValue === 'function', "Parameter 'makeNullValue' should be a function.");

            this._convertValue = convertValue;
            this._makeNullValue = makeNullValue;

            this._checkArities();
        }

        _checkArities() {
            assert(this._convertValue.length === 1);
            assert(this._makeNullValue.length === 0);
        }

        convertValue(raw) {
            return this._convertValue(raw);
        }

        makeNullValue() {
            return this._makeNullValue(this._convertValue);
        }
    }

    class HigherOrderDescriptorType extends DescriptorType {
        constructor(convertValue, makeNullValue) {
            super(convertValue, makeNullValue);
        }

        _checkArities() {
            assert(this._convertValue.length === 2);
            assert(this._makeNullValue.length === 1);
        }

        convertValue(raw, nested) {
            assert(typeof nested === 'function');

            return this._convertValue(raw, nested);
        }

        makeNullValue(nested) {
            assert(typeof nested.makeNullValue === 'function');

            return this._makeNullValue(nested);
        }
    }

    const AnyDescriptorType = new DescriptorType(
        (raw) => raw,
        () => null
    );
    const StringDescriptorType = new DescriptorType(
        (raw) => String(raw),
        () => ''
    );
    const NumberDescriptorType = new DescriptorType(
        (raw) => Number(raw),
        () => 0
    );
    const BooleanDescriptorType = new DescriptorType(
        (raw) => Boolean(raw),
        () => false
    );
    const DateDescriptorType = new DescriptorType(
        (raw) => (raw instanceof Date ? raw : new Date(raw)),
        () => new Date('1970-01-01')
    );

    const NestedDescriptorType = new HigherOrderDescriptorType(
        (raw, convertValue) => convertValue(raw),
        (nested) => nested.makeNullValue()
    );
    const ArrayDescriptorType = new HigherOrderDescriptorType(
        (raw, convertValue) => raw.map(convertValue),
        (nested) => []
    );

    /**
     * Each instance is a characterization of one property of the target object. Does not contain any logic about the actual
     * extraction and conversion of
     */
    class Descriptor {
        type;
        key;
        nested;
        defaultValue;
        mutator;
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
                    set: (proxy) => (this.nested = (raw) => new Extractor(proxy.eject()).extract(raw))
                },
                {
                    condition: (x) => x instanceof Descriptor,
                    set: (descriptor) => (this.nested = (raw) => new Extractor(descriptor).extract(raw))
                },
                {
                    condition: (x) => x instanceof Function,
                    set: (fn) => (this.nested = fn)
                },
                {
                    condition: (x) => x instanceof Blueprint,
                    set: (blueprint) => (this.nested = (raw) => blueprint.make(raw))
                },
                {
                    condition: (x) => typeof x === 'object',
                    set: (specification) => (this.nested = factory(specification))
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

        get hasMutator() {
            return typeof this.mutator === 'function';
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

    class DescriptorProxy extends Function {
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

    class Blueprint {
        constructor(specification = {}) {
            this.specification = specification;
        }

        make(raw = {}) {
            const result = {};
            const makeNullObject = empty(raw);

            Object.entries(this.specification).forEach(([key, specificationValue]) => {
                const extractor = Extractor.fromSpecificationEntry(key, specificationValue);

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

    const blueprint = (specification) => new Blueprint(specification);
    const factory = (specification) => (raw) => blueprint(specification).make(raw);

    /**
     * Knows how to use a descriptor to extract a value from a raw object.
     */
    class Extractor {
        constructor(descriptor) {
            this.descriptor = descriptor instanceof DescriptorProxy ? descriptor.eject() : descriptor;
            return this;
        }

        /**
         * Takes a raw value or object. Unpacks the value to be converted when a key is present. Runs the conversion.
         */
        extract(raw) {
            this.descriptor.checkIsReady();

            if (this.descriptor.hasKey && typeof raw === 'object' && !raw.hasOwnProperty(this.descriptor.key)) {
                if (this.descriptor.hasDefault) return this.descriptor.defaultValue;
                if (this.descriptor.hasModifier(Modifier.MAYBE)) return null;
                if (this.descriptor.hasModifier(Modifier.OPTIONAL)) return MissingKeyOrValue;
                throw new MissingKeyError(this.descriptor.key, raw);
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

            const type = this.descriptor.type;
            // const caster = this.applyMutator(type.convertValue.bind(type));

            if (this.descriptor.type instanceof HigherOrderDescriptorType) return type.convertValue(value, this.descriptor.nested);

            return type.convertValue(value);
        }

        // applyMutator(caster) {
        //     return this.descriptor.hasMutator ? (raw, nested) => caster(this.descriptor.mutator(raw), nested) : caster;
        // }

        makeNullValue() {
            this.descriptor.checkIsReady();

            const value = (() => {
                if (this.descriptor.hasDefault) return this.descriptor.defaultValue;

                if (this.descriptor.type instanceof HigherOrderDescriptorType)
                    this.descriptor.type.makeNullValue(this.descriptor.nested);
                return this.descriptor.type.makeNullValue();
            })();

            return this.convert(value);
        }

        static fromSpecificationEntry(key, specificationValue) {
            const descriptor = Descriptor.fromSpecificationValue(specificationValue).setKey(key);
            return new Extractor(descriptor);
        }
    }

    const $Any = new DescriptorProxy(AnyDescriptorType);
    const $String = new DescriptorProxy(StringDescriptorType);
    const $Number = new DescriptorProxy(NumberDescriptorType);
    const $Boolean = new DescriptorProxy(BooleanDescriptorType);
    const $Date = new DescriptorProxy(DateDescriptorType);
    const $One = new DescriptorProxy(NestedDescriptorType);
    const $Many = new DescriptorProxy(ArrayDescriptorType);

    exports.$Any = $Any;
    exports.$Boolean = $Boolean;
    exports.$Date = $Date;
    exports.$Many = $Many;
    exports.$Number = $Number;
    exports.$One = $One;
    exports.$String = $String;
    exports.AnyDescriptorType = AnyDescriptorType;
    exports.ArrayDescriptorType = ArrayDescriptorType;
    exports.Blueprint = Blueprint;
    exports.BooleanDescriptorType = BooleanDescriptorType;
    exports.DateDescriptorType = DateDescriptorType;
    exports.Descriptor = Descriptor;
    exports.DescriptorProxy = DescriptorProxy;
    exports.Extractor = Extractor;
    exports.IllegalModifierError = IllegalModifierError;
    exports.MissingKeyError = MissingKeyError;
    exports.Modifier = Modifier;
    exports.NestedDescriptorType = NestedDescriptorType;
    exports.NumberDescriptorType = NumberDescriptorType;
    exports.StringDescriptorType = StringDescriptorType;
    exports.blueprint = blueprint;
    exports.factory = factory;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
