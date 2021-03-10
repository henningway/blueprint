const { blueprint, $Any, $String, $Number, $Boolean, $Many, IllegalModifierError } = require('../dist');

it('allows for missing keys or values with maybe', () => {
    const bookBlueprint = blueprint({
        title: $String.maybe,
        pages: $Number.maybe,
        meta: $Any.maybe,
        genres: $Many($String).maybe
    });

    expect(bookBlueprint.make({ title: 'The Subtle Art of Not Giving a F*ck', pages: null })).toStrictEqual({
        title: 'The Subtle Art of Not Giving a F*ck',
        pages: null,
        meta: null,
        genres: null
    });
});

it('can leave out empty values with optional', () => {
    const bookBlueprint = blueprint({
        title: $String.optional,
        pages: $Number.optional,
        meta: $Any.optional,
        genres: $Many($String).optional
    });

    expect(bookBlueprint.make({ title: 'The Subtle Art of Not Giving a F*ck', pages: null })).toStrictEqual({
        title: 'The Subtle Art of Not Giving a F*ck'
    });
});

test('maybe takes precedence over optional', () => {
    const bookBlueprint = blueprint({ price: $Number.optional.maybe });

    expect(bookBlueprint.make({ title: 'The Name of the Wind' })).toStrictEqual({ price: null });
    expect(bookBlueprint.make()).toStrictEqual({ price: 0 }); // @TODO currently null objects ignore modifiers
});

it('can provide defaults', () => {
    const bookBlueprint = blueprint({
        title: $String.default('A Book'),
        pages: $Number.default(100),
        hardCover: $Boolean.default(true),
        genres: $Many($String).default(['novel'])
    });

    expect(bookBlueprint.make({})).toStrictEqual({
        title: 'A Book',
        pages: 100,
        hardCover: true,
        genres: ['novel']
    });
});

it('revolts when an illegal modifier is used', () => {
    expect(() => blueprint({ title: $Any.voldemort })).toThrow(IllegalModifierError);
});
