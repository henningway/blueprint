const { Extractor, $Any, $Many } = require('../../dist');

test('can convert', () => {
    expect(new Extractor($Any).convert('1')).toBe('1');
});

test('can convert arrays with $Many', () => {
    expect(new Extractor($Many($Any)).convert([1, 'a'])).toStrictEqual([1, 'a']);
});
