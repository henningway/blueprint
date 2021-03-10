const { blueprint, factory, $String, $Number, $One, $Many } = require('../dist');

it.each([
    { title: $String, author: { name: $String, age: $Number } },
    { title: $String, author: $One({ name: $String, age: $Number }) }
])('can be nested with objects', (spec) => {
    expect(
        factory(spec)({
            title: 'The Name of the Wind',
            author: { name: 'Patrick Rothfuss', age: 42 }
        })
    ).toStrictEqual({
        title: 'The Name of the Wind',
        author: { name: 'Patrick Rothfuss', age: 42 }
    });
});

it.each([
    { title: $String, author: factory({ name: $String }) },
    { title: $String, author: $One(factory({ name: $String })) }
])('can be nested with factory', (spec) => {
    expect(
        factory(spec)({
            title: 'The Name of the Wind',
            author: { name: 'Patrick Rothfuss' }
        })
    ).toStrictEqual({
        title: 'The Name of the Wind',
        author: { name: 'Patrick Rothfuss' }
    });
});

it.each([
    { title: $String, author: blueprint({ name: $String }) },
    { title: $String, author: $One(blueprint({ name: $String })) }
])('can be nested with blueprint', (spec) => {
    expect(
        factory(spec)({
            title: 'The Name of the Wind',
            author: { name: 'Patrick Rothfuss' }
        })
    ).toStrictEqual({
        title: 'The Name of the Wind',
        author: { name: 'Patrick Rothfuss' }
    });
});

it.each([{ title: $String }, factory({ title: $String }), blueprint({ title: $String })])(
    'can be nested inside many',
    (book) => {
        const Shelve = factory({ books: $Many(book) });

        expect(
            Shelve({
                books: [{ title: 'The Name of the Wind' }, { title: 'The Subtle Art of Not Giving a F*ck' }]
            })
        ).toStrictEqual({
            books: [{ title: 'The Name of the Wind' }, { title: 'The Subtle Art of Not Giving a F*ck' }]
        });
    }
);
