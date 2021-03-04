import { MissingKeyError, IllegalModifierError } from './errors';
import Descriptor from './Descriptor';
import { Blueprint } from './Blueprint';

const $String = new Descriptor(String);
const $Number = new Descriptor(Number);
const $Boolean = new Descriptor(Boolean);
const $Many = new Descriptor();

const blueprint = (specification) => new Blueprint(specification);
const factory = (specification) => (raw) => blueprint(specification).make(raw);

export { Blueprint, blueprint, factory, $String, $Number, $Boolean, $Many, MissingKeyError, IllegalModifierError };
