!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e="undefined"!=typeof globalThis?globalThis:e||self).Blueprint={})}(this,(function(e){"use strict";const t=function(e){return!["number","boolean"].includes(typeof e)&&([Object,Array].includes((e||{}).constructor)&&!Object.entries(e||{}).length)},r=function(e,t=""){if(!e){if(t=["Assertion failed",t].join(": "),"undefined"!=typeof Error)throw new Error(t);throw t}},i=new class{constructor(e={}){return this.elements=e,new Proxy(this,{get:(e,t,r)=>Reflect.has(e,t)?Reflect.get(e,t,r):e.elements[t]})}has(e){return this.values.includes(e)}get values(){return Object.values(this.elements)}}({MAYBE:"maybe",OPTIONAL:"optional"}),s=Symbol("missing key or value"),n=class extends Error{constructor(e,t){super(`The key '${e}' is missing from the object to be converted: ${JSON.stringify(t,null,2)}.`),this.name="MissingKeyError"}},o=class extends Error{constructor(e=null){super(`'${e}' is not a valid modifier.`),this.name="IllegalModifierError"}},c=class extends Error{constructor(e){super(`Blueprint specification contains illegal element of type ${e}.`),this.name="BlueprintSpecificationError"}};class a{_name;_convert;_makeNullValue;constructor(e,t,i){r("function"==typeof t,"Parameter 'convert' should be a function."),r("function"==typeof i,"Parameter 'makeNullValue' should be a function."),this._name=e,this._convert=t,this._makeNullValue=i,this._checkArities()}_checkArities(){r(2===this._convert.length),r(0===this._makeNullValue.length)}convert(e,t=(e=>e)){return this._convert(e,t)}makeNullValue(){return this._makeNullValue(this._convert)}}class u extends a{constructor(e,t,r){super(e,t,r)}_checkArities(){r(3===this._convert.length),r(1===this._makeNullValue.length)}convert(e,t,i=(e=>e)){return r("function"==typeof e),r("function"==typeof i),this._convert(e,t,i)}makeNullValue(e){return r("function"==typeof e),this._makeNullValue(e)}}const l=new a("AnyDescriptorType",((e,t)=>t(e)),(()=>null)),h=new a("StringDescriptorType",((e,t)=>String(t(e))),(()=>"")),f=new a("NumberDescriptorType",((e,t)=>Number(t(e))),(()=>0)),p=new a("BooleanDescriptorType",((e,t)=>Boolean(t(e))),(()=>!1)),d=new a("DateDescriptorType",((e,t)=>e instanceof Date?t(e):new Date(t(e))),(()=>new Date("1970-01-01"))),y=new u("NestedDescriptorType",((e,t,r)=>e(r(t))),(e=>e())),m=new u("ArrayDescriptorType",((e,t,r)=>t.map((t=>e(r(t))))),(e=>[]));class w{type;key;nested;defaultValue;mutator=e=>e;_modifiers=[];constructor(e){return this.type=e,new Proxy(this,{get:(e,t,r)=>Reflect.has(e,t)?Reflect.get(e,t,r):(e._addModifier(t),r)})}setKey(e){return r("string"==typeof e,"Key should be a string, but it is not."),t(this.key)&&(this.key=e),this}trySetNested(e){return[{condition:e=>e instanceof g,set:e=>this.nested=t=>new D(e.eject()).extract(t)},{condition:e=>e instanceof w,set:e=>this.nested=t=>new D(e).extract(t)},{condition:e=>e instanceof Function,set:e=>this.nested=e},{condition:e=>e instanceof _,set:e=>this.nested=t=>e.make(t)},{condition:e=>"object"==typeof e,set:e=>this.nested=b(e)}].some((t=>!!t.condition(e)&&(t.set(e),!0)))}default(e){return this.defaultValue=e,this}setMutator(e){r("function"==typeof e,"Mutator should be a function, but it is not."),this.mutator=e}_addModifier(e){if(r("string"==typeof e,"Modifier is expected to be of type string."),!i.has(e))throw new o(e);this._modifiers.push(e)}get hasKey(){return void 0!==this.key}get hasDefault(){return void 0!==this.defaultValue}hasModifier(e){return this._modifiers.includes(e)}checkIsReady(){this._checkType(),this.type instanceof u&&(r(!t(this.nested),"Descriptor has higher order type but is not nested."),r("function"==typeof this.nested,"Nested should be wrapped as a function."))}_checkType(){r(!t(this.type),"Descriptor type is not set."),r(this.type instanceof a,"The descriptor type is not valid.")}static fromSpecificationValue(e){if(e instanceof w)return e;if(e instanceof g)return e.eject();const t=new w(y);if(!t.trySetNested(e))throw new c(typeof e);return t}}class g extends Function{_type;constructor(e){return super(),this._type=e,new Proxy(this,{get:(e,t,r)=>e._get(e,t,r),apply:(e,t,r)=>e._call(...r)})}_get(e,t,r){if(Reflect.has(e,t))return Reflect.get(e,t,r);if(i.has(t)){const r=e.eject();return r._addModifier(t),r}if("default"===t){const t=e.eject();return e=>(t.default(e),t)}if("string"==typeof t)throw new o(t)}_call(...e){const t=this.eject();if(e.length<1)return t;if(t.type instanceof u&&!t.trySetNested(e.shift()))throw new c;return e.length<1?t:(t.setKey(e.shift()),e.length<1||t.setMutator(e.shift()),t)}eject(){return new w(this._type)}}class _{constructor(e={}){this.specification=e}make(e={}){const r={},i=t(e);return Object.entries(this.specification).forEach((([t,n])=>{const o=D.fromSpecificationEntry(t,n);if(i)return void(r[t]=o.makeNullValue());const c=o.extract(e);c!==s&&(r[t]=c)})),r}}const k=e=>new _(e),b=e=>t=>k(e).make(t);class D{constructor(e){return this.descriptor=e instanceof g?e.eject():e,this}extract(e){if(this.descriptor.checkIsReady(),this.descriptor.hasKey&&"object"==typeof e&&!e.hasOwnProperty(this.descriptor.key)){if(this.descriptor.hasDefault)return this.descriptor.defaultValue;if(this.descriptor.hasModifier(i.MAYBE))return null;if(this.descriptor.hasModifier(i.OPTIONAL))return s;throw new n(this.descriptor.key,e)}return this.convert(this.descriptor.hasKey?e[this.descriptor.key]:e)}convert(e){if([null,void 0].includes(e)){if(this.descriptor.hasModifier(i.MAYBE))return null;if(this.descriptor.hasModifier(i.OPTIONAL))return s}const t=this.descriptor.type;let r=t.convert.bind(t);return this.descriptor.type instanceof u?r(this.descriptor.nested,e,this.descriptor.mutator):r(e,this.descriptor.mutator)}makeNullValue(){this.descriptor.checkIsReady();const e=(()=>this.descriptor.hasDefault?this.descriptor.defaultValue:this.descriptor.type instanceof u?this.descriptor.type.makeNullValue(this.descriptor.nested):this.descriptor.type.makeNullValue())();return this.convert(e)}static fromSpecificationEntry(e,t){const r=w.fromSpecificationValue(t).setKey(e);return new D(r)}}const N=new g(l),v=new g(h),T=new g(f),M=new g(p),V=new g(d),x=new g(y),j=new g(m);e.$Any=N,e.$Boolean=M,e.$Date=V,e.$Many=j,e.$Number=T,e.$One=x,e.$String=v,e.AnyDescriptorType=l,e.ArrayDescriptorType=m,e.Blueprint=_,e.BooleanDescriptorType=p,e.DateDescriptorType=d,e.Descriptor=w,e.DescriptorProxy=g,e.Extractor=D,e.IllegalModifierError=o,e.MissingKeyError=n,e.Modifier=i,e.NestedDescriptorType=y,e.NumberDescriptorType=f,e.StringDescriptorType=h,e.blueprint=k,e.factory=b,Object.defineProperty(e,"__esModule",{value:!0})}));
