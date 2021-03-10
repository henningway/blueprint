!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e="undefined"!=typeof globalThis?globalThis:e||self).Blueprint={})}(this,(function(e){"use strict";const t=function(e){return!["number","boolean"].includes(typeof e)&&([Object,Array].includes((e||{}).constructor)&&!Object.entries(e||{}).length)},s=function(e,t=""){if(!e){if(t=["Assertion failed",t].join(": "),"undefined"!=typeof Error)throw new Error(t);throw t}},r=class{constructor(e={}){return this.elements=e,new Proxy(this,{get:(e,t,s)=>Reflect.has(e,t)?Reflect.get(e,t,s):e.elements[t]})}has(e){return this.values.includes(e)}get values(){return Object.values(this.elements)}},i=class extends Error{constructor(e){super(`The key '${e}' is missing from the object to be converted.`),this.name="MissingKeyError"}},n=class extends Error{constructor(e=null){super(`'${e}' is not a valid modifier.`),this.name="IllegalModifierError"}},o=class extends Error{constructor(e){super(`Blueprint specification contains illegal element of type ${e}.`),this.name="BlueprintSpecificationError"}},c=Symbol("missing key or value"),a=new r({MAYBE:"maybe",OPTIONAL:"optional"}),h=new r({ANY:"ANY",STRING:"STRING",NUMBER:"NUMBER",BOOLEAN:"BOOLEAN",NESTED:"NESTED",ARRAY:"ARRAY"}),u=new r({PASS_THROUGH:"PASS_THROUGH",PRIMITIVE:"PRIMITIVE",DESCRIPTOR:"DESCRIPTOR",FACTORY:"FACTORY"});class l{constructor(e={}){this.specification=e}make(e={}){const s={},r=t(e);return Object.entries(this.specification).forEach((([t,i])=>{if(!(i instanceof d)){const e=typeof i;if(!(i instanceof l||"function"===e||"object"===e))throw new o(e);i=new d(h.NESTED)(i)}const n=new f(i.eject().setKey(t));if(r)return void(s[t]=n.makeNullValue());const a=n.extract(e);a!==c&&(s[t]=a)})),s}}class f{constructor(e){return this.descriptor=e.eject(),this}extract(e){if(this.descriptor.checkIsReady(),"object"==typeof e&&!e.hasOwnProperty(this.descriptor.key)){if(this.descriptor.hasDefault)return this.descriptor.defaultValue;if(this.descriptor.hasModifier(a.MAYBE))return null;if(this.descriptor.hasModifier(a.OPTIONAL))return c;throw new i(this.descriptor.key)}return this.convert(this.descriptor.hasKey?e[this.descriptor.key]:e)}convert(e){if([null,void 0].includes(e)){if(this.descriptor.hasModifier(a.MAYBE))return null;if(this.descriptor.hasModifier(a.OPTIONAL))return c}const t=this.applyMutator(this.caster);return this.descriptor.type===h.ARRAY?e.map((e=>t(e))):t(e)}get caster(){return this.descriptor.casterType===u.DESCRIPTOR?e=>new f(this.descriptor.caster).extract(e):this.descriptor.caster}applyMutator(e){return this.descriptor.hasMutator?t=>e(this.descriptor.mutator(t)):e}makeNullValue(){const e=(()=>{if(this.descriptor.hasDefault)return this.descriptor.defaultValue;switch(this.descriptor.type){case h.ARRAY:return[];case h.ANY:return null;default:return""}})();return this.convert(e)}}class d extends Function{constructor(e,t,s=!1){switch(super(),this.type=e,this.defaultValue=t,this.ejected=s,this.key=null,this.caster=null,this.mutator=null,this.modifiers=[],e){case h.ANY:this.caster=e=>e;break;case h.STRING:this.caster=String;break;case h.NUMBER:this.caster=Number;break;case h.BOOLEAN:this.caster=Boolean}return new Proxy(this,{get:(e,t,s)=>{if(Reflect.has(e,t))return Reflect.get(e,t,s);if(a.has(t))return(e=e.eject()).addModifier(t),e;if("default"===t)return e=e.eject(),t=>(e.defaultValue=t,e);if("string"==typeof t)throw new n(t)},apply:(e,t,s)=>e.ejected?Reflect.apply(e,t,s):(e=e.eject()).call(...s)})}call(...e){if(e.length>0)if(e[0]instanceof d)this.setCaster(e.shift());else if(e[0]instanceof Function)this.setCaster(e.shift());else if(e[0]instanceof l){const t=e.shift();this.setCaster((e=>t.make(e)))}else"object"==typeof e[0]&&this.setCaster(w(e.shift()));return e.length>0&&this.setKey(e.shift()),e.length>0&&this.setMutator(e.shift()),this}setCaster(e){return this.caster=e,this.checkCaster(),this}setKey(e){return s("string"==typeof e,"Key should be a string, but it is not."),t(this.key)&&(this.key=e),this}setMutator(e){return s("function"==typeof e,"Mutator should be a function, but it is not."),this.mutator=e,this}addModifier(e){this.modifiers.push(e)}checkType(){s(!t(this.type),"Descriptor type is not set."),s(h.has(this.type),"The descriptor type is not valid.")}checkCaster(){s(!t(this.caster),"Caster is not set."),s(u.has(this.casterType),"The caster is not valid.")}get hasKey(){return null!==this.key}hasModifier(e){return this.modifiers.includes(e)}get casterType(){if([String,Boolean,Number].includes(this.caster))return u.PRIMITIVE;if(this.caster instanceof d)return u.DESCRIPTOR;if(this.caster instanceof Function)return u.FACTORY;throw new Error("Caster is not set.")}get hasMutator(){return"function"==typeof this.mutator}checkIsReady(){s(this.ejected,"Descriptor has not been ejected."),this.checkType(),this.checkCaster()}get hasDefault(){return void 0!==this.defaultValue}eject(){return this.ejected?this:new d(this.type,this.defaultValue,!0)}}const p=new d(h.ANY),y=new d(h.STRING),R=new d(h.NUMBER),E=new d(h.BOOLEAN),A=new d(h.NESTED),T=new d(h.ARRAY),m=e=>new l(e),w=e=>t=>m(e).make(t);e.$Any=p,e.$Boolean=E,e.$Many=T,e.$Number=R,e.$One=A,e.$String=y,e.Blueprint=l,e.IllegalModifierError=n,e.MissingKeyError=i,e.blueprint=m,e.factory=w,Object.defineProperty(e,"__esModule",{value:!0})}));
