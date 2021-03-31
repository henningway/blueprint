const { blueprint, factory, $String, $Number, $Boolean, $Many, $One } = require('../../dist');

it('can combine nesting with modifiers', () => {
    const Book = factory({ title: $String, author: $One(factory({ name: $String })).maybe });

    expect(Book({ title: 'The Name of the Wind' })).toStrictEqual({
        title: 'The Name of the Wind',
        author: null
    });
});

test('readme example', () => {
    const bookBlueprint = blueprint({
        title: $String,
        author: {
            name: $String,
            homepage: $String
        },
        pages: $Number('length'),
        genres: $Many($String),
        inStock: $Boolean.default(false),
        price: $Number.optional,
        isHardCover: $Boolean('coverType').before((type) => type === 'hardcover')
    });

    expect(
        bookBlueprint.make({
            title: 'The Name of the Wind',
            author: {
                name: 'Patrick Rothfuss',
                homepage: 'patrickrothfuss.com'
            },
            length: 662,
            genres: ['fantasy', 'fiction'],
            coverType: 'hardcover'
        })
    ).toStrictEqual({
        title: 'The Name of the Wind',
        author: {
            name: 'Patrick Rothfuss',
            homepage: 'patrickrothfuss.com'
        },
        pages: 662,
        genres: ['fantasy', 'fiction'],
        inStock: false,
        isHardCover: true
    });

    expect(bookBlueprint.make()).toStrictEqual({
        title: '',
        author: {
            name: '',
            homepage: ''
        },
        pages: 0,
        genres: [],
        inStock: false,
        isHardCover: false
    });
});
