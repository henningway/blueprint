import { assert } from './internal';

export class DescriptorType {
    _name;
    _convert;
    _makeNullValue;

    constructor(convert, makeNullValue, name = '') {
        assert(typeof convert === 'function', "Parameter 'convert' should be a function.");
        assert(typeof makeNullValue === 'function', "Parameter 'makeNullValue' should be a function.");

        this._convert = convert;
        this._makeNullValue = makeNullValue;
        this._name = name;

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
    constructor(name, convert, makeNullValue) {
        super(name, convert, makeNullValue);
    }

    _checkArities() {
        assert(this._convert.length === 3);
        assert(this._makeNullValue.length === 1);
    }

    convert(factory, raw, mutator = (x) => x) {
        assert(typeof factory === 'function');
        assert(typeof mutator === 'function');

        return this._convert(factory, raw, mutator);
    }

    makeNullValue(factory) {
        assert(typeof factory === 'function');

        return this._makeNullValue(factory);
    }
}

// @TODO replace implicit casting by validation (maybe make optional behaviour)
// @TODO consider not exposing mutators
// @TODO consider splitting mutators into before and after
export const AnyDescriptorType = new DescriptorType(
    (raw, mutator) => mutator(raw),
    () => null,
    'AnyDescriptorType'
);
export const StringDescriptorType = new DescriptorType(
    (raw, mutator) => String(mutator(raw)),
    () => '',
    'StringDescriptorType'
);
export const NumberDescriptorType = new DescriptorType(
    (raw, mutator) => Number(mutator(raw)),
    () => 0,
    'NumberDescriptorType'
);
export const BooleanDescriptorType = new DescriptorType(
    (raw, mutator) => Boolean(mutator(raw)),
    () => false,
    'BooleanDescriptorType'
);
export const DateDescriptorType = new DescriptorType(
    (raw, mutator) => (raw instanceof Date ? mutator(raw) : new Date(mutator(raw))),
    () => new Date('1970-01-01'),
    'DateDescriptorType'
);

export const NestedDescriptorType = new HigherOrderDescriptorType(
    (convert, raw, mutator) => convert(mutator(raw)),
    (factory) => factory(),
    'NestedDescriptorType'
);
export const ArrayDescriptorType = new HigherOrderDescriptorType(
    (convert, raw, mutator) => raw.map((x) => convert(mutator(x))),
    (factory) => [],
    'ArrayDescriptorType'
);
