import { empty, isPlainObject, Extractor, MissingKeyOrValue } from './internal';

export class Blueprint {
    constructor(specification) {
        this.specification = specification;
    }

    make(raw) {
        if (isPlainObject(this.specification)) return this._makeCompound(raw);

        return this._makeSimple(raw);
    }

    _makeSimple(raw) {
        const makeNullObject = empty(raw);
        const extractor = Extractor.fromSpecification(this.specification);
        const value = makeNullObject ? extractor.makeNullValue() : extractor.extract(raw);
        if (value === MissingKeyOrValue) return;
        return value;
    }

    _makeCompound(raw) {
        const makeNullObject = empty(raw);

        const entries = Object.entries(this.specification)
            .map(([key, specification]) => {
                const extractor = Extractor.fromSpecification(specification, key);
                return [key, makeNullObject ? extractor.makeNullValue() : extractor.extract(raw)];
            })
            .filter(([key, value]) => value !== MissingKeyOrValue);

        return Object.fromEntries(entries);
    }
}

export const blueprint = (specification) => new Blueprint(specification);
export const factory = (specification) => (raw) => blueprint(specification).make(raw);
