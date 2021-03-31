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
    MissingKeyError,
    ValidationError
} = require('../../dist');

test('empty blueprint provides empty object', () => {
    expect(blueprint().make()).toStrictEqual({});
});

it('can extract strings', () => {
    expect(blueprint({ title: $String }).make({ title: 'The Name of the Wind' })).toStrictEqual({
        title: 'The Name of the Wind'
    });
});

it('can extract numbers', () => {
    expect(blueprint({ pages: $Number }).make({ pages: 662 })).toStrictEqual({ pages: 662 });
});

it('can extract booleans', () => {
    const bookBlueprint = blueprint({ hardCover: $Boolean });

    expect(bookBlueprint.make({ hardCover: true })).toStrictEqual({ hardCover: true });
    expect(bookBlueprint.make({ hardCover: false })).toStrictEqual({ hardCover: false });
});

test.each([
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
])('$Any can pass through anything', (raw) => {
    const one = factory({ x: $Any });
    const many = factory({ x: $Many($Any) });

    expect(one({ x: raw })).toStrictEqual({ x: raw });
    expect(many({ x: [raw] })).toStrictEqual({ x: [raw] });
});

test('$Many can extract arrays', () => {
    expect(blueprint({ genres: $Many($String) }).make({ genres: ['fantasy', 'fiction'] })).toStrictEqual({
        genres: ['fantasy', 'fiction']
    });
});

test('can provide alternate keys', () => {
    const bookBlueprint = blueprint({
        name: $String('title'),
        pageCount: $Number('pages'),
        isHardCover: $Boolean('hardCover'),
        published: $Date('releaseDate'),
        publishedAt: $One($String, 'publisher'),
        categories: $Many($String, 'genres'),
        metaData: $Any('meta')
    });

    expect(
        bookBlueprint.make({
            title: 'The Name of the Wind',
            pages: 662,
            hardCover: true,
            releaseDate: '2007-03-27',
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
        published: new Date('2007-03-27'),
        publishedAt: 'DAW Books',
        categories: ['fantasy', 'fiction'],
        metaData: {
            tags: ['continued', 'ongoing']
        }
    });
});

it('can mutate values with mutator callbacks', () => {
    const bookBlueprint = blueprint({
        title: $String('title').after((x) => x.toUpperCase()),
        long: $Boolean('pages').before((x) => x > 500),
        softCover: $Boolean('hardCover').after((x) => !x),
        author: $One($String).after(() => 'REDACTED'),
        genres: $Many($String.after((x) => x + ' book'))
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
    expect(() => blueprint({ hardCover: $Boolean }).make({ title: 'The Name of the Wind' })).toThrow(MissingKeyError);
});

it('revolts when a value is invalid', () => {
    expect(() => blueprint({ hardCover: $Boolean }).make({ hardCover: true })).not.toThrow(ValidationError);
    expect(() => blueprint({ hardCover: $Boolean }).make({ hardCover: 'true' })).toThrow(ValidationError);
    expect(() => blueprint({ genres: $Many($String) }).make({ genres: ['fantasy', 'fiction'] })).not.toThrow(
        ValidationError
    );
    expect(() => blueprint({ genres: $Many($String) }).make({ genres: ['fantasy', 1] })).toThrow(ValidationError);
});
