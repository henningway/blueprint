# Blueprint

![npm version](https://badgen.net/npm/v/@henningway/blueprint)
![bundle size](https://badgen.net/bundlephobia/minzip/@henningway/blueprint)

Declarative object conversion for JavaScript.

## Example

Define blueprint:

```javascript
const book = blueprint({
    title: $String, // primitives: $Boolean, $Number, $String
    pages: $Number('length'), // map mismatching keys
    genre: $Many($String, 'categories'), // arrays
    price: $Number.maybe, // map missing keys to null (default: MissingKeyError) by chaining `.maybe`
    containsVoldemort: $Boolean.optional, // or leave missing keys out by chaining `.optional`
    isHardCover: $Boolean('coverType', (type) => type === 'hardcover') // provide conversion logic beyond simple casting with mutators
});
```

Convert:

```javascript
book.make({
    title: 'The Name of the Wind',
    length: '662',
    coverType: 'hardcover',
    categories: ['fantasy', 'fiction'],
    price: null
});
```

Result:

```javascript
{
    title: 'The Name of the Wind',
    pages: 662,
    genre: ['fantasy', 'fiction'],
    price: null,
    isHardCover: true
}
```
