import {
    Descriptor,
    DescriptorProxy,
    HigherOrderDescriptorType,
    MissingKeyError,
    MissingKeyOrValue,
    Modifier
} from './internal';

/**
 * Knows how to use a descriptor to extract a value from a raw object.
 */
// @TODO support .cast modifier
export class Extractor {
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
     * Converts a value according to descriptor. Applies mutators when applicable.
     */
    convert(value) {
        if (this.descriptor.omitWhenPredicate(value)) {
            return MissingKeyOrValue;
        }

        if ([null, undefined].includes(value)) {
            if (this.descriptor.hasModifier(Modifier.MAYBE)) return null;
            if (this.descriptor.hasModifier(Modifier.OPTIONAL)) return MissingKeyOrValue;
        }

        const type = this.descriptor.type;

        value = this.descriptor.beforeMutator(value);

        type.validate(value);

        let convert = type.convert.bind(type);

        const result =
            this.descriptor.type instanceof HigherOrderDescriptorType
                ? convert(this.descriptor.nested, value)
                : convert(value);

        return this.descriptor.afterMutator(result);
    }

    makeNullValue() {
        this.descriptor.checkIsReady();

        if (this.descriptor.hasModifier(Modifier.MAYBE)) return null;
        if (this.descriptor.hasModifier(Modifier.OPTIONAL)) return MissingKeyOrValue;

        const value = (() => {
            if (this.descriptor.hasDefault) return this.descriptor.defaultValue;

            if (this.descriptor.type instanceof HigherOrderDescriptorType)
                return this.descriptor.type.makeNullValue(this.descriptor.nested);
            return this.descriptor.type.makeNullValue();
        })();

        return this.convert(value);
    }

    static fromSpecification(specification, key = null) {
        const descriptor = Descriptor.fromSpecification(specification);
        if (key) descriptor.setKey(key);
        return new Extractor(descriptor);
    }
}
