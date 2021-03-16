import { Enum } from './internal';

export const Modifier = new Enum({
    MAYBE: 'maybe',
    OPTIONAL: 'optional'
});

export const DescriptorType = new Enum({
    ANY: 'ANY', // CasterType.FACTORY (identity function)
    STRING: 'STRING', // CasterType.PRIMITIVE
    NUMBER: 'NUMBER', // CasterType.PRIMITIVE
    BOOLEAN: 'BOOLEAN', // CasterType.PRIMITIVE
    DATE: 'DATE', // CasterType.PRIMITIVE
    NESTED: 'NESTED', // CasterType.DESCRIPTOR || CasterType.FACTORY
    ARRAY: 'ARRAY' // CasterType.DESCRIPTOR || CasterType.FACTORY
});

export const CasterType = new Enum({
    PASS_THROUGH: 'PASS_THROUGH',
    PRIMITIVE: 'PRIMITIVE',
    DESCRIPTOR: 'DESCRIPTOR',
    FACTORY: 'FACTORY'
});
