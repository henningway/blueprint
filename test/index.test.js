const { Blueprint, $String } = require('../src');

describe('Blueprint', () => {
    const book = { title: 'The Name of the Wind' };

    it('provides object', () => {
        const blueprint = new Blueprint();

        expect(typeof blueprint.make()).toBe('object');
    });

    it('can extract strings', () => {
        const blueprint = new Blueprint({
            title: $String
        });

        expect(blueprint.make(book)).toStrictEqual({ title: 'The Name of the Wind' });
    });

    test('can provide alternate keys', () => {
        const blueprint = new Blueprint({
            name: $String('title')
        });

        expect(blueprint.make(book)).toStrictEqual({ name: 'The Name of the Wind' });
    });
});
