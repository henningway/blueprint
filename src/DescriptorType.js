import { assert } from './internal';

export class DescriptorType {
    _name;
    _convert;
    _makeNullValue;

    // @TODO make name optional -> is nice for debugging, but should not be forced upon user
    constructor(name, convert, makeNullValue) {
        assert(typeof convert === 'function', "Parameter 'convert' should be a function.");
        assert(typeof makeNullValue === 'function', "Parameter 'makeNullValue' should be a function.");

        this._name = name;
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
    'AnyDescriptorType',
    (raw, mutator) => mutator(raw),
    () => null
);
export const StringDescriptorType = new DescriptorType(
    'StringDescriptorType',
    (raw, mutator) => String(mutator(raw)),
    () => ''
);
export const NumberDescriptorType = new DescriptorType(
    'NumberDescriptorType',
    (raw, mutator) => Number(mutator(raw)),
    () => 0
);
export const BooleanDescriptorType = new DescriptorType(
    'BooleanDescriptorType',
    (raw, mutator) => Boolean(mutator(raw)),
    () => false
);
export const DateDescriptorType = new DescriptorType(
    'DateDescriptorType',
    (raw, mutator) => (raw instanceof Date ? mutator(raw) : new Date(mutator(raw))),
    () => new Date('1970-01-01')
);

export const NestedDescriptorType = new HigherOrderDescriptorType(
    'NestedDescriptorType',
    (convert, raw, mutator) => convert(mutator(raw)),
    (factory) => factory()
);
export const ArrayDescriptorType = new HigherOrderDescriptorType(
    'ArrayDescriptorType',
    (convert, raw, mutator) => raw.map((x) => convert(mutator(x))),
    (factory) => []
);
