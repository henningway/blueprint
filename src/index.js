function extract(raw, descriptor) {
    return descriptor.type(raw[descriptor.key]);
}

class Blueprint {
    constructor(specification = {}) {
        this.specification = specification;
    }

    make(raw) {
        const result = {};

        Object.entries(this.specification).forEach(([key, descriptor]) => {
            if (typeof descriptor === 'function') descriptor = descriptor(key);

            result[key] = extract(raw, descriptor);
        });

        return result;
    }
}

class Descriptor {
    type(type) {
        this.type = type;
        return this;
    }

    key(key) {
        this.key = key;
        return this;
    }
}

$String = (key) => new Descriptor().type(String).key(key);
$Number = (key) => new Descriptor().type(Number).key(key);
$Boolean = (key) => new Descriptor().type(Boolean).key(key);

module.exports = { Blueprint, $String, $Number, $Boolean };
