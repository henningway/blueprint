import { assert, ValidationError } from './internal';

export class DescriptorType {
    _validate;
    _convert;
    _makeNullValue;
    _name;

    constructor(validate, convert, makeNullValue, name = '') {
        assert(typeof validate === 'function', "Parameter 'convert' should be a function.");
        assert(typeof convert === 'function', "Parameter 'convert' should be a function.");
        assert(typeof makeNullValue === 'function', "Parameter 'makeNullValue' should be a function.");

        this._validate = validate;
        this._convert = convert;
        this._makeNullValue = makeNullValue;
        this._name = name;

        this._checkArities();
    }

    _checkArities() {
        assert(this._validate.length === 1);
        assert(this._convert.length === 2);
        assert(this._makeNullValue.length === 0);
    }

    validate(raw, key = null) {
        if (!this._validate(raw)) throw new ValidationError(raw, key);
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
        assert(this._validate.length === 1);
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
    (raw) => true,
    (raw, mutator) => mutator(raw),
    () => null,
    'AnyDescriptorType'
);
export const StringDescriptorType = new DescriptorType(
    (raw) => typeof raw === 'string',
    (raw, mutator) => mutator(raw),
    () => '',
    'StringDescriptorType'
);
export const NumberDescriptorType = new DescriptorType(
    (raw) => typeof raw === 'number',
    (raw, mutator) => mutator(raw),
    () => 0,
    'NumberDescriptorType'
);
export const BooleanDescriptorType = new DescriptorType(
    (raw) => typeof raw === 'boolean',
    (raw, mutator) => mutator(raw),
    () => false,
    'BooleanDescriptorType'
);
export const DateDescriptorType = new DescriptorType(
    (raw) => raw instanceof Date || new Date(raw).toString() !== 'Invalid Date',
    (raw, mutator) => (raw instanceof Date ? mutator(raw) : new Date(mutator(raw))),
    () => new Date('1970-01-01'),
    'DateDescriptorType'
);

export const NestedDescriptorType = new HigherOrderDescriptorType(
    (raw) => true, // @TODO provide better validation for NestedDescriptorType
    (convert, raw, mutator) => convert(mutator(raw)),
    (factory) => factory(),
    'NestedDescriptorType'
);
export const ArrayDescriptorType = new HigherOrderDescriptorType(
    (raw) => raw instanceof Array,
    (convert, raw, mutator) => raw.map((x) => convert(mutator(x))),
    (factory) => [],
    'ArrayDescriptorType'
);
