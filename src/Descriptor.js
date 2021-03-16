import {
    assert,
    Blueprint,
    factory,
    CasterType,
    DescriptorType,
    empty,
    IllegalModifierError,
    Modifier
} from './internal';

export class Descriptor extends Function {
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
            case DescriptorType.DATE:
                this.caster = (value) => (value instanceof Date ? value : new Date(value));
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
        if ([String, Number, Boolean, Date].includes(this.caster)) return CasterType.PRIMITIVE;
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
