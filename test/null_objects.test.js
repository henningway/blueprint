const { blueprint, $Any, $String, $Number, $Boolean, $One, $Many } = require('../dist');

it('can create null objects', () => {
    const bookBlueprint = blueprint({
        title: $String,
        pages: $Number,
        hardCover: $Boolean,
        meta: $Any,
        author: { name: $String },
        publisher: $One({ name: $String }),
        genres: $Many($String)
    });

    expect(bookBlueprint.make()).toStrictEqual({
        title: '',
        pages: 0,
        hardCover: false,
        meta: null,
        author: { name: '' },
        publisher: { name: '' },
        genres: []
    });
});
