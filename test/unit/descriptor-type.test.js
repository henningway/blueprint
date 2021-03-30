const {
    AnyDescriptorType,
    StringDescriptorType,
    NumberDescriptorType,
    BooleanDescriptorType,
    DateDescriptorType,
    NestedDescriptorType,
    ArrayDescriptorType
} = require('../../dist');

describe('DescriptorTypes', () => {
    test('AnyDescriptorType', () => {
        expect(AnyDescriptorType.convert('1')).toBe('1');
        expect(AnyDescriptorType.makeNullValue(AnyDescriptorType.convert)).toBe(null);
    });

    test('StringDescriptorType', () => {
        expect(StringDescriptorType.convert(1)).toBe('1');
        expect(StringDescriptorType.makeNullValue(StringDescriptorType.convert)).toBe('');
    });

    test('NumberDescriptorType', () => {
        expect(NumberDescriptorType.convert('1')).toBe(1);
        expect(NumberDescriptorType.makeNullValue(NumberDescriptorType.convert)).toBe(0);
    });

    test('BooleanDescriptorType', () => {
        expect(BooleanDescriptorType.convert(1)).toBe(true);
        expect(BooleanDescriptorType.makeNullValue(BooleanDescriptorType.convert)).toBe(false);
    });

    test('DateDescriptorType', () => {
        expect(DateDescriptorType.convert('1970-01-01')).toStrictEqual(new Date('1970-01-01'));
        expect(DateDescriptorType.makeNullValue()).toStrictEqual(new Date('1970-01-01'));
    });

    test('NestedDescriptorType', () => {
        expect(NestedDescriptorType.convert((x) => x, '1')).toBe('1');
        expect(NestedDescriptorType.makeNullValue((raw) => '1')).toStrictEqual('1');
    });

    test('ArrayDescriptorType', () => {
        expect(ArrayDescriptorType.convert((x) => x, ['1'])).toStrictEqual(['1']);
        expect(ArrayDescriptorType.makeNullValue((raw) => '1')).toStrictEqual([]);
    });
});
