import { MissingKeyError } from './errors';
import { MissingKey } from './symbols';
import { DescriptorTypeValue, Modifier } from './Enum';

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
