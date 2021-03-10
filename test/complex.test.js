const { blueprint, factory, $String, $Number, $Boolean, $Many, $One } = require('../dist');

it('can combine nesting with modifiers', () => {
    const Book = factory({ title: $String, author: $One(factory({ name: $String })).maybe });

    expect(Book({ title: 'The Name of the Wind' })).toStrictEqual({
        title: 'The Name of the Wind',
        author: null
    });
});

test('readme example', () => {
    const book = blueprint({
        title: $String,
        pages: $Number('length'),
        isHardCover: $Boolean('coverType', (value) => value === 'hardcover'),
        genre: $Many($String, 'categories'),
        price: $Number.maybe,
        containsVoldemort: $Boolean.optional
    });

    expect(
        book.make({
            title: 'The Name of the Wind',
            length: '662',
            coverType: 'hardcover',
            categories: ['fantasy', 'fiction']
        })
    ).toStrictEqual({
        title: 'The Name of the Wind',
        pages: 662,
        isHardCover: true,
        genre: ['fantasy', 'fiction'],
        price: null
    });
});
