import {
    Descriptor,
    Blueprint,
    blueprint,
    factory,
    MissingKeyError,
    IllegalModifierError,
    DescriptorType
} from './internal';

const $Any = new Descriptor(DescriptorType.ANY);
const $String = new Descriptor(DescriptorType.STRING);
const $Number = new Descriptor(DescriptorType.NUMBER);
const $Boolean = new Descriptor(DescriptorType.BOOLEAN);
const $Date = new Descriptor(DescriptorType.DATE);
const $One = new Descriptor(DescriptorType.NESTED);
const $Many = new Descriptor(DescriptorType.ARRAY);

export {
    Blueprint,
    blueprint,
    factory,
    $Any,
    $String,
    $Number,
    $Boolean,
    $Date,
    $One,
    $Many,
    MissingKeyError,
    IllegalModifierError
};
