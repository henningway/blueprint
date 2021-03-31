const { blueprint, CustomDescriptor, CustomHigherOrderDescriptor, $String } = require('../../dist');

const $Shout = CustomDescriptor(
    (raw) => typeof raw === 'string',
    (raw) => raw.toUpperCase() + '!',
    () => 'EMPTY'
);

const $Box = CustomHigherOrderDescriptor(
    (raw) => typeof raw === 'string',
    (convert, raw) => new Box(convert(raw)),
    (factory) => new Box(factory())
);

class Box {
    constructor(wrapped) {
        this.wrapped = wrapped;
    }

    unpack() {
        return this.wrapped;
    }
}

it('can use custom basic descriptor', () => {
    expect(blueprint({ title: $Shout }).make({ title: 'The Name of the Wind' })).toStrictEqual({
        title: 'THE NAME OF THE WIND!'
    });
});

it('can use custom higher order descriptor', () => {
    const result = blueprint({ box: $Box($String, 'title') }).make({ title: 'The Name of the Wind' });

    expect(result.box.unpack()).toBe('The Name of the Wind');
});

it('can create null object with custom descriptor', () => {
    expect(blueprint({ title: $Shout }).make()).toStrictEqual({ title: 'EMPTY!' });
});

// @TODO fix nesting descriptor does not result in true factory
it.skip('can create null object with custom higher order descriptor', () => {
    const result = blueprint({ box: $Box($String) }).make();

    expect(result.box.unpack()).toBe('');
});
