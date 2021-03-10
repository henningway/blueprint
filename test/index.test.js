const {
    blueprint,
    factory,
    $Any,
    $String,
    $Number,
    $Boolean,
    $Many,
    MissingKeyError,
    IllegalModifierError
} = require('../dist');

describe('Blueprint', () => {
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

    it('can pass through anything', () => {
        const obscureBlueprint = blueprint({ x: $Any });

        expect(obscureBlueprint.make({ x: {} })).toStrictEqual({ x: {} });
    });

    it('can extract arrays', () => {
        const bookBlueprint = blueprint({ genres: $Many($String) });

        expect(bookBlueprint.make({ genres: ['fantasy', 'fiction'] })).toStrictEqual({
            genres: ['fantasy', 'fiction']
        });
    });

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

    it('allows for missing keys or values with maybe', () => {
        const bookBlueprint = blueprint({
            title: $String.maybe,
            pages: $Number.maybe,
            meta: $Any.maybe,
            genres: $Many($String).maybe
        });

        expect(bookBlueprint.make({ title: 'The Subtle Art of Not Giving a F*ck', pages: null })).toStrictEqual({
            title: 'The Subtle Art of Not Giving a F*ck',
            pages: null,
            meta: null,
            genres: null
        });
    });

    it('can leave out empty values with optional', () => {
        const bookBlueprint = blueprint({
            title: $String.optional,
            pages: $Number.optional,
            meta: $Any.optional,
            genres: $Many($String).optional
        });

        expect(bookBlueprint.make({ title: 'The Subtle Art of Not Giving a F*ck', pages: null })).toStrictEqual({
            title: 'The Subtle Art of Not Giving a F*ck'
        });
    });

    // @TODO can we make this happen? probably have to find abstraction for descriptor proxy and use it for blueprints/factories as well
    it.skip('can combine nesting with modifiers', () => {
        const Book = factory({ title: $String, author: factory({ name: $String }).maybe });

        expect(Book({ title: 'The Name of the Wind' })).toStrictEqual({
            title: 'The Name of the Wind',
            author: null
        });
    });

    test('can provide alternate keys', () => {
        const bookBlueprint = blueprint({
            name: $String('title'),
            pageCount: $Number('pages'),
            isHardCover: $Boolean('hardCover'),
            categories: $Many($String, 'genres'),
            metaData: $Any('meta')
        });

        expect(
            bookBlueprint.make({
                title: 'The Name of the Wind',
                pages: 662,
                hardCover: true,
                genres: ['fantasy', 'fiction'],
                meta: {
                    tags: ['continued', 'ongoing']
                }
            })
        ).toStrictEqual({
            name: 'The Name of the Wind',
            pageCount: 662,
            isHardCover: true,
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
            genres: $Many($String, 'genres', (x) => x + ' book')
        });

        expect(
            bookBlueprint.make({
                title: 'The Name of the Wind',
                pages: 662,
                hardCover: true,
                genres: ['fantasy', 'fiction']
            })
        ).toStrictEqual({
            title: 'THE NAME OF THE WIND',
            long: true,
            softCover: false,
            genres: ['fantasy book', 'fiction book']
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

    it('revolts when a key is missing', () => {
        const bookBlueprint = blueprint({ hardCover: $Boolean });

        expect(() => bookBlueprint.make({ title: 'The Name of the Wind' })).toThrow(MissingKeyError);
    });

    it('revolts when an illegal modifier is used', () => {
        expect(() => blueprint({ title: $Any.voldemort })).toThrow(IllegalModifierError);
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
});
