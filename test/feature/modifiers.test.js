const {
    blueprint,
    factory,
    $Any,
    $String,
    $Number,
    $Boolean,
    $Date,
    $One,
    $Many,
    IllegalModifierError
} = require('../../dist');

it('allows for missing keys or values with maybe', () => {
    const bookBlueprint = blueprint({
        title: $String.maybe,
        pages: $Number.maybe,
        meta: $Any.maybe,
        author: $One($String).maybe,
        genres: $Many($String).maybe
    });

    expect(bookBlueprint.make({ title: 'The Subtle Art of Not Giving a F*ck', pages: null })).toStrictEqual({
        title: 'The Subtle Art of Not Giving a F*ck',
        pages: null,
        meta: null,
        author: null,
        genres: null
    });
});

it('can leave out empty values with optional', () => {
    const bookBlueprint = blueprint({
        title: $String.optional,
        pages: $Number.optional,
        meta: $Any.optional,
        author: $One($String).optional,
        genres: $Many($String).optional
    });

    expect(bookBlueprint.make({ title: 'The Subtle Art of Not Giving a F*ck', pages: null })).toStrictEqual({
        title: 'The Subtle Art of Not Giving a F*ck'
    });
});

test.each([{ price: $Number.optional.maybe }, { price: $Number.maybe.optional }])(
    'maybe takes precedence over optional',
    (spec) => {
        const Book = factory(spec);

        expect(Book({ title: 'The Name of the Wind' })).toStrictEqual({ price: null });
        expect(Book()).toStrictEqual({ price: 0 }); // @TODO currently null objects ignore modifiers
    }
);

it('can provide defaults', () => {
    const bookBlueprint = blueprint({
        title: $String.default('A Book'),
        pages: $Number.default(100),
        hardCover: $Boolean.default(true),
        published: $Date.default(new Date('2007-03-27')),
        author: $One($String).default('unknown'),
        genres: $Many($String).default(['novel'])
    });

    expect(bookBlueprint.make({})).toStrictEqual({
        title: 'A Book',
        pages: 100,
        hardCover: true,
        published: new Date('2007-03-27'),
        author: 'unknown',
        genres: ['novel']
    });
});

it('revolts when an illegal modifier is used', () => {
    expect(() => blueprint({ title: $Any.voldemort })).toThrow(IllegalModifierError);
});
