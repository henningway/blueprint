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
    -   [Functions](#functions)
    -   [Descriptors](#descriptors)
    -   [Modifiers](#modifiers)

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

**Declarative**

> Specify mappings between formats with an object that resembles the target. In goes an object, out comes an object.

**Descriptors**

> Describe your conversion with the likes of `$String`, `$Number`, `$Many($String)` etc. You can provide alternate keys, transformation functions, defaults, and more - without sacrificing legibility.

**Nesting**

> Nest blueprints in various ways to build complex structures without sweating.

**Null Objects**

> Use Blueprints to easily generate null objects with empty default values.

**Simple Validation**

> Missing keys result in early failure.

🚧 Feature needs work: Will support basic checks for type mismatches in the future. 🚧

**Light**

> No dependencies, small size.

---

⚠️ **Disclaimer:** While descriptors like `$String` might seem to be part of a type system, blueprint is not intended to a replacement for Typescript by and means.

## Example

Specify with `blueprint({ ... })`:

```javascript
import { blueprint, $String, $Number, $Boolean, $Many } from 'blueprint';

const bookBlueprint = blueprint({
    title: $String,
    pages: $Number('length'),
    genres: $Many($String),
    price: $Number.maybe,
    isHardCover: $Boolean('coverType', (type) => type === 'hardcover'),
    containsVoldemort: $Boolean.optional
});
```

Convert with `make()`:

```javascript
bookBlueprint.make({
    title: 'The Name of the Wind',
    length: 662,
    genres: ['fantasy', 'fiction'],
    price: null,
    coverType: 'hardcover'
});
```

Resulting object:

```javascript
{
    title: 'The Name of the Wind',
    pages: 662,
    genres: ['fantasy', 'fiction'],
    price: null,
    isHardCover: true
}
```

## API

### Functions

#### `blueprint({ ...specification })` | `new Blueprint({ ...specification })`

Creates a blueprint object that serves as a model for the conversion and creation of objects of the same structure. `specification` should be an object that has the same keys as the intended target object. Its values should be [descriptors](#descriptors) or nested objects, nested blueprints, or nested factory functions.

Note that when you pass a nested object, blueprint or factory function, then you cannot chain modifiers to them, since they are only available to instances of the Descriptor class. In this case, wrap it with `$One(object|blueprint|factory)` and you are ready to go.

#### `blueprint(...).make({ ...raw })`

Factory function that creates a new instance (not in the OO-sense) of the blueprint as a transformation of the given raw object. Note that the ingoing object is not modified.

If any of the keys in the specification is missing from the raw object then a `MissingKeyError` will be thrown (you can change this with [modifiers](#modifiers)).

When `raw` is omitted (or provided as empty object) a [null object](https://en.wikipedia.org/wiki/Null_object_pattern) with empty default values will be created. Descriptors are signified with a `$` sign.

Refer to the [Descriptors](#descriptor) section to learn how each one behaves with regard to conversion and default values.

#### `factory({ ...specification })`

This serves as a convenient replacement for `blueprint(...).make`.

### Descriptors

Each descriptor characterizes one property of the target object. Descriptors start with a `$` to avoid collision with JavaScript primitive wrapper objects `String`, `Number`, `Boolean`. This section is work in progress.

#### `$Any(key, mutator)`

⏳

#### `$String(key, mutator)`

⏳

#### `$Number(key, mutator)`

⏳

#### `$Boolean(key, mutator)`

⏳

#### `$One(nested, key, mutator)`

⏳

#### `$Many(nested, key, mutator)`

⏳

### Modifiers

Modifiers can be chained to descriptors to alter their behaviour.

#### `.maybe`

When missing from the raw object (key not present OR value is `null` OR value is `undefined`), instead of causing a `MissingKeyError`, the property will be `null` in the converted object. This holds true even for `$String`, `$Number` and `$Boolean`.

#### `.optional`

Similar to `.maybe`, but the property will be omitted from the converted object.

#### `.default(value)`

Similar to `.maybe`, but instead of providing `null`, the given value will be used.

## License

[MIT](LICENSE) © 2021 Henning Schindler
