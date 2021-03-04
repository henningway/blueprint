export enum Modifier {
    MAYBE = 'maybe',
    OPTIONAL = 'optional'
}

// @TODO rename (too clunky)
export enum DescriptorTypeValue {
    ARRAY,
    FACTORY,
    PRIMITIVE
}

export function has(e: any, value: any): boolean {
    return Object.values(e).includes(value);
}
