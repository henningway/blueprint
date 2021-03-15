const { blueprint, factory, $Any, $String, $Number, $Boolean, $One, $Many, MissingKeyError } = require('../dist');

test('empty blueprint provides empty object', () => {
    expect(blueprint().make()).toStrictEqual({});
});

it('can extract strings', () => {
    const bookBlueprint = blueprint({ title: $String });

    expect(bookBlueprint.make({ title: 'The Name of the Wind' })).toStrictEqual({
        title: 'The Name of the Wind'
    });
});

it('can extract numbers', () => {
    const bookBlueprint = blueprint({ pages: $Number });

    expect(bookBlueprint.make({ pages: 662 })).toStrictEqual({ pages: 662 });
    expect(bookBlueprint.make({ pages: '662' })).toStrictEqual({ pages: 662 });
});

it('can extract booleans', () => {
    const bookBlueprint = blueprint({ hardCover: $Boolean });

    expect(bookBlueprint.make({ hardCover: true })).toStrictEqual({ hardCover: true });
    expect(bookBlueprint.make({ hardCover: false })).toStrictEqual({ hardCover: false });
    expect(bookBlueprint.make({ hardCover: 'true' })).toStrictEqual({ hardCover: true });
    expect(bookBlueprint.make({ hardCover: 'false' })).toStrictEqual({ hardCover: true }); // @TODO decide whether library should deviate from javascript default behaviour
});

it.each([
    null,
    undefined,
    NaN,
    Infinity,
    Symbol('yo'),
    function foo() {},
    1,
    true,
    false,
    '',
    'a',
    {},
    { a: 'b' },
    [],
    ['a', 'b']
])('can pass through anything', (raw) => {
    const one = factory({ x: $Any });
    const many = factory({ x: $Many($Any) });

    expect(one({ x: raw })).toStrictEqual({ x: raw });
    expect(many({ x: [raw] })).toStrictEqual({ x: [raw] });
});

it('can extract arrays', () => {
    const bookBlueprint = blueprint({ genres: $Many($String) });

    expect(bookBlueprint.make({ genres: ['fantasy', 'fiction'] })).toStrictEqual({
        genres: ['fantasy', 'fiction']
    });
});

test('can provide alternate keys', () => {
    const bookBlueprint = blueprint({
        name: $String('title'),
        pageCount: $Number('pages'),
        isHardCover: $Boolean('hardCover'),
        publishedAt: $One($String, 'publisher'),
        categories: $Many($String, 'genres'),
        metaData: $Any('meta')
    });

    expect(
        bookBlueprint.make({
            title: 'The Name of the Wind',
            pages: 662,
            hardCover: true,
            publisher: 'DAW Books',
            genres: ['fantasy', 'fiction'],
            meta: {
                tags: ['continued', 'ongoing']
            }
        })
    ).toStrictEqual({
        name: 'The Name of the Wind',
        pageCount: 662,
        isHardCover: true,
        publishedAt: 'DAW Books',
        categories: ['fantasy', 'fiction'],
        metaData: {
            tags: ['continued', 'ongoing']
        }
    });
});

it('can mutate values with mutator callbacks', () => {
    const bookBlueprint = blueprint({
        title: $String('title', (x) => x.toUpperCase()),
        long: $Boolean('pages', (x) => x > 500),
        softCover: $Boolean('hardCover', (x) => !x),
        author: $One($String, 'author', (x) => 'REDACTED'),
        genres: $Many($String, 'genres', (x) => x + ' book')
    });

    expect(
        bookBlueprint.make({
            title: 'The Name of the Wind',
            pages: 662,
            hardCover: true,
            author: 'Patrick Rothfuss',
            genres: ['fantasy', 'fiction']
        })
    ).toStrictEqual({
        title: 'THE NAME OF THE WIND',
        long: true,
        softCover: false,
        author: 'REDACTED',
        genres: ['fantasy book', 'fiction book']
    });
});

it('revolts when a key is missing', () => {
    const bookBlueprint = blueprint({ hardCover: $Boolean });

    expect(() => bookBlueprint.make({ title: 'The Name of the Wind' })).toThrow(MissingKeyError);
});
