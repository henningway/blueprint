import { assert } from './internal';

export class DescriptorType {
    _convert;
    _makeNullValue;

    constructor(convert, makeNullValue) {
        assert(typeof convert === 'function', "Parameter 'convert' should be a function.");
        assert(typeof makeNullValue === 'function', "Parameter 'makeNullValue' should be a function.");

        this._convert = convert;
        this._makeNullValue = makeNullValue;

        this._checkArities();
    }

    _checkArities() {
        assert(this._convert.length === 2);
        assert(this._makeNullValue.length === 0);
    }

    convert(raw, mutator = (x) => x) {
        return this._convert(raw, mutator);
    }

    makeNullValue() {
        return this._makeNullValue(this._convert);
    }
}

export class HigherOrderDescriptorType extends DescriptorType {
    constructor(convert, makeNullValue) {
        super(convert, makeNullValue);
    }

    _checkArities() {
        assert(this._convert.length === 3);
        assert(this._makeNullValue.length === 1);
    }

    convert(nested, raw, mutator = (x) => x) {
        assert(typeof nested === 'function');
        assert(typeof mutator === 'function');

        return this._convert(nested, raw, mutator);
    }

    makeNullValue(nested) {
        assert(typeof nested.makeNullValue === 'function');

        return this._makeNullValue(nested);
    }
}

export const AnyDescriptorType = new DescriptorType(
    (raw, mutator) => mutator(raw),
    () => null
);
export const StringDescriptorType = new DescriptorType(
    (raw, mutator) => String(mutator(raw)),
    () => ''
);
export const NumberDescriptorType = new DescriptorType(
    (raw, mutator) => Number(mutator(raw)),
    () => 0
);
export const BooleanDescriptorType = new DescriptorType(
    (raw, mutator) => Boolean(mutator(raw)),
    () => false
);
export const DateDescriptorType = new DescriptorType(
    (raw, mutator) => (raw instanceof Date ? mutator(raw) : new Date(mutator(raw))),
    () => new Date('1970-01-01')
);

export const NestedDescriptorType = new HigherOrderDescriptorType(
    (convert, raw, mutator) => convert(mutator(raw)),
    (nested) => nested.makeNullValue()
);
export const ArrayDescriptorType = new HigherOrderDescriptorType(
    (convert, raw, mutator) => raw.map((x) => convert(mutator(x))),
    (nested) => []
);
