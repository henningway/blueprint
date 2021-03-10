const { blueprint, $Any, $String, $Number, $Boolean, $Many } = require('../dist');

it('can create null objects', () => {
    const bookBlueprint = blueprint({
        title: $String,
        pages: $Number,
        hardCover: $Boolean,
        meta: $Any,
        genres: $Many($String),
        author: { name: $String }
    });

    expect(bookBlueprint.make()).toStrictEqual({
        title: '',
        pages: 0,
        hardCover: false,
        meta: null,
        genres: [],
        author: { name: '' }
    });
});
