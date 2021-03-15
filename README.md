# Blueprint

![ci status](https://github.com/henningway/blueprint/actions/workflows/main.yml/badge.svg)
![bundle size](https://badgen.net/bundlephobia/minzip/@henningway/blueprint)
![npm version](https://badgen.net/npm/v/@henningway/blueprint)

Declarative object conversion and creation for JavaScript.

## Contents

-   [Install](#install)
-   [Usage](#usage)
-   [Features](#features)
-   [Example](#example)
-   [API](#api)
    -   [Classes/Functions](#classesfunctions)
    -   [Descriptors](#descriptors)
    -   [Modifiers](#modifiers)
-   [License](#license)

## Install

```
$ npm install @henningway/blueprint
```

## Usage

```javascript
import { blueprint, $String } from 'blueprint';

const bookBlueprint = blueprint({ title: $String.default('A Book') });

bookBlueprint.make(); // { title: 'A Book' }
bookBlueprint.make({ title: 'The Name of the Wind' }); // { title: 'The Name of the Wind' }
```

## Features

**All Objects**

> Specify mappings between formats with an object (that looks like the target format). In goes an object, out comes an object.

**Declarative**

> Use descriptors like `$String`, `$Number.maybe`, `$Many($String)`. You can provide alternate keys, transformation functions, defaults, and more - without sacrificing legibility.

**Nesting**

> Nest blueprints in various ways to build complex structures without sweating.

**Null Objects**

> Use Blueprints to easily generate null objects with empty default values.

**Simple Validation**

> Missing keys result in early failure.

🚧 Feature needs work: Will support basic checks for type mismatches in the future.

**Light**

> No dependencies, small size.

---

⚠️**Disclaimer:** While descriptors `$String`, `$Many` etc. might look like a type system, blueprint is not intended to be a replacement for Typescript by any means.

## Example

Create blueprint:

```javascript
import { blueprint, $String, $Number, $Boolean, $Many } from 'blueprint';

const bookBlueprint = blueprint({
    title: $String,
    author: {
        name: $String,
        homepage: $String
    },
    pages: $Number('length'),
    genres: $Many($String, (genre) => genre.charAt(0).toUpperCase() + genre.slice(1)),
    inStock: $Boolean.default(false),
    price: $Number.optional,
    isHardCover: $Boolean('coverType', (type) => type === 'hardcover')
});
```

Convert object to desired format:

```javascript
bookBlueprint.make({
    title: 'The Name of the Wind',
    author: {
        name: 'Patrick Rothfuss',
        homepage: 'patrickrothfuss.com'
    },
    length: 662,
    genres: ['fantasy', 'fiction'],
    coverType: 'hardcover'
});
```

The result is what you'd expect:

```javascript
{
    title: 'The Name of the Wind',
    author: {
        name: 'Patrick Rothfuss',
        homepage: 'patrickrothfuss.com'
    },
    pages: 662,
    genres: ['fantasy', 'fiction'],
    inStock: false,
    isHardCover: true
}
```

Or create a null object by omitting the original object in `bookBlueprint.make()`:

```javascript
{
    title: '',
    author: {
        name: '',
        homepage: ''
    },
    pages: 0,
    genres: [],
    inStock: false,
    price: 0,
    isHardCover: false
}
```

## API

### Classes/Functions

#### `new Blueprint({ ...specification })` | `blueprint({ ...specification })`

Creates an instance of the `Blueprint` class that serves as a model for the conversion and creation of objects of the same structure.

Each value of `specification` should be one of [ [descriptor](#descriptors) | object | blueprint | factory function ]. Note that when you pass a nested object, blueprint or factory function, then you cannot chain modifiers to them, since they are only available to instances of the Descriptor class. In this case, wrap it with `$One(...)` and you are ready to go.

#### `Blueprint: make({ ...raw })`

Factory method that creates a new object from the blueprint as a transformation of the given raw object. Note that the input object is not modified.

If any of the keys in the specification is missing from the raw object then a `MissingKeyError` will be thrown (you can change this with [modifiers](#modifiers)).

When `raw` is omitted (or provided as empty object) a [null object](https://en.wikipedia.org/wiki/Null_object_pattern) with empty default values will be created. Descriptors are signified with a `$` sign.

Refer to the [Descriptors](#descriptor) section to learn how each one behaves with regard to conversion and default values.

#### `factory({ ...specification })`

This serves as a convenient replacement for `(raw) => blueprint({ ...specification }).make(raw)`.

### Descriptors

Descriptors characterize properties of the target object. They start with a `$` to avoid collision with JavaScript primitives (`string`, `number`, `boolean` and their uppercase wrappers). Descriptors serve two purposes: One is to provide a human-readable format to describe the resulting objects, and the other is to provide typical functionality of transformations.

There are two types:

-   basic: `$Any`, `$String`, `$Number`, `$Boolean`, `$Date`
-   higher-order: `$One`, `$Many`

Both share common parameters, but higher-order ones have one extra:

-   `nested` (only higher-order descriptors): A nested descriptor, object, blueprint or factory function.
-   `key`: They key in the object to be converted. Essentially maps one key to another. Defaults to the key the descriptor is attached to in the blueprint specification.
-   `mutator`: A callback function for custom transformations of the input value.

The distinction between `$Any`, `$String`, `$Number` and `$Boolean` is small: `$String`, `$Number` and `$Boolean` cast the input value to their respective types (after applying mutators) and in case of null object creation result in values of their type. `$Any` does not perform any casting (i.e. pass through the input value as is) and results in a `null` value during null object creation.

As shown in the examples above, thanks to some shifty Proxy magic you can use descriptors entirely without parameters and brackets.

#### `$Any(key, mutator)`

Passes through input values without casting. Results in `null` during null object creation.

#### `$String(key, mutator)`

Casts the input value (after applying `mutator`) to type `string`. Results in `''` during null object creation.

#### `$Number(key, mutator)`

Casts the input value (after applying `mutator`) to type `number`. Results in `0` during null object creation.

#### `$Boolean(key, mutator)`

Casts the input value (after applying `mutator`) to type `boolean`. Results in `false` during null object creation.

#### `$Date(key, mutator)`

Checks whether the input value is a Date - if not it creates a new one with `new Date(input)`. Results in the date created by `new Date('1970-01-01)` (the [Unix epoch](https://en.wikipedia.org/wiki/Unix_time)) during null object creation.

#### `$One(nested, key, mutator)`

The purpose of `$One` is to allow nesting objects, other blueprints, and factory functions inside blueprints and still provide a key, mutator, and chained modifiers to them.

All of these are equivalent:

-   Object: `author: $One({ name: $String }, 'writtenBy').maybe`
-   Blueprint: `author: $One(blueprint({ name: $String }), 'writtenBy').maybe`
-   Factory (library function): `author: $One(factory({ name: $String }), 'writtenBy').maybe`
-   Factory (custom function): `author: $One((raw) => ({ author: { name: raw.writtenBy })).maybe`

If you don't need the added functionality provided by descriptors, you can of course go without `$One`: `author: { name: $String }`.

`mutator` is applied before `nested`. The result during null object creation depends on the nested specification.

#### `$Many(nested, key, mutator)`

`$Many` allows converting arrays. `mutator` and `nested` are applied to each of the input array's values in this order. Results in `[]` during null object creation.

### Modifiers

Modifiers can be chained to descriptors to alter their behaviour.

#### `.maybe`

When missing from the raw object (key not present OR value is `null` OR value is `undefined`), instead of causing a `MissingKeyError`, the property is `null` in the converted object. This applies to null object creation as well.

#### `.optional`

Similar to `.maybe`, but instead of producing `null`, the property is omitted entirely from the converted object. This applies to null object creation as well.

#### `.default(value)`

Similar to `.maybe`, but instead of producing `null`, the given default value is used. This applies to null object creation as well.

## License

[MIT](LICENSE) © 2021 Henning Schindler
