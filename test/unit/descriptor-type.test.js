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
        expect(AnyDescriptorType.convertValue('1')).toBe('1');
        expect(AnyDescriptorType.makeNullValue(AnyDescriptorType.convertValue)).toBe(null);
    });

    test('StringDescriptorType', () => {
        expect(StringDescriptorType.convertValue(1)).toBe('1');
        expect(StringDescriptorType.makeNullValue(StringDescriptorType.convertValue)).toBe('');
    });

    test('NumberDescriptorType', () => {
        expect(NumberDescriptorType.convertValue('1')).toBe(1);
        expect(NumberDescriptorType.makeNullValue(NumberDescriptorType.convertValue)).toBe(0);
    });

    test('BooleanDescriptorType', () => {
        expect(BooleanDescriptorType.convertValue(1)).toBe(true);
        expect(BooleanDescriptorType.makeNullValue(BooleanDescriptorType.convertValue)).toBe(false);
    });

    test('DateDescriptorType', () => {
        expect(DateDescriptorType.convertValue('1970-01-01')).toStrictEqual(new Date('1970-01-01'));
        expect(DateDescriptorType.makeNullValue()).toStrictEqual(new Date('1970-01-01'));
    });

    test('NestedDescriptorType', () => {
        expect(NestedDescriptorType.convertValue('1', (x) => x)).toBe('1');
        expect(NestedDescriptorType.makeNullValue(AnyDescriptorType)).toStrictEqual(null);
    });

    test('ArrayDescriptorType', () => {
        expect(ArrayDescriptorType.convertValue(['1'], (x) => x)).toStrictEqual(['1']);
        expect(ArrayDescriptorType.makeNullValue(AnyDescriptorType)).toStrictEqual([]);
    });
});
