import {
    BlueprintSpecificationError,
    DescriptorType,
    MissingKeyOrValue,
    Descriptor,
    Extractor,
    empty
} from './internal';

export class Blueprint {
    constructor(specification = {}) {
        this.specification = specification;
    }

    make(raw = {}) {
        const result = {};
        const makeNullObject = empty(raw);

        Object.entries(this.specification).forEach(([key, descriptor]) => {
            if (!(descriptor instanceof Descriptor)) {
                const type = typeof descriptor;
                if (descriptor instanceof Blueprint || type === 'function' || type === 'object')
                    descriptor = new Descriptor(DescriptorType.NESTED)(descriptor);
                else throw new BlueprintSpecificationError(type);
            }

            const extractor = new Extractor(descriptor.eject().setKey(key));

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

export const blueprint = (specification) => new Blueprint(specification);
export const factory = (specification) => (raw) => blueprint(specification).make(raw);
