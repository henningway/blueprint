import { assert } from './internal';

export class DescriptorType {
    _convertValue;
    _makeNullValue;

    constructor(convertValue, makeNullValue) {
        assert(typeof convertValue === 'function', "Parameter 'convertValue' should be a function.");
        assert(typeof makeNullValue === 'function', "Parameter 'makeNullValue' should be a function.");

        this._convertValue = convertValue;
        this._makeNullValue = makeNullValue;

        this._checkArities();
    }

    _checkArities() {
        assert(this._convertValue.length === 1);
        assert(this._makeNullValue.length === 0);
    }

    convertValue(raw) {
        return this._convertValue(raw);
    }

    makeNullValue() {
        return this._makeNullValue(this._convertValue);
    }
}

export class HigherOrderDescriptorType extends DescriptorType {
    constructor(convertValue, makeNullValue) {
        super(convertValue, makeNullValue);
    }

    _checkArities() {
        assert(this._convertValue.length === 2);
        assert(this._makeNullValue.length === 1);
    }

    convertValue(raw, nested) {
        assert(typeof nested === 'function');

        return this._convertValue(raw, nested);
    }

    makeNullValue(nested) {
        assert(typeof nested.makeNullValue === 'function');

        return this._makeNullValue(nested);
    }
}

export const AnyDescriptorType = new DescriptorType(
    (raw) => raw,
    () => null
);
export const StringDescriptorType = new DescriptorType(
    (raw) => String(raw),
    () => ''
);
export const NumberDescriptorType = new DescriptorType(
    (raw) => Number(raw),
    () => 0
);
export const BooleanDescriptorType = new DescriptorType(
    (raw) => Boolean(raw),
    () => false
);
export const DateDescriptorType = new DescriptorType(
    (raw) => (raw instanceof Date ? raw : new Date(raw)),
    () => new Date('1970-01-01')
);

export const NestedDescriptorType = new HigherOrderDescriptorType(
    (raw, convertValue) => convertValue(raw),
    (nested) => nested.makeNullValue()
);
export const ArrayDescriptorType = new HigherOrderDescriptorType(
    (raw, convertValue) => raw.map(convertValue),
    (nested) => []
);
