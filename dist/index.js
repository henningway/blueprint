(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined'
        ? factory(exports)
        : typeof define === 'function' && define.amd
        ? define(['exports'], factory)
        : ((global = typeof globalThis !== 'undefined' ? globalThis : global || self),
          factory((global.Blueprint = {})));
})(this, function (exports) {
    'use strict';

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

    const MissingKeyError = class extends Error {
        constructor(key) {
            super(`The key '${key}' is missing from the object to be converted.`);
            this.name = 'MissingKeyError';
        }
    };

    const IllegalModifierError = class extends Error {
        constructor(modifier = null) {
            super(`'${modifier}' is not a valid modifier.`);
            this.name = 'IllegalModifierError';
        }
    };

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

    const blueprint = (specification) => new Blueprint(specification);
    const factory = (specification) => (raw) => blueprint(specification).make(raw);

    exports.$Boolean = $Boolean;
    exports.$Many = $Many;
    exports.$Number = $Number;
    exports.$String = $String;
    exports.Blueprint = Blueprint;
    exports.IllegalModifierError = IllegalModifierError;
    exports.MissingKeyError = MissingKeyError;
    exports.blueprint = blueprint;
    exports.factory = factory;

    Object.defineProperty(exports, '__esModule', { value: true });
});
