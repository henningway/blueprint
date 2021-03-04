import { empty } from './helpers';
import { Extractor } from './Extractor';
import { MissingKey } from './symbols';

export class Blueprint {
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
