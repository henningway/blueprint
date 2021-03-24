const { blueprint, $Any, $String, $Number, $Boolean, $Date, $One, $Many } = require('../../dist');

it('can create null objects', () => {
    const bookBlueprint = blueprint({
        title: $String,
        pages: $Number,
        hardCover: $Boolean,
        published: $Date,
        meta: $Any,
        author: { name: $String },
        publisher: $One({ name: $String }),
        genres: $Many($String)
    });

    expect(bookBlueprint.make()).toStrictEqual({
        title: '',
        pages: 0,
        hardCover: false,
        published: new Date('1970-01-01'),
        meta: null,
        author: { name: '' },
        publisher: { name: '' },
        genres: []
    });
});
