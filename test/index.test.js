const { Blueprint, $String, $Number, $Boolean, $Many } = require('../src');

describe('Blueprint', () => {
    const book = { title: 'The Name of the Wind', pages: '662', hardCover: 'true', genres: ['fantasy', 'fiction'] };

    test('empty blueprint provides empty object', () => {
        const blueprint = new Blueprint();

        expect(blueprint.make()).toStrictEqual({});
    });

    it('can extract strings', () => {
        const blueprint = new Blueprint({
            title: $String
        });

        expect(blueprint.make(book)).toStrictEqual({ title: 'The Name of the Wind' });
    });

    it('can extract numbers', () => {
        const blueprint = new Blueprint({
            pages: $Number
        });

        expect(blueprint.make(book)).toStrictEqual({ pages: 662 });
    });

    it('can extract booleans', () => {
        const blueprint = new Blueprint({
            hardCover: $Boolean
        });

        expect(blueprint.make(book)).toStrictEqual({ hardCover: true });
    });

    it('can extract arrays', () => {
        const blueprint = new Blueprint({
            genres: $Many($String)
        });

        expect(blueprint.make(book)).toStrictEqual({ genres: ['fantasy', 'fiction'] });
    });

    test('can provide alternate keys', () => {
        const blueprint = new Blueprint({
            name: $String('title'),
            pageCount: $Number('pages'),
            isHardCover: $Boolean('hardCover'),
            categories: $Many($String, 'genres')
        });

        expect(blueprint.make(book)).toStrictEqual({
            name: 'The Name of the Wind',
            pageCount: 662,
            isHardCover: true,
            categories: ['fantasy', 'fiction']
        });
    });
});
