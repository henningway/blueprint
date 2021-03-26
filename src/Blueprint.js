import { MissingKeyOrValue, Extractor, empty } from './internal';

export class Blueprint {
    constructor(specification = {}) {
        this.specification = specification;
    }

    make(raw = {}) {
        const result = {};
        const makeNullObject = empty(raw);

        Object.entries(this.specification).forEach(([key, specificationValue]) => {
            const extractor = Extractor.fromSpecificationEntry(key, specificationValue);

            const value = makeNullObject ? extractor.makeNullValue() : extractor.extract(raw);

            if (value !== MissingKeyOrValue) result[key] = value;
        });

        return result;
    }
}

export const blueprint = (specification) => new Blueprint(specification);
export const factory = (specification) => (raw) => blueprint(specification).make(raw);
