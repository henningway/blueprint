import { CasterType, DescriptorType, MissingKeyError, MissingKeyOrValue, Modifier } from './internal';

/**
 * Knows how to use a descriptor to extract a value from a raw object.
 */
export class Extractor {
    constructor(descriptor) {
        this.descriptor = descriptor.eject();
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
                case DescriptorType.DATE:
                    return new Date('1970-01-01');
                default:
                    return '';
            }
        })();

        return this.convert(value);
    }
}
