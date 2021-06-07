import { assert, ValidationError } from './internal';

export class DescriptorType {
    _validate;
    _convert;
    _makeNullValue;
    _name;

    constructor(callbacks, name = '') {
        ['validate', 'convert', 'makeNull'].forEach((callbackName) => {
            assert(
                callbacks.hasOwnProperty(callbackName),
                `Cannot instantiate DescriptorType: missing callback '${callbackName}'.`
            );
            assert(
                typeof callbacks[callbackName] === 'function',
                `Cannot instantiate DescriptorType: '${callbackName}' should be a function.`
            );
        });

        this._validate = callbacks.validate;
        this._convert = callbacks.convert;
        this._makeNullValue = callbacks.makeNull;
        this._name = name;

        this._checkArities();
    }

    _checkArities() {
        assert(this._validate.length === 1);
        assert(this._convert.length === 1);
        assert(this._makeNullValue.length === 0);
    }

    validate(raw, key = null) {
        if (!this._validate(raw)) throw new ValidationError(raw, key);
    }

    convert(raw) {
        return this._convert(raw);
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
        assert(this._convert.length === 2);
        assert(this._makeNullValue.length === 1);
    }

    convert(factory, raw) {
        assert(typeof factory === 'function');

        return this._convert(factory, raw);
    }

    makeNullValue(factory) {
        assert(typeof factory === 'function');

        return this._makeNullValue(factory);
    }
}

export const AnyDescriptorType = new DescriptorType(
    {
        validate: (raw) => true,
        convert: (raw) => raw,
        makeNull: () => null
    },
    'AnyDescriptorType'
);
export const StringDescriptorType = new DescriptorType(
    {
        validate: (raw) => typeof raw === 'string',
        convert: (raw) => raw,
        makeNull: () => ''
    },
    'StringDescriptorType'
);
export const NumberDescriptorType = new DescriptorType(
    {
        validate: (raw) => typeof raw === 'number',
        convert: (raw) => raw,
        makeNull: () => 0
    },
    'NumberDescriptorType'
);
export const BooleanDescriptorType = new DescriptorType(
    {
        validate: (raw) => typeof raw === 'boolean',
        convert: (raw) => raw,
        makeNull: () => false
    },
    'BooleanDescriptorType'
);
export const DateDescriptorType = new DescriptorType(
    {
        validate: (raw) => raw instanceof Date || new Date(raw).toString() !== 'Invalid Date',
        convert: (raw) => (raw instanceof Date ? raw : new Date(raw)),
        makeNull: () => new Date('1970-01-01')
    },
    'DateDescriptorType'
);

export const NestedDescriptorType = new HigherOrderDescriptorType(
    {
        validate: (raw) => true, // @TODO provide better validation for NestedDescriptorType
        convert: (convertBoxed, raw) => convertBoxed(raw),
        makeNull: (factory) => factory()
    },
    'NestedDescriptorType'
);
export const ArrayDescriptorType = new HigherOrderDescriptorType(
    {
        validate: (raw) => raw instanceof Array,
        convert: (convertBoxed, raw) => raw.map((x) => convertBoxed(x)),
        makeNull: (factory) => []
    },
    'ArrayDescriptorType'
);
