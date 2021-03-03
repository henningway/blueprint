const {
    blueprint,
    factory,
    $String,
    $Number,
    $Boolean,
    $Many,
    MissingKeyError,
    IllegalModifierError
} = require('../dist');

describe('Blueprint', () => {
    const book1 = { title: 'The Name of the Wind', pages: '662', hardCover: 'true', genres: ['fantasy', 'fiction'] };
    const book2 = { title: 'The Subtle Art of Not Giving a F*ck' };

    test('empty blueprint provides empty object', () => {
        expect(blueprint().make()).toStrictEqual({});
    });

    it('can extract strings', () => {
        const bookBlueprint = blueprint({
            title: $String
        });

        expect(bookBlueprint.make(book1)).toStrictEqual({ title: 'The Name of the Wind' });
    });

    it('can extract numbers', () => {
        const bookBlueprint = blueprint({
            pages: $Number
        });

        expect(bookBlueprint.make(book1)).toStrictEqual({ pages: 662 });
    });

    it('can extract booleans', () => {
        const bookBlueprint = blueprint({
            hardCover: $Boolean
        });

        expect(bookBlueprint.make(book1)).toStrictEqual({ hardCover: true });
    });

    it('can extract arrays', () => {
        const bookBlueprint = blueprint({
            genres: $Many($String)
        });

        expect(bookBlueprint.make(book1)).toStrictEqual({ genres: ['fantasy', 'fiction'] });
    });

    it('allows for missing keys with maybe', () => {
        const bookBlueprint = blueprint({
            title: $String.maybe,
            name: $String('title').maybe,
            pages: $Number.maybe,
            pageCount: $Number('pages').maybe,
            genres: $Many($String).maybe,
            categories: $Many($String, 'genres').maybe
        });

        expect(bookBlueprint.make(book2)).toStrictEqual({
            title: 'The Subtle Art of Not Giving a F*ck',
            name: 'The Subtle Art of Not Giving a F*ck',
            pages: null,
            pageCount: null,
            genres: null,
            categories: null
        });
    });

    test('can provide alternate keys', () => {
        const bookBlueprint = blueprint({
            name: $String('title'),
            pageCount: $Number('pages'),
            isHardCover: $Boolean('hardCover'),
            categories: $Many($String, 'genres')
        });

        expect(bookBlueprint.make(book1)).toStrictEqual({
            name: 'The Name of the Wind',
            pageCount: 662,
            isHardCover: true,
            categories: ['fantasy', 'fiction']
        });
    });

    it('can mutate values with mutator callbacks', () => {
        const bookBlueprint = blueprint({
            title: $String('title', (x) => x.toUpperCase()),
            extraLong: $Boolean('pages', (x) => x > 1000),
            genres: $Many($String, 'genres', (x) => x + ' book')
        });

        expect(bookBlueprint.make(book1)).toStrictEqual({
            title: 'THE NAME OF THE WIND',
            extraLong: false,
            genres: ['fantasy book', 'fiction book']
        });
    });

    it('can leave out empty values with optional', () => {
        const bookBlueprint = blueprint({
            title: $String.optional,
            pageCount: $Number('pages').optional,
            price: $Number.optional
        });

        expect(bookBlueprint.make(book1)).toStrictEqual({
            title: 'The Name of the Wind',
            pageCount: 662
        });
    });

    test('maybe takes precedence over optional', () => {
        const bookBlueprint = blueprint({
            price: $Number.optional.maybe
        });

        expect(bookBlueprint.make(book1)).toStrictEqual({ price: null });
    });

    it('can create null objects', () => {
        const bookBlueprint = blueprint({
            title: $String,
            pages: $Number,
            hardCover: $Boolean,
            genres: $Many($String)
        });

        expect(bookBlueprint.make()).toStrictEqual({
            title: '',
            pages: 0,
            hardCover: false,
            genres: []
        });
    });

    it('revolts when a key is missing', () => {
        const bookBlueprint = blueprint({
            pages: $Number
        });
        expect(() => bookBlueprint.make(book2)).toThrow(MissingKeyError);
    });

    it('revolts when an illegal modifier is used', () => {
        expect(() => blueprint({ title: $String.voldemort })).toThrow(IllegalModifierError);
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

    it('can be nested', () => {
        const Book = factory({ title: $String });
        const Shelve = factory({ books: $Many(Book) });

        expect(
            Shelve({
                books: [book1, book2]
            })
        ).toStrictEqual({
            books: [{ title: 'The Name of the Wind' }, { title: 'The Subtle Art of Not Giving a F*ck' }]
        });
    });
});
