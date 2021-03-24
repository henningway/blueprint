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
            super(`The key '${key}' is missing from the object to be converted: ${JSON.stringify(raw,null,2)}.`);
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
        constructor(caster, makeNullValue) {
            this._caster = caster;
            this._makeNullValue = makeNullValue;
        }

        get caster() {
            return this._caster;
        }

        get makeNullValue() {
            return this._makeNullValue;
        }
    }

    class HigherOrderDescriptorType extends DescriptorType {
        constructor(caster, makeNullValue) {
            super(caster, makeNullValue);
        }
    }

    const AnyDescriptorType = new DescriptorType(
        (raw) => raw,
        (caster) => null
    );
    const StringDescriptorType = new DescriptorType(
        (raw) => String(raw),
        (caster) => ''
    );
    const NumberDescriptorType = new DescriptorType(
        (raw) => Number(raw),
        (caster) => 0
    );
    const BooleanDescriptorType = new DescriptorType(
        (raw) => Boolean(raw),
        (caster) => false
    );
    const DateDescriptorType = new DescriptorType(
        (raw) => (raw instanceof Date ? raw : new Date(raw)),
        (caster) => caster('1970-01-01')
    );
    const NestedDescriptorType = new HigherOrderDescriptorType(
        (raw, nested) => nested(raw),
        (caster, nested) => caster({}, nested)
    );
    const ArrayDescriptorType = new HigherOrderDescriptorType(
        (raw, nested) => raw.map(nested),
        (caster, nested) => []
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
        _modifiers = [];

        constructor(type) {
            this.type = type;
        }

        // SET
        setKey(key) {
            assert(typeof key === 'string', 'Key should be a string, but it is not.');

            if (empty(this.key)) this.key = key;
            return this;
        }

        trySetNested(value) {
            //(raw) => new Extractor(this.descriptor.caster).extract(raw)
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

            return attempts.some((attempt, index) => {
                if (attempt.condition(value)) {
                    attempt.set(value);
                    return true;
                }

                return false;
            });
        }

        setDefault(value) {
            this.defaultValue = value;
            return this;
        }

        setMutator(mutator) {
            assert(typeof mutator === 'function', 'Mutator should be a function, but it is not.');

            this.mutator = mutator;
        }

        _addModifier(modifiers) {
            this._modifiers.push(modifiers);
        }

        // INTERROGATE
        get hasKey() {
            return this.key !== null;
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
        _descriptor;

        constructor(type) {
            super();

            this._descriptor = new Descriptor(type);

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
                this._descriptor = target.eject();
                this._descriptor._addModifier(prop);

                return this;
            }

            if (prop === 'default') {
                this._descriptor = target.eject();
                return (value) => {
                    this._descriptor.setDefault(value);
                    return this;
                };
            }

            if (typeof prop === 'string') throw new IllegalModifierError(prop);
        }

        _call(...args) {
            if (args.length > 0) {
                if (this._descriptor.trySetNested(args[0])) args.shift();
            }

            if (args.length > 0) this._descriptor.setKey(args.shift());
            if (args.length > 0) this._descriptor.setMutator(args.shift());

            return this;
        }

        eject() {
            return this._descriptor;
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

            const caster = this.applyMutator(this.descriptor.type.caster);

            if (this.descriptor.type instanceof HigherOrderDescriptorType) return caster(value, this.descriptor.nested);

            return caster(value);
        }

        applyMutator(caster) {
            return this.descriptor.hasMutator ? (raw, nested) => caster(this.descriptor.mutator(raw), nested) : caster;
        }

        makeNullValue() {
            this.descriptor.checkIsReady();

            const value = (() => {
                if (this.descriptor.hasDefault) return this.descriptor.defaultValue;

                if (this.descriptor.type instanceof HigherOrderDescriptorType) this.descriptor.type.makeNullValue(this.descriptor.type.caster, this.descriptor.nested);
                return this.descriptor.type.makeNullValue(this.descriptor.type.caster);
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
    exports.Blueprint = Blueprint;
    exports.IllegalModifierError = IllegalModifierError;
    exports.MissingKeyError = MissingKeyError;
    exports.blueprint = blueprint;
    exports.factory = factory;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
