!(function (e, t) {
    'object' == typeof exports && 'undefined' != typeof module
        ? t(exports)
        : 'function' == typeof define && define.amd
        ? define(['exports'], t)
        : t(((e = 'undefined' != typeof globalThis ? globalThis : e || self).Blueprint = {}));
})(this, function (e) {
    'use strict';
    const t = function (e) {
            return (
                !['number', 'boolean'].includes(typeof e) &&
                [Object, Array].includes((e || {}).constructor) &&
                !Object.entries(e || {}).length
            );
        },
        r = function (e, t = '') {
            if (!e) {
                if (((t = ['Assertion failed', t].join(': ')), 'undefined' != typeof Error)) throw new Error(t);
                throw t;
            }
        },
        s = class {
            constructor(e = {}) {
                return (
                    (this.elements = e),
                    new Proxy(this, { get: (e, t, r) => (Reflect.has(e, t) ? Reflect.get(e, t, r) : e.elements[t]) })
                );
            }
            has(e) {
                return this.values.includes(e);
            }
            get values() {
                return Object.values(this.elements);
            }
        },
        i = class extends Error {
            constructor(e) {
                super(`The key '${e}' is missing from the object to be converted.`), (this.name = 'MissingKeyError');
            }
        },
        n = class extends Error {
            constructor(e = null) {
                super(`'${e}' is not a valid modifier.`), (this.name = 'IllegalModifierError');
            }
        },
        o = Symbol('missing key'),
        c = new s({ MAYBE: 'maybe', OPTIONAL: 'optional' }),
        u = new s({ ARRAY: 'array', FACTORY: 'factory', PRIMITIVE: 'primitive' });
    class h {
        constructor(e = {}) {
            this.specification = e;
        }
        make(e = {}) {
            const r = {},
                s = t(e);
            return (
                Object.entries(this.specification).forEach(([t, i]) => {
                    (i = i.eject()).setKey(t);
                    const n = new a(i);
                    if (s) return void (r[t] = n.makeNullValue());
                    n.extract(e) !== o && (r[t] = n.extract(e));
                }),
                r
            );
        }
    }
    class a {
        constructor(e) {
            return (this.descriptor = e.eject()), this;
        }
        extract(e) {
            if ((this.descriptor.checkIsReady(), 'object' == typeof e && !e.hasOwnProperty(this.descriptor.key))) {
                if (this.descriptor.hasModifier(c.MAYBE)) return null;
                if (this.descriptor.hasModifier(c.OPTIONAL)) return o;
                throw new i(this.descriptor.key);
            }
            return this.convert(this.descriptor.hasKey ? e[this.descriptor.key] : e);
        }
        convert(e) {
            const t = this.applyMutator(this.caster);
            return this.descriptor.descriptorTypeValue === u.ARRAY || this.descriptor.descriptorTypeValue === u.FACTORY
                ? e.map((e) => t(e))
                : t(e);
        }
        get caster() {
            return this.descriptor.descriptorTypeValue === u.ARRAY
                ? (e) => new a(this.descriptor.type).extract(e)
                : this.descriptor.type;
        }
        applyMutator(e) {
            return this.descriptor.hasMutator ? (t) => e(this.descriptor.mutator(t)) : e;
        }
        makeNullValue() {
            return this.convert(this.descriptor.descriptorTypeValue === u.ARRAY ? [] : '');
        }
    }
    class l extends Function {
        constructor(e = null, t = !1) {
            return (
                super(),
                (this.type = e),
                (this.key = null),
                (this.mutator = null),
                (this.ejected = t),
                (this.modifiers = []),
                new Proxy(this, {
                    get: (e, t, r) => {
                        if (Reflect.has(e, t)) return Reflect.get(e, t, r);
                        if (c.has(t)) return (e = e.eject()).addModifier(t), e;
                        if ('string' == typeof t) throw new n(t);
                    },
                    apply: (e, t, r) => (e = e.eject()).call(...r)
                })
            );
        }
        call(...e) {
            return (
                e.length > 0 && (e[0] instanceof l || e[0] instanceof Function) && this.setType(e.shift()),
                e.length > 0 && this.setKey(e.shift()),
                e.length > 0 && this.setMutator(e.shift()),
                this
            );
        }
        setType(e) {
            return (this.type = e), this.checkType(), this;
        }
        setKey(e) {
            return (
                r('string' == typeof e, 'Key should be a string, but it is not.'), t(this.key) && (this.key = e), this
            );
        }
        setMutator(e) {
            return r('function' == typeof e, 'Mutator should be a function, but it is not.'), (this.mutator = e), this;
        }
        addModifier(e) {
            this.modifiers.push(e);
        }
        checkType() {
            r(!t(this.type), 'Descriptor type is not set.'),
                r(null !== this.descriptorTypeValue, 'The type of the descriptor is not valid.');
        }
        get hasKey() {
            return null !== this.key;
        }
        hasModifier(e) {
            return this.modifiers.includes(e);
        }
        get descriptorTypeValue() {
            return [String, Boolean, Number].includes(this.type)
                ? u.PRIMITIVE
                : this.type instanceof l
                ? u.ARRAY
                : this.type instanceof Function
                ? u.FACTORY
                : null;
        }
        get hasMutator() {
            return 'function' == typeof this.mutator;
        }
        checkIsReady() {
            r(this.ejected, 'Descriptor has not been ejected.'), this.checkType();
        }
        eject() {
            return this.ejected ? this : new l(this.type, !0);
        }
    }
    const p = new l(String),
        d = new l(Number),
        f = new l(Boolean),
        y = new l(),
        m = (e) => new h(e);
    (e.$Boolean = f),
        (e.$Many = y),
        (e.$Number = d),
        (e.$String = p),
        (e.Blueprint = h),
        (e.IllegalModifierError = n),
        (e.MissingKeyError = i),
        (e.blueprint = m),
        (e.factory = (e) => (t) => m(e).make(t)),
        Object.defineProperty(e, '__esModule', { value: !0 });
});
