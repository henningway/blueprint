const { Descriptor, Modifier, $Any, $Many } = require('../../dist');

test('calling proxy as function ejects descriptor', () => {
    expect($Any()).toBeInstanceOf(Descriptor);
});

test('calling proxy as function ejects descriptor when nested with $Many', () => {
    expect($Many($Any)).toBeInstanceOf(Descriptor);
});

test('setting modifiers on proxy ejects descriptor', () => {
    expect($Any.maybe).toBeInstanceOf(Descriptor);
});

test('setting modifiers on proxy ejects descriptor when nested with $Many', () => {
    expect($Many($Any).maybe).toBeInstanceOf(Descriptor);
});

test('chained modifiers result in descriptor', () => {
    expect($Any.maybe.optional).toBeInstanceOf(Descriptor);
});

test('chained modifiers result in descriptor when nested with $Many', () => {
    expect($Many($Any).maybe.optional).toBeInstanceOf(Descriptor);
});

test('key is persisted', () => {
    expect($Any('title').key).toBe('title');
});

test('key is persisted when nested with $Many', () => {
    expect($Many($Any, 'title').key).toBe('title');
});

test('modifiers are persisted', () => {
    const descriptor = $Any.maybe.optional;

    expect(descriptor._modifiers).toStrictEqual([Modifier.MAYBE, Modifier.OPTIONAL]);
    expect(descriptor.hasModifier(Modifier.MAYBE)).toBe(true);
    expect(descriptor.hasModifier(Modifier.OPTIONAL)).toBe(true);
});

test('modifiers are persisted when nested with $Many', () => {
    const descriptor = $Many($Any).maybe.optional;

    expect(descriptor._modifiers).toStrictEqual([Modifier.MAYBE, Modifier.OPTIONAL]);
    expect(descriptor.hasModifier(Modifier.MAYBE)).toBe(true);
    expect(descriptor.hasModifier(Modifier.OPTIONAL)).toBe(true);
});
