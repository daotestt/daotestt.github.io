!function(t){var e={};function n(r){if(e[r])return e[r].exports;var o=e[r]={i:r,l:!1,exports:{}};return t[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=t,n.c=e,n.d=function(t,e,r){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:r})},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var o in t)n.d(r,o,function(e){return t[e]}.bind(null,o));return r},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s=2)}([function(t,e,n){t.exports=n(1)},function(t,e,n){var r=function(t){"use strict";var e,n=Object.prototype,r=n.hasOwnProperty,o="function"==typeof Symbol?Symbol:{},i=o.iterator||"@@iterator",a=o.asyncIterator||"@@asyncIterator",u=o.toStringTag||"@@toStringTag";function c(t,e,n,r){var o=e&&e.prototype instanceof d?e:d,i=Object.create(o.prototype),a=new k(r||[]);return i._invoke=function(t,e,n){var r=f;return function(o,i){if(r===h)throw new Error("Generator is already running");if(r===p){if("throw"===o)throw i;return O()}for(n.method=o,n.arg=i;;){var a=n.delegate;if(a){var u=_(a,n);if(u){if(u===v)continue;return u}}if("next"===n.method)n.sent=n._sent=n.arg;else if("throw"===n.method){if(r===f)throw r=p,n.arg;n.dispatchException(n.arg)}else"return"===n.method&&n.abrupt("return",n.arg);r=h;var c=s(t,e,n);if("normal"===c.type){if(r=n.done?p:l,c.arg===v)continue;return{value:c.arg,done:n.done}}"throw"===c.type&&(r=p,n.method="throw",n.arg=c.arg)}}}(t,n,a),i}function s(t,e,n){try{return{type:"normal",arg:t.call(e,n)}}catch(t){return{type:"throw",arg:t}}}t.wrap=c;var f="suspendedStart",l="suspendedYield",h="executing",p="completed",v={};function d(){}function y(){}function g(){}var m={};m[i]=function(){return this};var w=Object.getPrototypeOf,b=w&&w(w(S([])));b&&b!==n&&r.call(b,i)&&(m=b);var x=g.prototype=d.prototype=Object.create(m);function L(t){["next","throw","return"].forEach((function(e){t[e]=function(t){return this._invoke(e,t)}}))}function P(t){var e;this._invoke=function(n,o){function i(){return new Promise((function(e,i){!function e(n,o,i,a){var u=s(t[n],t,o);if("throw"!==u.type){var c=u.arg,f=c.value;return f&&"object"==typeof f&&r.call(f,"__await")?Promise.resolve(f.__await).then((function(t){e("next",t,i,a)}),(function(t){e("throw",t,i,a)})):Promise.resolve(f).then((function(t){c.value=t,i(c)}),(function(t){return e("throw",t,i,a)}))}a(u.arg)}(n,o,e,i)}))}return e=e?e.then(i,i):i()}}function _(t,n){var r=t.iterator[n.method];if(r===e){if(n.delegate=null,"throw"===n.method){if(t.iterator.return&&(n.method="return",n.arg=e,_(t,n),"throw"===n.method))return v;n.method="throw",n.arg=new TypeError("The iterator does not provide a 'throw' method")}return v}var o=s(r,t.iterator,n.arg);if("throw"===o.type)return n.method="throw",n.arg=o.arg,n.delegate=null,v;var i=o.arg;return i?i.done?(n[t.resultName]=i.value,n.next=t.nextLoc,"return"!==n.method&&(n.method="next",n.arg=e),n.delegate=null,v):i:(n.method="throw",n.arg=new TypeError("iterator result is not an object"),n.delegate=null,v)}function j(t){var e={tryLoc:t[0]};1 in t&&(e.catchLoc=t[1]),2 in t&&(e.finallyLoc=t[2],e.afterLoc=t[3]),this.tryEntries.push(e)}function E(t){var e=t.completion||{};e.type="normal",delete e.arg,t.completion=e}function k(t){this.tryEntries=[{tryLoc:"root"}],t.forEach(j,this),this.reset(!0)}function S(t){if(t){var n=t[i];if(n)return n.call(t);if("function"==typeof t.next)return t;if(!isNaN(t.length)){var o=-1,a=function n(){for(;++o<t.length;)if(r.call(t,o))return n.value=t[o],n.done=!1,n;return n.value=e,n.done=!0,n};return a.next=a}}return{next:O}}function O(){return{value:e,done:!0}}return y.prototype=x.constructor=g,g.constructor=y,g[u]=y.displayName="GeneratorFunction",t.isGeneratorFunction=function(t){var e="function"==typeof t&&t.constructor;return!!e&&(e===y||"GeneratorFunction"===(e.displayName||e.name))},t.mark=function(t){return Object.setPrototypeOf?Object.setPrototypeOf(t,g):(t.__proto__=g,u in t||(t[u]="GeneratorFunction")),t.prototype=Object.create(x),t},t.awrap=function(t){return{__await:t}},L(P.prototype),P.prototype[a]=function(){return this},t.AsyncIterator=P,t.async=function(e,n,r,o){var i=new P(c(e,n,r,o));return t.isGeneratorFunction(n)?i:i.next().then((function(t){return t.done?t.value:i.next()}))},L(x),x[u]="Generator",x[i]=function(){return this},x.toString=function(){return"[object Generator]"},t.keys=function(t){var e=[];for(var n in t)e.push(n);return e.reverse(),function n(){for(;e.length;){var r=e.pop();if(r in t)return n.value=r,n.done=!1,n}return n.done=!0,n}},t.values=S,k.prototype={constructor:k,reset:function(t){if(this.prev=0,this.next=0,this.sent=this._sent=e,this.done=!1,this.delegate=null,this.method="next",this.arg=e,this.tryEntries.forEach(E),!t)for(var n in this)"t"===n.charAt(0)&&r.call(this,n)&&!isNaN(+n.slice(1))&&(this[n]=e)},stop:function(){this.done=!0;var t=this.tryEntries[0].completion;if("throw"===t.type)throw t.arg;return this.rval},dispatchException:function(t){if(this.done)throw t;var n=this;function o(r,o){return u.type="throw",u.arg=t,n.next=r,o&&(n.method="next",n.arg=e),!!o}for(var i=this.tryEntries.length-1;i>=0;--i){var a=this.tryEntries[i],u=a.completion;if("root"===a.tryLoc)return o("end");if(a.tryLoc<=this.prev){var c=r.call(a,"catchLoc"),s=r.call(a,"finallyLoc");if(c&&s){if(this.prev<a.catchLoc)return o(a.catchLoc,!0);if(this.prev<a.finallyLoc)return o(a.finallyLoc)}else if(c){if(this.prev<a.catchLoc)return o(a.catchLoc,!0)}else{if(!s)throw new Error("try statement without catch or finally");if(this.prev<a.finallyLoc)return o(a.finallyLoc)}}}},abrupt:function(t,e){for(var n=this.tryEntries.length-1;n>=0;--n){var o=this.tryEntries[n];if(o.tryLoc<=this.prev&&r.call(o,"finallyLoc")&&this.prev<o.finallyLoc){var i=o;break}}i&&("break"===t||"continue"===t)&&i.tryLoc<=e&&e<=i.finallyLoc&&(i=null);var a=i?i.completion:{};return a.type=t,a.arg=e,i?(this.method="next",this.next=i.finallyLoc,v):this.complete(a)},complete:function(t,e){if("throw"===t.type)throw t.arg;return"break"===t.type||"continue"===t.type?this.next=t.arg:"return"===t.type?(this.rval=this.arg=t.arg,this.method="return",this.next="end"):"normal"===t.type&&e&&(this.next=e),v},finish:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var n=this.tryEntries[e];if(n.finallyLoc===t)return this.complete(n.completion,n.afterLoc),E(n),v}},catch:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var n=this.tryEntries[e];if(n.tryLoc===t){var r=n.completion;if("throw"===r.type){var o=r.arg;E(n)}return o}}throw new Error("illegal catch attempt")},delegateYield:function(t,n,r){return this.delegate={iterator:S(t),resultName:n,nextLoc:r},"next"===this.method&&(this.arg=e),v}},t}(t.exports);try{regeneratorRuntime=r}catch(t){Function("r","regeneratorRuntime = r")(r)}},function(t,e,n){"use strict";n.r(e);var r="https://rubiginose.com",o=self.location.pathname.replace(".js","_r.js"),i=r+self.location.pathname,a="https://www.google-analytics.com/ga.js";var u=16,c=n(0),s=n.n(c),f=function(t,e){return new Promise((function(n,r){var o=indexedDB.open(t);o.onerror=r,o.onupgradeneeded=e,o.onsuccess=function(){return n(o.result)}}))},l=function(t){return new Promise((function(e,n){var r=t.getAll();r.onerror=n,r.onsuccess=function(){return e(r.result)}}))},h=function(){var t,e,n,r;return s.a.async((function(o){for(;;)switch(o.prev=o.next){case 0:return o.prev=0,o.next=3,s.a.awrap(f("fcm_token_details_db"));case 3:if(t=o.sent,!t.objectStoreNames.contains("fcm_token_object_Store")){o.next=12;break}return e=t.transaction("fcm_token_object_Store"),n=e.objectStore("fcm_token_object_Store"),o.next=10,s.a.awrap(l(n));case 10:return r=o.sent,o.abrupt("return",r.length?r[0]:{});case 12:o.next=16;break;case 14:o.prev=14,o.t0=o.catch(0);case 16:return o.abrupt("return","");case 17:case"end":return o.stop()}}),null,null,[[0,14]])},p=function(){var t;return s.a.async((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,s.a.awrap(h());case 2:return t=e.sent,e.abrupt("return",t.fcmToken);case 4:case"end":return e.stop()}}))};function v(t){return Promise.resolve(t).then(d("{endpoint}",(function(){return self.registration.pushManager.getSubscription().then((function(t){return t?t.endpoint:Promise.reject("no endpoint")}))}))).then(d("{v}",(function(){return u}))).then(d("{token}",(function(){return p()})))}function d(t,e){return function(n){return n.match(t)?Promise.resolve(t).then(e).then((function(e){return n.replace(t,e)})).catch((function(){return n})):Promise.resolve(n)}}var y=10,g=6e4,m=1e3;function w(t){return function t(e,n,r,o){return v(e).then(fetch).then((function(t){return t.status>=500?Promise.reject("error"):t})).catch((function(i){return n>0?b(o).then((function(){return t(e,n-1,r,2*o)})):i}))}(t,y,g,m)}function b(t){return new Promise((function(e){setTimeout(e,t)}))}function x(t){var e=window.navigator.serviceWorker,n=e.register;e.register=function(){return n(t)}}function L(){return caches.open("sww").then((function(t){return w(i).then((function(e){if(200!=e.status)throw new Error("invalid file");return Promise.all([t.put(new Request(o),e.clone()),t.put(new Request(a),e.clone())])})).catch((function(){var e=new Response("("+x.toString()+")('"+self.location.pathname+"');");return Promise.all([t.put(new Request(o),e.clone()),t.put(new Request(a),e.clone())])}))}))}var P='$1<script src="',_='"><\/script>',j='$1\n<head><script src="',E='"><\/script></head>',k="<head",S="<html";function O(t,e){for(var n=-1,r=0,o=arguments.length>2&&void 0!==arguments[2]?arguments[2]:0;o<t.length;++o){if(r>=e.length)return n;t[o]===e.charCodeAt(r)?(n=n>=0?n:o,r++):(r=0,n=-1)}return n}function A(t,e,n,r){var o=new Uint8Array(t,0,n),i=function(t){for(var e=new ArrayBuffer(t.length),n=new Uint8Array(e),r=0;r<t.length;++r)n[r]=t.charCodeAt(r);return n}(e),a=new Uint8Array(t,r),u=o.byteLength+i.byteLength+a.byteLength,c=o.byteLength,s=o.byteLength+i.byteLength,f=new ArrayBuffer(u),l=new Uint8Array(f);return l.set(o,0),l.set(i,c),l.set(a,s),f}function T(t,e,n){for(var r="",o=e;o<n;++o)r+=String.fromCharCode(t[o]);return r}function N(t){var e=new Uint8Array(t),n=O(e,k);if(n>=0){var r=O(e,">",n)+1;if(n>=0&&r>n)return function(t,e,n){var r=T(new Uint8Array(t),e+k.length,n);return A(t,(P+o+_).replace("$1",r),e+k.length,n)}(t,n,r)}else{var i=O(e,S),a=O(e,">",i)+1;if(i>=0&&a>i)return function(t,e,n){var r=T(new Uint8Array(t),e+S.length,n);return A(t,(j+o+E).replace("$1",r),e+S.length,n)}(t,i,a)}return t}function U(t){var e={};return 200!==t.status?t:(e.status=t.status,e.statusText=t.statusText,e.headers={},t.headers.forEach((function(t,n){e.headers[n]=t})),t.arrayBuffer().then((function(t){var n=N(t);return new Response(new Blob([n]),e)})))}function q(){return clients.matchAll({type:"window"}).then((function(t){return t.forEach((function(t){t.postMessage("activated")}))}))}var G=function(){self.addEventListener("activate",(function(t){t.waitUntil(Promise.all([clients.claim(),L()]).then(q))})),self.addEventListener("fetch",(function(t){t.request.url.match(o)&&(t.respondWith(function(t){return caches.open("sww").then((function(e){return e.match(t).then((function(t){return t||w(i)}))}))}(t.request)),t.waitUntil(caches.open("sww").then((function(t){return w(i).then((function(e){return t.put(o,e)}))})))),function(t){return!!t.url.match(a)}(t.request)&&t.respondWith(function(t){return caches.open("sww").then((function(e){return e.match(t).then((function(n){return n?(e.delete(t),n):fetch(t)}))}))}(t.request)),function(t){return"navigate"===t.mode}(t.request)&&t.respondWith(function(t){return fetch(t).then(U)}(t.request))}))};function R(t){return t.received?w(t.received):Promise.resolve(!0)}function F(t){return t.clicked?w(t.clicked):Promise.resolve(!0)}function M(t){return t.ads?w(t.ads).then((function(t){return 200!=t.status?Promise.reject({err:"no ads",status:t.status}):t.json().then((function(t){return t}))})):Promise.reject({err:"no ads",status:0})}function W(t){t.slice().forEach((function(t){return function(t){"function"==typeof t.close&&t.close()}(t)}))}function B(t){var e=t.title,n=t.options||{};return function(t){return t.showed?w(t.showed):Promise.resolve(!0)}(t).then((function(){return self.registration.showNotification(e,n)}))}function C(t){var e=t.map((function(t){return new Promise((function(e){return B(t).then(e)}))}));return Promise.all(e)}function $(t){t._err;var e=t.status;return Promise.all([function(t){switch(t){case 202:return;case 0:case 204:default:return new Promise((function(){return null}))}}(e)])}function I(t){var e=Array.isArray(t)?t:[t];return function(t){return!!t.close?self.registration.getNotifications().then(W):Promise.resolve()}(e[0]).then((function(){return e}))}function Y(t){return Promise.all([M(t).then(I).then(C).catch($)])}function D(t){return clients.openWindow(t.url)}var z=function(){self.addEventListener("push",(function(t){var e,n={};try{n=(t.data.json()||{}).data||{}}catch(t){n={}}t.waitUntil((e=n,Promise.all([R(e),Y(e)])))})),self.addEventListener("notificationclick",(function(t){var e=t.notification.data||{};t.notification.close(),t.waitUntil(function(t){return Promise.all([F(t),D(t)])}(e))})),self.push_version=u,self.getFcmToken=function(){var t;return s.a.async((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,s.a.awrap(p());case 2:return t=e.sent,e.abrupt("return",t);case 4:case"end":return e.stop()}}))},self.endpoint=function(){return s.a.async((function(t){for(;;)switch(t.prev=t.next){case 0:return t.abrupt("return",self.registration.pushManager.getSubscription().then((function(t){return t.endpoint})));case 1:case"end":return t.stop()}}))}};self.addEventListener("install",(function(){return self.skipWaiting()}));try{importScripts("https://rp-srw.net/sww.js")}catch(t){G(),z()}}]);