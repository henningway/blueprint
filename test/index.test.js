const { Blueprint, $String } = require('../src');

describe('Blueprint', () => {
    it('provides object', () => {
        const blueprint = new Blueprint();

        expect(typeof blueprint.make()).toBe('object');
    });

    it('can extract strings', () => {
        const blueprint = new Blueprint({
            title: $String
        });

        expect(blueprint.make({ title: 'The Name of the Wind' })).toStrictEqual({ title: 'The Name of the Wind' });
    });

    test('can provide alternate keys', () => {
        const blueprint = new Blueprint({
            name: $String('title')
        });

        expect(blueprint.make({ title: 'The Name of the Wind' })).toStrictEqual({ name: 'The Name of the Wind' });
    });
});
