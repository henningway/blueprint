export class DescriptorType {
    constructor(caster, makeNullValue) {
        this._caster = caster;
        this._makeNullValue = makeNullValue;
    }

    get caster() {
        return this._caster;
    }

    get makeNullValue() {
        return this._makeNullValue;
    }
}

export class HigherOrderDescriptorType extends DescriptorType {
    constructor(caster, makeNullValue) {
        super(caster, makeNullValue);
    }
}

export const AnyDescriptorType = new DescriptorType(
    (raw) => raw,
    (caster) => null
);
export const StringDescriptorType = new DescriptorType(
    (raw) => String(raw),
    (caster) => ''
);
export const NumberDescriptorType = new DescriptorType(
    (raw) => Number(raw),
    (caster) => 0
);
export const BooleanDescriptorType = new DescriptorType(
    (raw) => Boolean(raw),
    (caster) => false
);
export const DateDescriptorType = new DescriptorType(
    (raw) => (raw instanceof Date ? raw : new Date(raw)),
    (caster) => caster('1970-01-01')
);
export const NestedDescriptorType = new HigherOrderDescriptorType(
    (raw, nested) => nested(raw),
    (caster, nested) => caster({}, nested)
);
export const ArrayDescriptorType = new HigherOrderDescriptorType(
    (raw, nested) => raw.map(nested),
    (caster, nested) => []
);
