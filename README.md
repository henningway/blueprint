# Blueprint

![ci status](https://github.com/henningway/blueprint/actions/workflows/main.yml/badge.svg)
![bundle size](https://badgen.net/bundlephobia/minzip/@henningway/blueprint)
![npm version](https://badgen.net/npm/v/@henningway/blueprint)

Declarative object creation and conversion for JavaScript.

## Contents

-   [Install](#install)
-   [Usage](#usage)
-   [Features](#features)
-   [Example](#example)

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

> Describe your conversion with the likes of `$String`, `$Number`, `$Many($String)` etc. You can provide alternate keys, transformation functions, defaults, and more - without sacrificing legibilty.

**Nesting**

> Nest blueprints in various ways to build complex structures without sweating.

**Null Objects**

> Use Blueprints to easily generate null objects with empty default values.

**Simple Validation**

> Missing keys result in early failure.

🚧 Feature needs work: Will support basic checks for type mismatches in the future. 🚧

**Light**

> No dependencies, small size.

**Disclaimer:** While descriptors like `$String` signal _type system_, blueprint is not a replacement for Typescript.

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

## License

[MIT](LICENSE) © 2021 Henning Schindler
