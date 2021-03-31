const {
    AnyDescriptorType,
    StringDescriptorType,
    NumberDescriptorType,
    BooleanDescriptorType,
    DateDescriptorType,
    NestedDescriptorType,
    ArrayDescriptorType,
    ValidationError
} = require('../../dist');

describe('DescriptorTypes', () => {
    test('AnyDescriptorType', () => {
        expect(AnyDescriptorType.convert('a')).toBe('a');
        expect(AnyDescriptorType.makeNullValue(AnyDescriptorType.convert)).toBe(null);
    });

    test('StringDescriptorType', () => {
        expect(() => StringDescriptorType.validate(1)).toThrow(ValidationError);
        expect(StringDescriptorType.convert('a')).toBe('a');
        expect(StringDescriptorType.makeNullValue(StringDescriptorType.convert)).toBe('');
    });

    test('NumberDescriptorType', () => {
        expect(() => NumberDescriptorType.validate('1')).toThrow(ValidationError);
        expect(NumberDescriptorType.convert(1)).toBe(1);
        expect(NumberDescriptorType.makeNullValue(NumberDescriptorType.convert)).toBe(0);
    });

    test('BooleanDescriptorType', () => {
        expect(() => BooleanDescriptorType.validate('true')).toThrow(ValidationError);
        expect(BooleanDescriptorType.convert(true)).toBe(true);
        expect(BooleanDescriptorType.makeNullValue(BooleanDescriptorType.convert)).toBe(false);
    });

    test('DateDescriptorType', () => {
        expect(() => DateDescriptorType.validate('')).toThrow(ValidationError);
        expect(DateDescriptorType.convert('1970-01-01')).toStrictEqual(new Date('1970-01-01'));
        expect(DateDescriptorType.convert(new Date('1970-01-01'))).toStrictEqual(new Date('1970-01-01'));
        expect(DateDescriptorType.makeNullValue()).toStrictEqual(new Date('1970-01-01'));
    });

    test('NestedDescriptorType', () => {
        expect(NestedDescriptorType.convert((x) => x, '1')).toBe('1');
        expect(NestedDescriptorType.makeNullValue((raw) => '1')).toStrictEqual('1');
    });

    test('ArrayDescriptorType', () => {
        expect(() => ArrayDescriptorType.validate('')).toThrow(ValidationError);
        expect(ArrayDescriptorType.convert((x) => x, ['1'])).toStrictEqual(['1']);
        expect(ArrayDescriptorType.makeNullValue((raw) => '1')).toStrictEqual([]);
    });
});
