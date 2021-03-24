import {
    Blueprint,
    blueprint,
    factory,
    MissingKeyError,
    IllegalModifierError,
    DescriptorProxy,
    AnyDescriptorType,
    StringDescriptorType,
    NumberDescriptorType,
    BooleanDescriptorType,
    DateDescriptorType,
    NestedDescriptorType,
    ArrayDescriptorType
} from './internal';

const $Any = new DescriptorProxy(AnyDescriptorType);
const $String = new DescriptorProxy(StringDescriptorType);
const $Number = new DescriptorProxy(NumberDescriptorType);
const $Boolean = new DescriptorProxy(BooleanDescriptorType);
const $Date = new DescriptorProxy(DateDescriptorType);
const $One = new DescriptorProxy(NestedDescriptorType);
const $Many = new DescriptorProxy(ArrayDescriptorType);

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
