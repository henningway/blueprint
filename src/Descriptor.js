import { DescriptorTypeValue, has, Modifier } from './Enum';
import { assert, empty } from './helpers';
import { IllegalModifierError } from './errors';

export default class Descriptor extends Function {
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

                if (has(Modifier, prop)) {
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
