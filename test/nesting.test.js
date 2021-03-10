const { blueprint, factory, $String, $Number, $Boolean, $Many } = require('../dist');

it('can be nested with objects', () => {
    const Book = factory({ title: $String, author: { name: $String, age: $Number } });

    expect(
        Book({
            title: 'The Name of the Wind',
            author: {
                name: 'Patrick Rothfuss',
                age: 42
            }
        })
    ).toStrictEqual({
        title: 'The Name of the Wind',
        author: {
            name: 'Patrick Rothfuss',
            age: 42
        }
    });
});

it('can be nested with factory', () => {
    const Book = factory({ title: $String, author: factory({ name: $String }) });

    expect(
        Book({
            title: 'The Name of the Wind',
            author: { name: 'Patrick Rothfuss' }
        })
    ).toStrictEqual({
        title: 'The Name of the Wind',
        author: { name: 'Patrick Rothfuss' }
    });
});

it('can be nested with blueprint', () => {
    const Book = factory({ title: $String, author: blueprint({ name: $String }) });

    expect(
        Book({
            title: 'The Name of the Wind',
            author: { name: 'Patrick Rothfuss' }
        })
    ).toStrictEqual({
        title: 'The Name of the Wind',
        author: { name: 'Patrick Rothfuss' }
    });
});

it('can be nested with factory inside many', () => {
    const Book = factory({ title: $String });
    const Shelve = factory({ books: $Many(Book) });

    expect(
        Shelve({
            books: [{ title: 'The Name of the Wind' }, { title: 'The Subtle Art of Not Giving a F*ck' }]
        })
    ).toStrictEqual({
        books: [{ title: 'The Name of the Wind' }, { title: 'The Subtle Art of Not Giving a F*ck' }]
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
