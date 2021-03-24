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
     * Converts a value according to descriptor. Applies mutator when applicable.
     */
    convert(value) {
        if ([null, undefined].includes(value)) {
            if (this.descriptor.hasModifier(Modifier.MAYBE)) return null;
            if (this.descriptor.hasModifier(Modifier.OPTIONAL)) return MissingKeyOrValue;
        }

        const type = this.descriptor.type;
        // const caster = this.applyMutator(type.convertValue.bind(type));

        if (this.descriptor.type instanceof HigherOrderDescriptorType)
            return type.convertValue(value, this.descriptor.nested);

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
