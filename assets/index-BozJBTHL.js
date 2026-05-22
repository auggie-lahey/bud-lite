var Co=Object.defineProperty;var Ro=(e,t,n)=>t in e?Co(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n;var E=(e,t,n)=>Ro(e,typeof t!="symbol"?t+"":t,n);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))a(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const s of i.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&a(s)}).observe(document,{childList:!0,subtree:!0});function n(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(o){if(o.ep)return;o.ep=!0;const i=n(o);fetch(o.href,i)}})();function Uo(e){const t={...e},n=new Map;return{getState(){return t},subscribe(a,o){return n.has(a)||n.set(a,new Set),n.get(a).add(o),()=>{var i;return(i=n.get(a))==null?void 0:i.delete(o)}},setState(a){const o={...t};Object.assign(t,a);for(const i of Object.keys(a))if(t[i]!==o[i]&&n.has(i))for(const s of n.get(i))try{s(t[i],o[i])}catch(r){console.error(`[store] listener error for "${i}":`,r)}}}}function Mo(e,t){let n=null,a=null;function o(){const s=location.hash.replace(/^#/,"")||"/";for(const{pattern:c,handler:l}of e){const d=s.match(c);if(d){if(n){try{n()}catch(g){console.error("[router] cleanup error:",g)}n=null}const p=d.slice(1),f=l(p,t);typeof f=="function"&&(n=f),a&&a(s);return}}if(n){try{n()}catch{}n=null}const r=document.querySelector("main");r&&(r.innerHTML='<div class="mx-auto max-w-[1280px] px-4 py-12 text-center text-zinc-500">Page not found.</div>'),a&&a(s)}return window.addEventListener("hashchange",o),o(),{destroy:()=>window.removeEventListener("hashchange",o),set onNavigate(s){a=s}}}function un(e,t=1e4){return new Promise((n,a)=>{const o=new WebSocket(e),i=setTimeout(()=>{o.close(),a(new Error("timeout"))},t);o.onopen=()=>{clearTimeout(i),n(o)},o.onerror=()=>{clearTimeout(i),a(new Error("ws error"))}})}async function ha(e,t,n=8e3){const a=e.map(async o=>{const i=await un(o,n);return new Promise((s,r)=>{const c=setTimeout(()=>{i.close(),r(new Error("timeout"))},n);i.onmessage=l=>{const d=JSON.parse(l.data);d[0]==="EVENT"&&d[2]&&(clearTimeout(c),i.close(),s(d[2])),d[0]==="EOSE"&&(clearTimeout(c),i.close(),s(null))},i.onerror=()=>{clearTimeout(c),r(new Error("ws error"))},i.send(JSON.stringify(["REQ","rq-"+Date.now(),t]))})});try{return await Promise.any(a)}catch{return null}}async function _t(e,t,n,a=15e3){const o="cq-"+Date.now(),i=await Promise.allSettled(e.map(async c=>{const l=await un(c,a);return new Promise(d=>{const p=setTimeout(()=>{l.close(),d([])},a),f=[];l.onmessage=g=>{const v=JSON.parse(g.data);if(v[0]==="EVENT"&&v[2]){f.push(v[2]);try{n(v[2])}catch(h){console.error("[relay] onEvent error:",h)}}v[0]==="EOSE"&&(clearTimeout(p),l.close(),d(f))},l.onerror=()=>{clearTimeout(p),d(f)},l.send(JSON.stringify(["REQ",o,t]))})})),s=new Set,r=[];for(const c of i)if(c.status==="fulfilled")for(const l of c.value)s.has(l.id)||(s.add(l.id),r.push(l));return r}async function ot(e,t){const n=await Promise.allSettled(t.map(async a=>{const o=await un(a,1e4);return new Promise((i,s)=>{const r=setTimeout(()=>{o.close(),s(new Error("timeout"))},1e4);o.onmessage=c=>{const l=JSON.parse(c.data);l[0]==="OK"&&(clearTimeout(r),o.close(),i(l[2]===!0)),l[0]==="NOTICE"&&(clearTimeout(r),o.close(),s(new Error(l[1])))},o.onerror=()=>{clearTimeout(r),s(new Error("ws error"))},o.send(JSON.stringify(["EVENT",e]))})}));return t.map((a,o)=>{var i;return{url:a,ok:n[o].status==="fulfilled"&&n[o].value===!0,message:n[o].status==="rejected"?(i=n[o].reason)==null?void 0:i.message:void 0}})}const ga="ia-settings",an={archiverNpub:"npub172jyyndrmwfqlz7p4mtp2kftwhgawae2xqr3vx4s4elht5ddx4hsf3qcs",blossomUrl:"https://blossom.primal.net",blossomMirror:"https://nostr.download",relays:"wss://nos.lol, wss://relay.damus.io, wss://relay.ngit.dev",manifestDtag:"archive",ragBackendUrl:"",qdrantUrl:"",qdrantApiKey:"",qdrantCollection:"nostr_rag",hfApiKey:"",llmApiKey:"",llmBaseUrl:"https://api.z.ai/api/coding/paas/v4",llmModel:"GLM-5.1",groqApiKey:"",geminiApiKey:""};function ke(){try{const e=JSON.parse(localStorage.getItem(ga)||"{}"),t={...an,...e};return t.qdrantCollection==="nostr-rag"&&(t.qdrantCollection="nostr_rag"),(t.llmBaseUrl==="https://api.anthropic.com"||t.llmBaseUrl==="https://api.z.ai/api/paas/v4")&&(t.llmBaseUrl="https://api.z.ai/api/coding/paas/v4"),mn(t),t}catch{return{...an}}}function mn(e){localStorage.setItem(ga,JSON.stringify(e))}function st(){return ke().relays.split(",").map(e=>e.trim()).filter(Boolean)}function kt(){return(ke().blossomUrl||an.blossomUrl).replace(/\/$/,"")}async function Ut(e){const t=await crypto.subtle.digest("SHA-256",e);return Array.from(new Uint8Array(t)).map(n=>n.toString(16).padStart(2,"0")).join("")}function No(e){const t="qpzry9x8gf2tvdw0s3jn54khce6mua7l",n=e.lastIndexOf("1");e.slice(0,n);const a=[];for(const i of e.slice(n+1))a.push(t.indexOf(i));const o=Do(a.slice(0,-6),5,8);return Array.from(o).map(i=>i.toString(16).padStart(2,"0")).join("")}function Do(e,t,n,a){let o=0,i=0;const s=[],r=(1<<n)-1;for(const c of e)for(o=o<<t|c,i+=t;i>=n;)i-=n,s.push(o>>i&r);return s}async function on(e){const t=e.map(([,n,a])=>`${n} ${a}`).sort();return Ut(new TextEncoder().encode(t.join(`
`)))}async function bt(e,t,n){return ha(n,{kinds:[35128],authors:[e],"#d":[t],limit:1})}function it(e){try{return JSON.parse(e||"{}").entries||{}}catch{return{}}}function fn(e){const t=[],n=new Set,a=it(e.content);for(const[i,s]of Object.entries(a))n.has(i)||(n.add(i),t.push({title:s.title||i.split("/").pop(),sha256:s.sha256,mime:s.mime,size:s.size,added:s.added||e.created_at,path:i,manifestId:e.id,manifestPubkey:e.pubkey,topics:s.topics||[],source:s.source||null,bridgeEventId:s.bridge_event_id||null,indexEventId:s.index_event_id||null}));const o=(e.tags||[]).filter(i=>i[0]==="path"&&i[1]&&i[2]);for(const[,i,s]of o)n.has(i)||(n.add(i),t.push({title:i.split("/").pop(),sha256:s,mime:jo(i),size:0,added:e.created_at,path:i,manifestId:e.id,manifestPubkey:e.pubkey,topics:[],source:null,bridgeEventId:null,indexEventId:null}));return t}function jo(e){const t=(e.split(".").pop()||"").toLowerCase();return{html:"text/html",htm:"text/html",css:"text/css",js:"text/javascript",json:"application/json",xml:"text/xml",yaml:"text/yaml",yml:"text/yaml",txt:"text/plain",md:"text/plain",csv:"text/csv",pdf:"application/pdf",epub:"application/epub+zip",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",webp:"image/webp",svg:"image/svg+xml",ico:"image/x-icon",mp3:"audio/mpeg",wav:"audio/wav",ogg:"audio/ogg",flac:"audio/flac",mp4:"video/mp4",webm:"video/webm",mkv:"video/x-matroska",avi:"video/x-msvideo",zip:"application/zip",tar:"application/x-tar",gz:"application/gzip",exe:"application/x-msdownload",dmg:"application/x-apple-diskimage"}[t]||"application/octet-stream"}function sn(e){return JSON.stringify({schema:"nostr-archive/v1",entries:e},null,2)+`
`}function rn(e){return Object.entries(e).map(([t,n])=>["path",t,n.sha256])}const ya=["wss://nos.lol","wss://relay.damus.io","wss://relay.nostr.band"];function ba(e){try{const t=JSON.parse(e);return{name:t.name||t.display_name,picture:t.picture,about:t.about,nip05:t.nip05}}catch{return null}}async function Oo(e,t=ya){const n={kinds:[0],authors:[e],limit:1};for(const a of t)try{const o=new WebSocket(a),i=await new Promise((s,r)=>{const c=setTimeout(()=>{o.close(),r("timeout")},4e3);o.onopen=()=>o.send(JSON.stringify(["REQ","meta-"+Date.now(),n])),o.onmessage=l=>{const d=JSON.parse(l.data);d[0]==="EVENT"&&d[2]&&(clearTimeout(c),o.close(),s(d[2])),d[0]==="EOSE"&&(clearTimeout(c),o.close(),s(null))},o.onerror=()=>{clearTimeout(c),r("ws error")}});if(i){const s=ba(i.content);if(s)return s}}catch{continue}return null}async function Bo(e,t=ya){const n=new Map;if(e.length===0)return n;const a=[...new Set(e)];await _t(t,{kinds:[0],authors:a,limit:a.length},o=>{const i=ba(o.content);if(i){const s=n.get(o.pubkey);(!s||o.created_at>(s._created_at||0))&&n.set(o.pubkey,{...i,_created_at:o.created_at})}});for(const[,o]of n)delete o._created_at;return n}async function qo(e,t){try{const n=await ha(t,{kinds:[3],authors:[e],limit:1});return!n||!n.tags?[]:n.tags.filter(a=>a[0]==="p"&&a[1]).map(a=>a[1])}catch{return[]}}function Fo(e,t){let n=null;const a=[];async function o(h){const x=["wss://nos.lol","wss://relay.damus.io","wss://relay.nostr.band"],S={kinds:[0],authors:[h],limit:1};for(const $ of x)try{const C=new WebSocket($),A=await new Promise((L,R)=>{const j=setTimeout(()=>{C.close(),R("timeout")},4e3);C.onopen=()=>C.send(JSON.stringify(["REQ","meta-"+Date.now(),S])),C.onmessage=W=>{const w=JSON.parse(W.data);w[0]==="EVENT"&&w[2]&&(clearTimeout(j),C.close(),L(w[2])),w[0]==="EOSE"&&(clearTimeout(j),C.close(),L(null))},C.onerror=()=>{clearTimeout(j),R("ws error")}});if(A)try{const L=JSON.parse(A.content);return{name:L.name||L.display_name,picture:L.picture,about:L.about,nip05:L.nip05}}catch{}}catch{continue}return null}function i(h){return(h||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function s(h){return(h||"").replace(/"/g,"&quot;").replace(/</g,"&lt;")}function r(){if(!n){e.innerHTML='<div id="ia-login-prompt">Login</div>',e.title="Click to login with NIP-07";return}const h=n.picture?`<img id="ia-login-pfp" src="${s(n.picture)}" onerror="this.outerHTML='<div id=\\'ia-login-pfp\\' style=\\'display:flex;align-items:center;justify-content:center;font-size:0.9rem;color:#6ee7b7\\'>&#9786;</div>'">`:'<div id="ia-login-pfp" style="display:flex;align-items:center;justify-content:center;font-size:0.9rem;color:#6ee7b7">&#9786;</div>',x=n.name||n.pubkey.slice(0,12)+"...";e.innerHTML=`${h}<div id="ia-login-name">${i(x)}</div><div style="color:#555;font-size:0.7rem;margin-left:0.3em;cursor:pointer" id="ia-logout-btn" title="Logout">&#10005;</div>`,e.title=`${n.name||"Anonymous"}
${n.pubkey.slice(0,16)}...`;const S=document.getElementById("ia-logout-btn");if(S){const $=C=>{C.stopPropagation(),l()};S.addEventListener("click",$),a.push(()=>S.removeEventListener("click",$))}t.setState({user:n})}async function c(){if(sessionStorage.removeItem("ia-logged-out"),!window.nostr||!window.nostr.getPublicKey){alert("No NIP-07 signer found. Install nos2x or Alby browser extension.");return}try{const h=await window.nostr.getPublicKey();n={pubkey:h},r();const x=await o(h);x&&(n={...n,...x},r());const S=document.getElementById("ia-archive-fab"),$=document.getElementById("ingest-fab");S&&S.classList.remove("hidden"),$&&$.classList.remove("hidden")}catch(h){console.warn("Login failed:",h)}}function l(){n=null,sessionStorage.setItem("ia-logged-out","1"),r(),t.setState({user:null});const h=document.getElementById("ia-archive-fab"),x=document.getElementById("ingest-fab");h&&h.classList.add("hidden"),x&&x.classList.add("hidden");const S=document.getElementById("ia-archive-overlay"),$=document.getElementById("ingest-overlay");S&&S.classList.add("hidden"),$&&$.classList.add("hidden")}function d(){n||c()}e.addEventListener("click",d),a.push(()=>e.removeEventListener("click",d));function p(){return sessionStorage.getItem("ia-logged-out")?!1:window.nostr&&window.nostr.getPublicKey?(c(),!0):!1}const f=[];p()||(f.push(setTimeout(p,500)),f.push(setTimeout(p,1500)),f.push(setTimeout(p,3e3)));const g=t.subscribe("user",h=>{h!==n&&!h&&n&&l()});a.push(g);function v(){a.forEach(h=>{try{h()}catch{}}),f.forEach(h=>clearTimeout(h))}return v}const hn="https://huggingface.co",va="https://router.huggingface.co",Ho="X-HF-Bill-To",On={baseten:{},"black-forest-labs":{},cerebras:{},clarifai:{},cohere:{},deepinfra:{},"fal-ai":{},"featherless-ai":{},"fireworks-ai":{},groq:{},"hf-inference":{},hyperbolic:{},nebius:{},novita:{},nscale:{},nvidia:{},openai:{},publicai:{},ovhcloud:{},replicate:{},sambanova:{},scaleway:{},together:{},wavespeed:{},"zai-org":{}};class Dt extends Error{constructor(t){super(t),this.name="InferenceClientError"}}class Z extends Dt{constructor(t){super(t),this.name="InputError"}}class Vo extends Dt{constructor(t){super(t),this.name="RoutingError"}}class wa extends Dt{constructor(n,a,o){super(n);E(this,"httpRequest");E(this,"httpResponse");this.httpRequest={...a,...a.headers?{headers:{...a.headers,..."Authorization"in a.headers?{Authorization:"Bearer [redacted]"}:void 0}}:void 0},this.httpResponse=o}}class me extends wa{constructor(t,n,a){super(t,n,a),this.name="ProviderApiError"}}class ht extends wa{constructor(t,n,a){super(t,n,a),this.name="HubApiError"}}class _ extends Dt{constructor(t){super(t),this.name="ProviderOutputError"}}function zo(e){return Array.isArray(e)?e:[e]}class ye{constructor(t,n,a=!1){E(this,"provider");E(this,"baseUrl");E(this,"clientSideRoutingOnly");this.provider=t,this.baseUrl=n,this.clientSideRoutingOnly=a}makeBaseUrl(t){return t.authMethod!=="provider-key"?`${va}/${this.provider}`:this.baseUrl}makeBody(t){return"data"in t.args&&t.args.data?t.args.data:JSON.stringify(this.preparePayload(t))}makeUrl(t){const n=this.makeBaseUrl(t),a=this.makeRoute(t).replace(/^\/+/,"");return t.urlTransform?t.urlTransform(`${n}/${a}`):`${n}/${a}`}prepareHeaders(t,n){const a={};return t.authMethod!=="none"&&(a.Authorization=`Bearer ${t.accessToken}`),n||(a["Content-Type"]="application/json"),a}}class fe extends ye{constructor(t,n,a=!1){super(t,n,a)}makeRoute(){return"v1/chat/completions"}preparePayload(t){return{...t.args,model:t.model}}async getResponse(t){if(typeof t=="object"&&Array.isArray(t==null?void 0:t.choices)&&typeof(t==null?void 0:t.created)=="number"&&typeof(t==null?void 0:t.id)=="string"&&typeof(t==null?void 0:t.model)=="string"&&(t.system_fingerprint===void 0||t.system_fingerprint===null||typeof t.system_fingerprint=="string")&&typeof(t==null?void 0:t.usage)=="object")return t;throw new _("Expected ChatCompletionOutput")}}class Ke extends ye{constructor(t,n,a=!1){super(t,n,a)}preparePayload(t){return{...t.args,model:t.model}}makeRoute(){return"v1/completions"}async getResponse(t){const n=zo(t);if(Array.isArray(n)&&n.length>0&&n.every(a=>typeof a=="object"&&!!a&&"generated_text"in a&&typeof a.generated_text=="string"))return n[0];throw new _("Expected Array<{generated_text: string}>")}}class xa extends fe{constructor(){super("auto","https://router.huggingface.co")}makeBaseUrl(t){if(t.authMethod!=="hf-token")throw new Vo("Cannot select auto-router when using non-Hugging Face API key.");return this.baseUrl}}function Te(e){if(globalThis.Buffer)return globalThis.Buffer.from(e).toString("base64");{const t=[];return e.forEach(n=>{t.push(String.fromCharCode(n))}),globalThis.btoa(t.join(""))}}async function Ve(e,t="image/jpeg"){const n=await e.arrayBuffer(),a=Te(new Uint8Array(n));return`data:${t};base64,${a}`}function Ko(e,t){return Object.assign({},...t.map(n=>{if(e[n]!==void 0)return{[n]:e[n]}}))}function ln(e,t){return e.includes(t)}function M(e,t){const n=Array.isArray(t)?t:[t],a=Object.keys(e).filter(o=>!ln(n,o));return Ko(e,a)}const Bn=["feature-extraction","sentence-similarity"];class G extends ye{constructor(){super("hf-inference",`${va}/hf-inference`)}preparePayload(t){return t.args}makeUrl(t){return t.model.startsWith("http://")||t.model.startsWith("https://")?t.model:super.makeUrl(t)}makeRoute(t){return t.task&&["feature-extraction","sentence-similarity"].includes(t.task)?`models/${t.model}/pipeline/${t.task}`:`models/${t.model}`}async getResponse(t){return t}}class Wo extends G{preparePayload(t){if(t.outputType==="url")throw new Z("hf-inference provider does not support URL output. Use outputType 'blob', 'dataUrl' or 'json' instead.");return t.args}async getResponse(t,n,a,o,i){if(!t)throw new _("Received malformed response from HF-Inference text-to-image API: response is undefined");if(typeof t=="object"){if(o==="json")return{...t};if("data"in t&&Array.isArray(t.data)&&t.data[0].b64_json){const s=t.data[0].b64_json;return o==="dataUrl"?`data:image/jpeg;base64,${s}`:await(await fetch(`data:image/jpeg;base64,${s}`,{signal:i})).blob()}if("output"in t&&Array.isArray(t.output)){const r=await(await fetch(t.output[0],{signal:i})).blob();return o==="dataUrl"?Ve(r):r}}if(t instanceof Blob)return o==="dataUrl"?Ve(t):o==="json"?{output:await Ve(t)}:t;throw new _("Received malformed response from HF-Inference text-to-image API: expected a Blob")}}class Xo extends G{makeUrl(t){let n;return t.model.startsWith("http://")||t.model.startsWith("https://")?n=t.model.trim():n=`${this.makeBaseUrl(t)}/models/${t.model}`,n=n.replace(/\/+$/,""),n.endsWith("/v1")?n+="/chat/completions":n.endsWith("/chat/completions")||(n+="/v1/chat/completions"),n}preparePayload(t){return{...t.args,model:t.model}}async getResponse(t){return t}}class Qo extends G{makeUrl(t){let n;return t.model.startsWith("http://")||t.model.startsWith("https://")?n=t.model.trim():n=`${this.makeBaseUrl(t)}/models/${t.model}`,n=n.replace(/\/+$/,""),n.endsWith("/v1")?n+="/completions":n.endsWith("/completions")||(n+="/v1/completions"),n}preparePayload(t){return{model:t.model,...M(t.args,["inputs","parameters"]),...t.args.parameters?{max_tokens:t.args.parameters.max_new_tokens,...M(t.args.parameters,"max_new_tokens")}:void 0,prompt:t.args.inputs}}async getResponse(t){var n;if(typeof t=="object"&&"choices"in t&&Array.isArray(t.choices)&&typeof((n=t.choices[0])==null?void 0:n.text)=="string")return{generated_text:t.choices[0].text};throw new _("Received malformed response from HF-Inference text generation API: expected {choices: [{text: string}]}")}}class Jo extends G{async getResponse(t){if(Array.isArray(t)&&t.every(n=>typeof n=="object"&&n!==null&&typeof n.label=="string"&&typeof n.score=="number"))return t;throw new _("Received malformed response from HF-Inference audio-classification API: expected Array<{label: string, score: number}> but received different format")}}class Yo extends G{async getResponse(t){return t}async preparePayloadAsync(t){return"data"in t?t:{...M(t,"inputs"),data:t.inputs}}}class Zo extends G{async getResponse(t){if(!Array.isArray(t))throw new _("Received malformed response from HF-Inference audio-to-audio API: expected Array");if(!t.every(n=>typeof n=="object"&&n&&"label"in n&&typeof n.label=="string"&&"content-type"in n&&typeof n["content-type"]=="string"&&"blob"in n&&typeof n.blob=="string"))throw new _("Received malformed response from HF-Inference audio-to-audio API: expected Array<{label: string, audio: Blob}>");return t}}class Go extends G{async getResponse(t){if(Array.isArray(t)&&t.every(n=>typeof n=="object"&&!!n&&typeof(n==null?void 0:n.answer)=="string"&&(typeof n.end=="number"||typeof n.end>"u")&&(typeof n.score=="number"||typeof n.score>"u")&&(typeof n.start=="number"||typeof n.start>"u")))return t[0];throw new _("Received malformed response from HF-Inference document-question-answering API: expected Array<{answer: string, end: number, score: number, start: number}>")}}class ei extends G{async getResponse(t){const n=(a,o,i=0)=>i>o?!1:a.every(s=>Array.isArray(s))?a.every(s=>n(s,o,i+1)):a.every(s=>typeof s=="number");if(Array.isArray(t)&&n(t,3,0))return t;throw new _("Received malformed response from HF-Inference feature-extraction API: expected Array<number[][][] | number[][] | number[] | number>")}}class ti extends G{async getResponse(t){if(Array.isArray(t)&&t.every(n=>typeof n.label=="string"&&typeof n.score=="number"))return t;throw new _("Received malformed response from HF-Inference image-classification API: expected Array<{label: string, score: number}>")}}class ni extends G{async getResponse(t){if(Array.isArray(t)&&t.every(n=>typeof n.label=="string"&&typeof n.mask=="string"&&(n.score===void 0||typeof n.score=="number")))return t;throw new _("Received malformed response from HF-Inference image-segmentation API: expected Array<{label: string, mask: string, score: number}>")}async preparePayloadAsync(t){return{...t,inputs:Te(new Uint8Array(t.inputs instanceof ArrayBuffer?t.inputs:await t.inputs.arrayBuffer()))}}}class ai extends G{async getResponse(t){if(typeof(t==null?void 0:t.generated_text)!="string")throw new _("Received malformed response from HF-Inference image-to-text API: expected {generated_text: string}");return t}async preparePayloadAsync(t){return"data"in t?t:{...M(t,"inputs"),data:t.inputs}}}class oi extends G{async preparePayloadAsync(t){return t.parameters?{...t,inputs:Te(new Uint8Array(t.inputs instanceof ArrayBuffer?t.inputs:await t.inputs.arrayBuffer()))}:{...t,model:t.model,data:t.inputs}}async getResponse(t){if(t instanceof Blob)return t;throw new _("Received malformed response from HF-Inference image-to-image API: expected Blob")}}class ii extends G{async getResponse(t){if(Array.isArray(t)&&t.every(n=>typeof n.label=="string"&&typeof n.score=="number"&&typeof n.box.xmin=="number"&&typeof n.box.ymin=="number"&&typeof n.box.xmax=="number"&&typeof n.box.ymax=="number"))return t;throw new _("Received malformed response from HF-Inference object-detection API: expected Array<{label: string, score: number, box: {xmin: number, ymin: number, xmax: number, ymax: number}}>")}}class si extends G{async getResponse(t){if(Array.isArray(t)&&t.every(n=>typeof n.label=="string"&&typeof n.score=="number"))return t;throw new _("Received malformed response from HF-Inference zero-shot-image-classification API: expected Array<{label: string, score: number}>")}}class ri extends G{async getResponse(t){const n=t==null?void 0:t[0];if(Array.isArray(n)&&n.every(a=>typeof(a==null?void 0:a.label)=="string"&&typeof a.score=="number"))return n;throw new _("Received malformed response from HF-Inference text-classification API: expected Array<{label: string, score: number}>")}}class li extends G{async getResponse(t){if(Array.isArray(t)?t.every(n=>typeof n=="object"&&!!n&&typeof n.answer=="string"&&typeof n.end=="number"&&typeof n.score=="number"&&typeof n.start=="number"):typeof t=="object"&&t&&typeof t.answer=="string"&&typeof t.end=="number"&&typeof t.score=="number"&&typeof t.start=="number")return Array.isArray(t)?t[0]:t;throw new _("Received malformed response from HF-Inference question-answering API: expected Array<{answer: string, end: number, score: number, start: number}>")}}class ci extends G{async getResponse(t){if(Array.isArray(t)&&t.every(n=>typeof n.score=="number"&&typeof n.sequence=="string"&&typeof n.token=="number"&&typeof n.token_str=="string"))return t;throw new _("Received malformed response from HF-Inference fill-mask API: expected Array<{score: number, sequence: string, token: number, token_str: string}>")}}class gn extends G{async getResponse(t){if(typeof t=="object"&&t!==null&&"labels"in t&&"scores"in t&&Array.isArray(t.labels)&&Array.isArray(t.scores)&&t.labels.length===t.scores.length&&t.labels.every(n=>typeof n=="string")&&t.scores.every(n=>typeof n=="number")){const n=t.scores;return t.labels.map((a,o)=>({label:a,score:n[o]}))}if(Array.isArray(t)&&t.every(gn.validateOutputElement))return t;throw new _("Received malformed response from HF-Inference zero-shot-classification API: expected Array<{label: string, score: number}>")}static validateOutputElement(t){return typeof t=="object"&&!!t&&"label"in t&&"score"in t&&typeof t.label=="string"&&typeof t.score=="number"}}class di extends G{async getResponse(t){if(Array.isArray(t)&&t.every(n=>typeof n=="number"))return t;throw new _("Received malformed response from HF-Inference sentence-similarity API: expected Array<number>")}}class Mt extends G{static validate(t){return typeof t=="object"&&!!t&&"aggregator"in t&&typeof t.aggregator=="string"&&"answer"in t&&typeof t.answer=="string"&&"cells"in t&&Array.isArray(t.cells)&&t.cells.every(n=>typeof n=="string")&&"coordinates"in t&&Array.isArray(t.coordinates)&&t.coordinates.every(n=>Array.isArray(n)&&n.every(a=>typeof a=="number"))}async getResponse(t){if(Array.isArray(t)&&Array.isArray(t)?t.every(n=>Mt.validate(n)):Mt.validate(t))return Array.isArray(t)?t[0]:t;throw new _("Received malformed response from HF-Inference table-question-answering API: expected {aggregator: string, answer: string, cells: string[], coordinates: number[][]}")}}class pi extends G{async getResponse(t){if(Array.isArray(t)&&t.every(n=>typeof n.end=="number"&&typeof n.entity_group=="string"&&typeof n.score=="number"&&typeof n.start=="number"&&typeof n.word=="string"))return t;throw new _("Received malformed response from HF-Inference token-classification API: expected Array<{end: number, entity_group: string, score: number, start: number, word: string}>")}}class ui extends G{async getResponse(t){if(Array.isArray(t)&&t.every(n=>typeof(n==null?void 0:n.translation_text)=="string"))return(t==null?void 0:t.length)===1?t==null?void 0:t[0]:t;throw new _("Received malformed response from HF-Inference translation API: expected Array<{translation_text: string}>")}}class mi extends G{async getResponse(t){if(Array.isArray(t)&&t.every(n=>typeof(n==null?void 0:n.summary_text)=="string"))return t==null?void 0:t[0];throw new _("Received malformed response from HF-Inference summarization API: expected Array<{summary_text: string}>")}}class fi extends G{async getResponse(t){return t}}class hi extends G{async getResponse(t){if(Array.isArray(t)&&t.every(n=>typeof n=="number"))return t;throw new _("Received malformed response from HF-Inference tabular-classification API: expected Array<number>")}}class gi extends G{async getResponse(t){if(Array.isArray(t)&&t.every(n=>typeof n=="object"&&!!n&&typeof(n==null?void 0:n.answer)=="string"&&typeof n.score=="number"))return t[0];throw new _("Received malformed response from HF-Inference visual-question-answering API: expected Array<{answer: string, score: number}>")}}class yi extends G{async getResponse(t){if(Array.isArray(t)&&t.every(n=>typeof n=="number"))return t;throw new _("Received malformed response from HF-Inference tabular-regression API: expected Array<number>")}}class bi extends G{async getResponse(t){return t}}let vi=console;function At(){return vi}const Zt=new Map;function wi(e,t){return t?Array.isArray(t)?t:Object.entries(t).map(([n,a])=>({provider:n,hfModelId:e,providerId:a.providerId,status:a.status,task:a.task,adapter:a.adapter,adapterWeightsPath:a.adapterWeightsPath})):[]}async function _a(e,t,n){var o;let a;if(Zt.has(e))a=Zt.get(e);else{const i=`${hn}/api/models/${e}?expand[]=inferenceProviderMapping`,s=await((n==null?void 0:n.fetch)??fetch)(i,{headers:t!=null&&t.startsWith("hf_")?{Authorization:`Bearer ${t}`}:{}});if(!s.ok)if((o=s.headers.get("Content-Type"))!=null&&o.startsWith("application/json")){const c=await s.json();if("error"in c&&typeof c.error=="string")throw new ht(`Failed to fetch inference provider mapping for model ${e}: ${c.error}`,{url:i,method:"GET"},{requestId:s.headers.get("x-request-id")??"",status:s.status,body:c})}else throw new ht(`Failed to fetch inference provider mapping for model ${e}`,{url:i,method:"GET"},{requestId:s.headers.get("x-request-id")??"",status:s.status,body:await s.text()});let r=null;try{r=await s.json()}catch{throw new ht(`Failed to fetch inference provider mapping for model ${e}: malformed API response, invalid JSON`,{url:i,method:"GET"},{requestId:s.headers.get("x-request-id")??"",status:s.status,body:await s.text()})}if(!(r!=null&&r.inferenceProviderMapping))throw new ht(`We have not been able to find inference provider information for model ${e}.`,{url:i,method:"GET"},{requestId:s.headers.get("x-request-id")??"",status:s.status,body:await s.text()});a=wi(e,r.inferenceProviderMapping),Zt.set(e,a)}return a}async function xi(e,t){const n=At();if(e.provider==="auto"&&e.task==="conversational")return{hfModelId:e.modelId,provider:"auto",providerId:e.modelId,status:"live",task:"conversational"};if(On[e.provider][e.modelId])return On[e.provider][e.modelId];const o=(await _a(e.modelId,e.accessToken,t)).find(i=>i.provider===e.provider);if(o){const i=e.provider==="hf-inference"&&ln(Bn,e.task)?Bn:[e.task];if(!ln(i,o.task))throw new Z(`Model ${e.modelId} is not supported for task ${e.task} and provider ${e.provider}. Supported task: ${o.task}.`);return o.status==="staging"&&n.warn(`Model ${e.modelId} is in staging mode for provider ${e.provider}. Meant for test purposes only.`),o}return null}async function z(e,t,n){var o;const a=At();if(n){if(e)throw new Z("Specifying both endpointUrl and provider is not supported.");return"hf-inference"}if(e||(a.log("Defaulting to 'auto' which will select the first provider available for the model, sorted by the user's order in https://hf.co/settings/inference-providers."),e="auto"),e==="auto"){if(!t)throw new Z("Specifying a model is required when provider is 'auto'");e=(o=(await _a(t))[0])==null?void 0:o.provider,a.log("Auto selected provider:",e)}if(!e)throw new Z(`No Inference Provider available for model ${t}.`);return e}const _i="https://inference.baseten.co";class ki extends fe{constructor(){super("baseten",_i)}}const Ai="https://api.clarifai.com";class Si extends fe{constructor(){super("clarifai",Ai)}makeRoute(){return"/v2/ext/openai/v1/chat/completions"}prepareHeaders(t,n){const a={Authorization:t.authMethod!=="provider-key"?`Bearer ${t.accessToken}`:`Key ${t.accessToken}`};return n||(a["Content-Type"]="application/json"),a}}function qn(e){return e.reason instanceof Error?e.reason:new DOMException("The operation was aborted","AbortError")}function rt(e,t){return t!=null&&t.aborted?Promise.reject(qn(t)):new Promise((n,a)=>{var r;let o=()=>{};const i=setTimeout(()=>{o(),n()},e);if((r=i.unref)==null||r.call(i),!t)return;const s=()=>{clearTimeout(i),o(),a(qn(t))};o=()=>{t.removeEventListener("abort",s)},t.addEventListener("abort",s,{once:!0})})}const Ti="https://api.us1.bfl.ai";class Ii extends ye{constructor(){super("black-forest-labs",Ti)}preparePayload(t){return{...M(t.args,["inputs","parameters"]),...t.args.parameters,prompt:t.args.inputs}}prepareHeaders(t,n){const a={Authorization:t.authMethod!=="provider-key"?`Bearer ${t.accessToken}`:`X-Key ${t.accessToken}`};return n||(a["Content-Type"]="application/json"),a}makeRoute(t){if(!t)throw new Z("Params are required");return`/v1/${t.model}`}async getResponse(t,n,a,o,i){const s=At(),r=new URL(t.polling_url);for(let c=0;c<5;c++){await rt(1e3,i),s.debug(`Polling Black Forest Labs API for the result... ${c+1}/5`),r.searchParams.set("attempt",c.toString(10));const l=await fetch(r,{headers:{"Content-Type":"application/json"},signal:i});if(!l.ok)throw new me("Failed to fetch result from black forest labs API",{url:r.toString(),method:"GET",headers:{"Content-Type":"application/json"}},{requestId:l.headers.get("x-request-id")??"",status:l.status,body:await l.text()});const d=await l.json();if(typeof d=="object"&&d&&"status"in d&&typeof d.status=="string"&&d.status==="Ready"&&"result"in d&&typeof d.result=="object"&&d.result&&"sample"in d.result&&typeof d.result.sample=="string")return o==="json"?d.result:o==="url"?d.result.sample:await(await fetch(d.result.sample,{signal:i})).blob()}throw new _("Timed out while waiting for the result from black forest labs API - aborting after 5 attempts")}}class Ei extends fe{constructor(){super("cerebras","https://api.cerebras.ai")}}class Li extends fe{constructor(){super("cohere","https://api.cohere.com")}makeRoute(){return"/compatibility/v1/chat/completions"}}const ka="https://api.deepinfra.com";class Pi extends fe{constructor(){super("deepinfra",ka)}makeRoute(){return"v1/openai/chat/completions"}}class $i extends Ke{constructor(){super("deepinfra",ka)}makeRoute(){return"v1/openai/completions"}preparePayload(t){const n=t.args.parameters;return{model:t.model,prompt:t.args.inputs,...M(t.args,["inputs","parameters"]),...n?{max_tokens:n.max_new_tokens,...M(n,["max_new_tokens"])}:void 0}}async getResponse(t){if(typeof t=="object"&&t!==null&&Array.isArray(t.choices)&&t.choices.length>0){const n=t.choices[0].text;if(typeof n=="string")return{generated_text:n}}throw new _("Received malformed response from DeepInfra text-generation API: expected OpenAI completion payload")}}function De(e){return/^http(s?):/.test(e)||e.startsWith("/")}const Fn=["audio/mpeg","audio/mp4","audio/wav","audio/x-wav"];class yn extends ye{constructor(t){super("fal-ai",t||"https://fal.run")}preparePayload(t){return t.args}makeRoute(t){return`/${t.model}`}prepareHeaders(t,n){const a={Authorization:t.authMethod!=="provider-key"?`Bearer ${t.accessToken}`:`Key ${t.accessToken}`};return n||(a["Content-Type"]="application/json"),a}}class St extends yn{makeRoute(t){return t.authMethod!=="provider-key"?`/${t.model}?_subdomain=queue`:`/${t.model}`}async getResponseFromQueueApi(t,n,a,o){if(!n||!a)throw new Z(`URL and headers are required for ${this.task} task`);if(!t.request_id)throw new _(`Received malformed response from Fal.ai ${this.task} API: no request ID found in the response`);let s=t.status;const r=new URL(n),c=`${r.protocol}//${r.host}${r.host==="router.huggingface.co"?"/fal-ai":""}`,l=new URL(t.response_url).pathname,d=r.search,p=`${c}${l}/status${d}`,f=`${c}${l}${d}`;for(;s!=="COMPLETED";){await rt(500,o);const h=await fetch(p,{headers:a,signal:o});if(!h.ok)throw new me("Failed to fetch response status from fal-ai API",{url:p,method:"GET"},{requestId:h.headers.get("x-request-id")??"",status:h.status,body:await h.text()});try{s=(await h.json()).status}catch{throw new _("Failed to parse status response from fal-ai API: received malformed response")}}const g=await fetch(f,{headers:a,signal:o});let v;try{v=await g.json()}catch{throw new _("Failed to parse result response from fal-ai API: received malformed response")}return v}}function Aa(e,t){return`${hn}/${e}/resolve/main/${t}`}class Ci extends St{constructor(){super("https://queue.fal.run");E(this,"task");this.task="text-to-image"}preparePayload(n){var o;const a={...M(n.args,["inputs","parameters"]),...n.args.parameters,prompt:n.args.inputs};return((o=n.mapping)==null?void 0:o.adapter)==="lora"&&n.mapping.adapterWeightsPath&&(a.loras=[{path:Aa(n.mapping.hfModelId,n.mapping.adapterWeightsPath),scale:1}],n.mapping.providerId==="fal-ai/lora"&&(a.model_name="stabilityai/stable-diffusion-xl-base-1.0")),a}async getResponse(n,a,o,i,s){const r=await this.getResponseFromQueueApi(n,a,o,s);if(typeof r=="object"&&"images"in r&&Array.isArray(r.images)&&r.images.length>0&&"url"in r.images[0]&&typeof r.images[0].url=="string"&&De(r.images[0].url)){if(i==="json")return{...r};if(i==="url")return r.images[0].url;const l=await(await fetch(r.images[0].url,{signal:s})).blob();return i==="dataUrl"?Ve(l):l}throw new _(`Received malformed response from Fal.ai text-to-image API: expected { images: Array<{ url: string }> } result format, got instead: ${JSON.stringify(r)}`)}}class Sa extends St{constructor(){super("https://queue.fal.run");E(this,"task");this.task="image-to-image"}preparePayload(n){var o;const a=n.args;return((o=n.mapping)==null?void 0:o.adapter)==="lora"&&n.mapping.adapterWeightsPath&&(a.loras=[{path:Aa(n.mapping.hfModelId,n.mapping.adapterWeightsPath),scale:1}]),a}async preparePayloadAsync(n){const o=`data:${n.inputs instanceof Blob?n.inputs.type:"image/png"};base64,${Te(new Uint8Array(n.inputs instanceof ArrayBuffer?n.inputs:await n.inputs.arrayBuffer()))}`;return{...M(n,["inputs","parameters"]),image_url:o,...n.parameters,...n,image_urls:[o]}}async getResponse(n,a,o,i,s){const r=await this.getResponseFromQueueApi(n,a,o,s);if(typeof r=="object"&&r&&"images"in r&&Array.isArray(r.images)&&r.images.length>0&&typeof r.images[0]=="object"&&r.images[0]&&"url"in r.images[0]&&typeof r.images[0].url=="string"&&De(r.images[0].url))return await(await fetch(r.images[0].url,{signal:s})).blob();throw new _(`Received malformed response from Fal.ai image-to-image API: expected { images: Array<{ url: string }> } result format, got instead: ${JSON.stringify(r)}`)}}class Ri extends Sa{constructor(){super(),this.task="image-text-to-image"}async preparePayloadAsync(t){var n;return t.inputs?super.preparePayloadAsync(t):{...M(t,["inputs","parameters"]),...t.parameters,prompt:(n=t.parameters)==null?void 0:n.prompt,urlTransform:a=>{const o=new URL(a);return o.pathname=o.pathname.split("/").slice(0,-1).join("/"),o.toString()}}}}class Ui extends St{constructor(){super("https://queue.fal.run");E(this,"task");this.task="text-to-video"}preparePayload(n){return{...M(n.args,["inputs","parameters"]),...n.args.parameters,prompt:n.args.inputs}}async getResponse(n,a,o,i,s){const r=await this.getResponseFromQueueApi(n,a,o,s);if(typeof r=="object"&&r&&"video"in r&&typeof r.video=="object"&&r.video&&"url"in r.video&&typeof r.video.url=="string"&&De(r.video.url))return await(await fetch(r.video.url,{signal:s})).blob();throw new _(`Received malformed response from Fal.ai text-to-video API: expected { video: { url: string } } result format, got instead: ${JSON.stringify(r)}`)}}class Ta extends St{constructor(){super("https://queue.fal.run");E(this,"task");this.task="image-to-video"}preparePayload(n){return{...M(n.args,["inputs","parameters"]),...n.args.parameters,image_url:n.args.image_url}}async preparePayloadAsync(n){const a=n.inputs instanceof Blob?n.inputs.type:"image/png";return{...M(n,["inputs","parameters"]),image_url:`data:${a};base64,${Te(new Uint8Array(n.inputs instanceof ArrayBuffer?n.inputs:await n.inputs.arrayBuffer()))}`,...n.parameters,...n}}async getResponse(n,a,o,i,s){const r=await this.getResponseFromQueueApi(n,a,o,s);if(typeof r=="object"&&r!==null&&"video"in r&&typeof r.video=="object"&&r.video!==null&&"url"in r.video&&typeof r.video.url=="string"&&"url"in r.video&&De(r.video.url))return await(await fetch(r.video.url,{signal:s})).blob();throw new _(`Received malformed response from Fal.ai image‑to‑video API: expected { video: { url: string } }, got: ${JSON.stringify(r)}`)}}class Mi extends Ta{constructor(){super(),this.task="image-text-to-video"}async preparePayloadAsync(t){var n;return t.inputs?super.preparePayloadAsync(t):{...M(t,["inputs","parameters"]),...t.parameters,prompt:(n=t.parameters)==null?void 0:n.prompt,urlTransform:a=>{const o=new URL(a);return o.pathname=o.pathname.split("/").slice(0,-1).join("/"),o.toString()}}}}class Ni extends yn{prepareHeaders(t,n){const a=super.prepareHeaders(t,n);return a["Content-Type"]="application/json",a}async getResponse(t){const n=t;if(typeof(n==null?void 0:n.text)!="string")throw new _(`Received malformed response from Fal.ai Automatic Speech Recognition API: expected { text: string } format, got instead: ${JSON.stringify(t)}`);return{text:n.text}}async preparePayloadAsync(t){const n="data"in t&&t.data instanceof Blob?t.data:"inputs"in t?t.inputs:void 0,a=n==null?void 0:n.type;if(!a)throw new Z("Unable to determine the input's content-type. Make sure your are passing a Blob when using provider fal-ai.");if(!Fn.includes(a))throw new Z(`Provider fal-ai does not support blob type ${a} - supported content types are: ${Fn.join(", ")}`);const o=Te(new Uint8Array(await n.arrayBuffer()));return{..."data"in t?M(t,"data"):M(t,"inputs"),audio_url:`data:${a};base64,${o}`}}}class Di extends yn{preparePayload(t){return{...M(t.args,["inputs","parameters"]),...t.args.parameters,text:t.args.inputs}}async getResponse(t,n,a,o,i){var c;const s=t;if(typeof((c=s==null?void 0:s.audio)==null?void 0:c.url)!="string")throw new _(`Received malformed response from Fal.ai Text-to-Speech API: expected { audio: { url: string } } format, got instead: ${JSON.stringify(t)}`);const r=await fetch(s.audio.url,{signal:i});if(!r.ok)throw new me(`Failed to fetch audio from ${s.audio.url}: ${r.statusText}`,{url:s.audio.url,method:"GET",headers:{"Content-Type":"application/json"}},{requestId:r.headers.get("x-request-id")??"",status:r.status,body:await r.text()});try{return await r.blob()}catch(l){throw new me(`Failed to fetch audio from ${s.audio.url}: ${l instanceof Error?l.message:String(l)}`,{url:s.audio.url,method:"GET",headers:{"Content-Type":"application/json"}},{requestId:r.headers.get("x-request-id")??"",status:r.status,body:await r.text()})}}}class ji extends St{constructor(){super("https://queue.fal.run");E(this,"task");this.task="image-segmentation"}preparePayload(n){return{...M(n.args,["inputs","parameters"]),...n.args.parameters,sync_mode:!0}}async preparePayloadAsync(n){const a="data"in n&&n.data instanceof Blob?n.data:"inputs"in n?n.inputs:void 0,o=a instanceof Blob?a.type:"image/png",i=Te(new Uint8Array(a instanceof ArrayBuffer?a:await a.arrayBuffer()));return{...M(n,["inputs","parameters","data"]),...n.parameters,...n,image_url:`data:${o};base64,${i}`,sync_mode:!0}}async getResponse(n,a,o,i,s){const r=await this.getResponseFromQueueApi(n,a,o,s);if(typeof r=="object"&&r!==null&&"image"in r&&typeof r.image=="object"&&r.image!==null&&"url"in r.image&&typeof r.image.url=="string"){const c=await fetch(r.image.url,{signal:s});if(!c.ok)throw new me(`Failed to fetch segmentation mask from ${r.image.url}`,{url:r.image.url,method:"GET"},{requestId:c.headers.get("x-request-id")??"",status:c.status,body:await c.text()});const d=await(await c.blob()).arrayBuffer();return[{label:"mask",score:1,mask:Te(new Uint8Array(d))}]}throw new _(`Received malformed response from Fal.ai image-segmentation API: expected { image: { url: string } } format, got instead: ${JSON.stringify(n)}`)}}const Ia="https://api.featherless.ai";class Oi extends fe{constructor(){super("featherless-ai",Ia)}}class Bi extends Ke{constructor(){super("featherless-ai",Ia)}preparePayload(t){return{model:t.model,...M(t.args,["inputs","parameters"]),...t.args.parameters?{max_tokens:t.args.parameters.max_new_tokens,...M(t.args.parameters,"max_new_tokens")}:void 0,prompt:t.args.inputs}}async getResponse(t){if(typeof t=="object"&&"choices"in t&&Array.isArray(t==null?void 0:t.choices)&&typeof(t==null?void 0:t.model)=="string")return{generated_text:t.choices[0].text};throw new _("Received malformed response from Featherless AI text generation API")}}class qi extends fe{constructor(){super("fireworks-ai","https://api.fireworks.ai")}makeRoute(){return"/inference/v1/chat/completions"}}const Ea="https://api.groq.com";class Fi extends Ke{constructor(){super("groq",Ea)}makeRoute(){return"/openai/v1/chat/completions"}}class Hi extends fe{constructor(){super("groq",Ea)}makeRoute(){return"/openai/v1/chat/completions"}}const bn="https://api.hyperbolic.xyz";class Vi extends fe{constructor(){super("hyperbolic",bn)}}class zi extends Ke{constructor(){super("hyperbolic",bn)}makeRoute(){return"v1/chat/completions"}preparePayload(t){return{messages:[{content:t.args.inputs,role:"user"}],...t.args.parameters?{max_tokens:t.args.parameters.max_new_tokens,...M(t.args.parameters,"max_new_tokens")}:void 0,...M(t.args,["inputs","parameters"]),model:t.model}}async getResponse(t){if(typeof t=="object"&&"choices"in t&&Array.isArray(t==null?void 0:t.choices)&&typeof(t==null?void 0:t.model)=="string")return{generated_text:t.choices[0].message.content};throw new _("Received malformed response from Hyperbolic text generation API")}}class Ki extends ye{constructor(){super("hyperbolic",bn)}makeRoute(t){return"/v1/images/generations"}preparePayload(t){if(t.outputType==="url")throw new Z("hyperbolic provider does not support URL output. Use outputType 'blob', 'dataUrl' or 'json' instead.");return{...M(t.args,["inputs","parameters"]),...t.args.parameters,prompt:t.args.inputs,model_name:t.model}}async getResponse(t,n,a,o,i){if(typeof t=="object"&&"images"in t&&Array.isArray(t.images)&&t.images[0]&&typeof t.images[0].image=="string")return o==="json"?{...t}:o==="dataUrl"?`data:image/jpeg;base64,${t.images[0].image}`:fetch(`data:image/jpeg;base64,${t.images[0].image}`,{signal:i}).then(s=>s.blob());throw new _("Received malformed response from Hyperbolic text-to-image API")}}const jt="https://api.studio.nebius.ai";class Wi extends fe{constructor(){super("nebius",jt)}preparePayload(t){var o;const n=super.preparePayload(t),a=t.args.response_format;return(a==null?void 0:a.type)==="json_schema"&&((o=a.json_schema)!=null&&o.schema)&&(n.guided_json=a.json_schema.schema),n}}class Xi extends Ke{constructor(){super("nebius",jt)}preparePayload(t){return{...t.args,model:t.model,prompt:t.args.inputs}}async getResponse(t){var n;if(typeof t=="object"&&"choices"in t&&Array.isArray(t==null?void 0:t.choices)&&t.choices.length>0&&typeof((n=t.choices[0])==null?void 0:n.text)=="string")return{generated_text:t.choices[0].text};throw new _("Received malformed response from Nebius text generation API")}}class Qi extends ye{constructor(){super("nebius",jt)}preparePayload(t){return{...M(t.args,["inputs","parameters"]),...t.args.parameters,response_format:t.outputType==="url"?"url":"b64_json",prompt:t.args.inputs,model:t.model}}makeRoute(){return"v1/images/generations"}async getResponse(t,n,a,o,i){if(typeof t=="object"&&"data"in t&&Array.isArray(t.data)&&t.data.length>0){if(o==="json")return{...t};if("url"in t.data[0]&&typeof t.data[0].url=="string")return t.data[0].url;if("b64_json"in t.data[0]&&typeof t.data[0].b64_json=="string"){const s=t.data[0].b64_json;return o==="dataUrl"?`data:image/jpeg;base64,${s}`:fetch(`data:image/jpeg;base64,${s}`,{signal:i}).then(r=>r.blob())}}throw new _("Received malformed response from Nebius text-to-image API")}}class Ji extends ye{constructor(){super("nebius",jt)}preparePayload(t){return{input:t.args.inputs,model:t.model}}makeRoute(){return"v1/embeddings"}async getResponse(t){return t.data.map(n=>n.embedding)}}const vn="https://api.novita.ai";class Yi extends Ke{constructor(){super("novita",vn)}makeRoute(){return"/v3/openai/chat/completions"}}class Zi extends fe{constructor(){super("novita",vn)}makeRoute(){return"/v3/openai/chat/completions"}}class Gi extends ye{constructor(){super("novita",vn)}makeRoute(t){return`/v3/async/${t.model}`}preparePayload(t){const{num_inference_steps:n,...a}=t.args.parameters??{};return{...M(t.args,["inputs","parameters"]),...a,steps:n,prompt:t.args.inputs}}async getResponse(t,n,a,o,i){if(!n||!a)throw new Z("URL and headers are required for text-to-video task");const s=t.task_id;if(!s)throw new _("Received malformed response from Novita text-to-video API: no task ID found in the response");const r=new URL(n),l=`${`${r.protocol}//${r.host}${r.host==="router.huggingface.co"?"/novita":""}`}/v3/async/task-result?task_id=${s}`;let d="",p;for(;d!=="TASK_STATUS_SUCCEED"&&d!=="TASK_STATUS_FAILED";){await rt(500,i);const f=await fetch(l,{headers:a,signal:i});if(!f.ok)throw new me("Failed to fetch task result",{url:l,method:"GET",headers:a},{requestId:f.headers.get("x-request-id")??"",status:f.status,body:await f.text()});try{if(p=await f.json(),p&&typeof p=="object"&&"task"in p&&p.task&&typeof p.task=="object"&&"status"in p.task&&typeof p.task.status=="string")d=p.task.status;else throw new _("Received malformed response from Novita text-to-video API: failed to get task status")}catch{throw new _("Received malformed response from Novita text-to-video API: failed to parse task result")}}if(d==="TASK_STATUS_FAILED")throw new _("Novita text-to-video task failed");if(typeof p=="object"&&p&&"videos"in p&&typeof p.videos=="object"&&p.videos&&Array.isArray(p.videos)&&p.videos.length>0&&"video_url"in p.videos[0]&&typeof p.videos[0].video_url=="string"&&De(p.videos[0].video_url))return await(await fetch(p.videos[0].video_url,{signal:i})).blob();throw new _(`Received malformed response from Novita text-to-video API: expected { videos: [{ video_url: string }] } format, got instead: ${JSON.stringify(p)}`)}}const La="https://inference.api.nscale.com";class es extends fe{constructor(){super("nscale",La)}}class ts extends ye{constructor(){super("nscale",La)}preparePayload(t){if(t.outputType==="url")throw new Z("nscale provider does not support URL output. Use outputType 'blob', 'dataUrl' or 'json' instead.");return{...M(t.args,["inputs","parameters"]),...t.args.parameters,response_format:"b64_json",prompt:t.args.inputs,model:t.model}}makeRoute(){return"v1/images/generations"}async getResponse(t,n,a,o,i){if(typeof t=="object"&&"data"in t&&Array.isArray(t.data)&&t.data.length>0&&"b64_json"in t.data[0]&&typeof t.data[0].b64_json=="string"){if(o==="json")return{...t};const s=t.data[0].b64_json;return o==="dataUrl"?`data:image/jpeg;base64,${s}`:fetch(`data:image/jpeg;base64,${s}`,{signal:i}).then(r=>r.blob())}throw new _("Received malformed response from Nscale text-to-image API")}}class ns extends fe{constructor(){super("nvidia","https://integrate.api.nvidia.com")}}const as="https://api.openai.com";class os extends fe{constructor(){super("openai",as,!0)}}const Pa="https://oai.endpoints.kepler.ai.cloud.ovh.net";class is extends fe{constructor(){super("ovhcloud",Pa)}}class ss extends Ke{constructor(){super("ovhcloud",Pa)}preparePayload(t){return{model:t.model,...M(t.args,["inputs","parameters"]),...t.args.parameters?{max_tokens:t.args.parameters.max_new_tokens,...M(t.args.parameters,"max_new_tokens")}:void 0,prompt:t.args.inputs}}async getResponse(t){if(typeof t=="object"&&"choices"in t&&Array.isArray(t==null?void 0:t.choices)&&typeof(t==null?void 0:t.model)=="string")return{generated_text:t.choices[0].text};throw new _("Received malformed response from OVHcloud text generation API")}}class rs extends fe{constructor(){super("publicai","https://api.publicai.co")}}class Tt extends ye{constructor(t){super("replicate",t||"https://api.replicate.com")}makeRoute(t){return t.model.includes(":")?"v1/predictions":`v1/models/${t.model}/predictions`}preparePayload(t){return{input:{...M(t.args,["inputs","parameters"]),...t.args.parameters,prompt:t.args.inputs},version:t.model.includes(":")?t.model.split(":")[1]:void 0}}prepareHeaders(t,n){const a={Authorization:`Bearer ${t.accessToken}`,Prefer:"wait"};return n||(a["Content-Type"]="application/json"),a}makeUrl(t){const n=this.makeBaseUrl(t);return t.model.includes(":")?`${n}/v1/predictions`:`${n}/v1/models/${t.model}/predictions`}}class ls extends Tt{preparePayload(t){var n;return{input:{...M(t.args,["inputs","parameters"]),...t.args.parameters,prompt:t.args.inputs,lora_weights:((n=t.mapping)==null?void 0:n.adapter)==="lora"&&t.mapping.adapterWeightsPath?`https://huggingface.co/${t.mapping.hfModelId}`:void 0},version:t.model.includes(":")?t.model.split(":")[1]:void 0}}async getResponse(t,n,a,o,i){if(typeof t=="object"&&"output"in t&&typeof t.output=="string"&&De(t.output)){if(o==="json")return{...t};if(o==="url")return t.output;const r=await(await fetch(t.output,{signal:i})).blob();return o==="dataUrl"?Ve(r):r}if(typeof t=="object"&&"output"in t&&Array.isArray(t.output)&&t.output.length>0&&typeof t.output[0]=="string"){if(o==="json")return{...t};if(o==="url")return t.output[0];const r=await(await fetch(t.output[0],{signal:i})).blob();return o==="dataUrl"?Ve(r):r}throw new _("Received malformed response from Replicate text-to-image API")}}class cs extends Tt{preparePayload(t){const n=super.preparePayload(t),a=n.input;if(typeof a=="object"&&a!==null&&"prompt"in a){const o=a;o.text=o.prompt,delete o.prompt}return n}async getResponse(t,n,a,o,i){if(t instanceof Blob)return t;if(t&&typeof t=="object"&&"output"in t){if(typeof t.output=="string")return await(await fetch(t.output,{signal:i})).blob();if(Array.isArray(t.output))return await(await fetch(t.output[0],{signal:i})).blob()}throw new _("Received malformed response from Replicate text-to-speech API")}}class ds extends Tt{async getResponse(t,n,a,o,i){if(typeof t=="object"&&t&&"output"in t&&typeof t.output=="string"&&De(t.output))return await(await fetch(t.output,{signal:i})).blob();throw new _("Received malformed response from Replicate text-to-video API")}}class ps extends Tt{preparePayload(t){return{input:{...M(t.args,["inputs","parameters"]),...t.args.parameters,audio:t.args.inputs},version:t.model.includes(":")?t.model.split(":")[1]:void 0}}async preparePayloadAsync(t){const n="data"in t&&t.data instanceof Blob?t.data:"inputs"in t?t.inputs:void 0;if(!n||!(n instanceof Blob))throw new Error("Audio input must be a Blob");const a=new Uint8Array(await n.arrayBuffer()),o=Te(a),i=`data:${n.type||"audio/wav"};base64,${o}`;return{..."data"in t?M(t,"data"):M(t,"inputs"),inputs:i}}async getResponse(t,n,a,o,i){if(typeof(t==null?void 0:t.output)=="string")return{text:t.output};if(Array.isArray(t==null?void 0:t.output)&&typeof t.output[0]=="string")return{text:t.output[0]};const s=t==null?void 0:t.output;if(s&&typeof s=="object"){if(typeof s.transcription=="string")return{text:s.transcription};if(typeof s.translation=="string")return{text:s.translation};if(typeof s.txt_file=="string")return{text:await(await fetch(s.txt_file,{signal:i})).text()}}throw new _("Received malformed response from Replicate automatic-speech-recognition API")}}class us extends Tt{preparePayload(t){var a;const n=t.args.inputs;return{input:{...M(t.args,["inputs","parameters"]),...t.args.parameters,image:n,images:[n],input_image:n,input_images:[n],lora_weights:((a=t.mapping)==null?void 0:a.adapter)==="lora"&&t.mapping.adapterWeightsPath?`https://huggingface.co/${t.mapping.hfModelId}`:void 0},version:t.model.includes(":")?t.model.split(":")[1]:void 0}}async preparePayloadAsync(t){const{inputs:n,...a}=t,o=new Uint8Array(await n.arrayBuffer()),i=Te(o),s=`data:${n.type||"image/jpeg"};base64,${i}`;return{...a,inputs:s}}async getResponse(t,n,a,o,i){if(typeof t=="object"&&t&&"output"in t&&Array.isArray(t.output)&&t.output.length>0&&typeof t.output[0]=="string")return await(await fetch(t.output[0],{signal:i})).blob();if(typeof t=="object"&&t&&"output"in t&&typeof t.output=="string"&&De(t.output))return await(await fetch(t.output,{signal:i})).blob();throw new _("Received malformed response from Replicate image-to-image API")}}class ms extends fe{constructor(){super("sambanova","https://api.sambanova.ai")}preparePayload(t){const n=t.args.response_format;return(n==null?void 0:n.type)==="json_schema"&&n.json_schema&&(n.json_schema.strict??!0)&&(n.json_schema.strict=!1),super.preparePayload(t)}}class fs extends ye{constructor(){super("sambanova","https://api.sambanova.ai")}makeRoute(){return"/v1/embeddings"}async getResponse(t){if(typeof t=="object"&&"data"in t&&Array.isArray(t.data))return t.data.map(n=>n.embedding);throw new _("Received malformed response from Sambanova feature-extraction (embeddings) API")}preparePayload(t){return{model:t.model,input:t.args.inputs,...t.args}}}const wn="https://api.scaleway.ai";class hs extends fe{constructor(){super("scaleway",wn)}}class gs extends Ke{constructor(){super("scaleway",wn)}preparePayload(t){return{model:t.model,...t.args,prompt:t.args.inputs}}async getResponse(t){if(typeof t=="object"&&t!==null&&"choices"in t&&Array.isArray(t.choices)&&t.choices.length>0){const n=t.choices[0];if(typeof n=="object"&&n&&"text"in n&&n.text&&typeof n.text=="string")return{generated_text:n.text}}throw new _("Received malformed response from Scaleway text generation API")}}class ys extends ye{constructor(){super("scaleway",wn)}preparePayload(t){return{input:t.args.inputs,model:t.model}}makeRoute(){return"v1/embeddings"}async getResponse(t){return t.data.map(n=>n.embedding)}}const Ze="https://api.together.xyz",bs={"audio/wav":"wav","audio/x-wav":"wav","audio/wave":"wav","audio/mpeg":"mp3","audio/mp3":"mp3","audio/mp4":"mp4","audio/m4a":"m4a","audio/x-m4a":"m4a","audio/flac":"flac","audio/x-flac":"flac","audio/ogg":"ogg","audio/webm":"webm"};function vs(e){return e?bs[e.toLowerCase()]??"wav":"wav"}class ws extends fe{constructor(){super("together",Ze)}preparePayload(t){var o;const n=super.preparePayload(t),a=n.response_format;return(a==null?void 0:a.type)==="json_schema"&&((o=a==null?void 0:a.json_schema)!=null&&o.schema)&&(n.response_format={type:"json_schema",schema:a.json_schema.schema}),n}}class xs extends Ke{constructor(){super("together",Ze)}preparePayload(t){return{model:t.model,...t.args,prompt:t.args.inputs}}async getResponse(t){if(typeof t=="object"&&"choices"in t&&Array.isArray(t==null?void 0:t.choices)&&typeof(t==null?void 0:t.model)=="string"){const n=t.choices[0];return{generated_text:n.text,details:{finish_reason:n.finish_reason,seed:n.seed}}}throw new _("Received malformed response from Together text generation API")}}class $a extends ye{constructor(){super("together",Ze)}makeRoute(){return"v1/images/generations"}preparePayload(t){const n=t.args.parameters??{},{num_inference_steps:a,...o}=n;return a!==void 0&&(o.steps=a),{...M(t.args,["inputs","parameters"]),...o,prompt:t.args.inputs,response_format:t.outputType==="url"?"url":"base64",model:t.model}}get imageTaskLabel(){return"text-to-image"}async getResponse(t,n,a,o,i){if(typeof t=="object"&&"data"in t&&Array.isArray(t.data)&&t.data.length>0){if(o==="json")return{...t};if("url"in t.data[0]&&typeof t.data[0].url=="string")return t.data[0].url;if("b64_json"in t.data[0]&&typeof t.data[0].b64_json=="string"){const s=t.data[0].b64_json;return o==="dataUrl"?`data:image/jpeg;base64,${s}`:fetch(`data:image/jpeg;base64,${s}`,{signal:i}).then(r=>r.blob())}}throw new _(`Received malformed response from Together ${this.imageTaskLabel} API`)}}class _s extends $a{get imageTaskLabel(){return"image-to-image"}preparePayload(t){const n=t.args.parameters??{},{prompt:a,num_inference_steps:o,...i}=n;o!==void 0&&(i.steps=o);const s=t.model.toLowerCase(),c=s.includes("kontext")&&s.includes("flux.1")?{image_url:t.args.inputs}:{reference_images:[t.args.inputs]};return{...M(t.args,["inputs","parameters"]),prompt:a??"",...c,...i,response_format:"base64",model:t.model}}async preparePayloadAsync(t){const{inputs:n,...a}=t;if(!(n instanceof Blob))throw new Z("Together image-to-image expects a Blob input.");const o=await Ve(n,n.type||"image/jpeg");return{...a,inputs:o}}async getResponse(t,n,a,o){const i=await super.getResponse(t,n,a,o);if(i instanceof Blob)return i;throw new _(`Received malformed response from Together ${this.imageTaskLabel} API`)}}const ks=2e3,Hn=150,As=new Set(["queued","in_progress"]);function Ca(e){const{num_inference_steps:t,target_size:n,...a}=e??{};return t!==void 0&&(a.steps=t),n&&typeof n=="object"&&(n.width!==void 0&&(a.width=n.width),n.height!==void 0&&(a.height=n.height)),a}class Ra extends ye{constructor(){super("together",Ze)}makeRoute(){return"v2/videos"}async getResponse(t,n,a,o,i){var g,v;if(!n||!a)throw new Z("URL and headers are required for Together video tasks");const s=t==null?void 0:t.id;if(!s)throw new _("Received malformed response from Together video API: no job ID found in the response");const r=`${n}/${s}`;let c=t,l=c.status,d=0;for(;l===void 0||As.has(l);){if(d>=Hn)throw new _(`Timed out while waiting for Together video generation — aborting after ${Hn} status polls`);d+=1,await rt(ks,i);const h=await fetch(r,{headers:a,signal:i});if(!h.ok)throw new me("Failed to fetch Together video job result",{url:r,method:"GET",headers:a},{requestId:h.headers.get("x-request-id")??"",status:h.status,body:await h.text()});try{c=await h.json()}catch{throw new _("Received malformed response from Together video API: failed to parse job result")}l=c.status}if(l==="failed")throw new _(`Together video generation failed: ${((g=c.error)==null?void 0:g.message)??"Unknown error"}`);if(l!=="completed")throw new _(`Unexpected Together video job status: ${JSON.stringify(l)}`);const p=(v=c.outputs)==null?void 0:v.video_url;if(typeof p!="string")throw new _("No video URL found in completed Together video job.");const f=await fetch(p,{signal:i});if(!f.ok)throw new me("Failed to download Together video output",{url:p,method:"GET"},{requestId:f.headers.get("x-request-id")??"",status:f.status,body:await f.text()});return await f.blob()}}class Ss extends Ra{preparePayload(t){return{...M(t.args,["inputs","parameters"]),...Ca(t.args.parameters),prompt:t.args.inputs,model:t.model}}}class Ts extends Ra{preparePayload(t){const n=t.args.parameters??{},{prompt:a,...o}=n,i=Ca(o),s={...M(t.args,["inputs","parameters"]),...i,frame_images:[{input_image:t.args.inputs,frame:"first"}],model:t.model};return typeof a=="string"&&(s.prompt=a),s}async preparePayloadAsync(t){const{inputs:n,...a}=t;if(!(n instanceof Blob))throw new Z("Together image-to-video expects a Blob input.");const o=await Ve(n,n.type||"image/png");return{...a,inputs:o}}}class Is extends ye{constructor(){super("together",Ze)}makeRoute(){return"v1/embeddings"}preparePayload(t){return{...M(t.args,["inputs","parameters"]),...t.args.parameters,input:t.args.inputs,model:t.model}}async getResponse(t){if(typeof t=="object"&&t!==null&&"data"in t&&Array.isArray(t.data)&&t.data.every(n=>typeof n=="object"&&!!n&&Array.isArray(n.embedding)))return t.data.map(n=>n.embedding);throw new _(`Received malformed response from Together feature-extraction (embeddings) API: ${JSON.stringify(t)}`)}}class Es extends ye{constructor(){super("together",Ze)}makeRoute(){return"v1/audio/speech"}preparePayload(t){const n=t.args.parameters??{},a=t.model.toLowerCase().includes("kokoro"),o=n.voice??(a?"af_alloy":void 0);return{...M(t.args,["inputs","parameters"]),...n,...o!==void 0?{voice:o}:{},input:t.args.inputs,model:t.model}}async getResponse(t){if(t instanceof Blob)return t;throw new _(`Received malformed response from Together text-to-speech API: ${JSON.stringify(t)}`)}}class Ls extends ye{constructor(){super("together",Ze)}makeRoute(){return"v1/audio/transcriptions"}preparePayload(t){return{...M(t.args,["inputs","parameters","data"]),...t.args.parameters,model:t.model}}makeBody(t){const n=t.args.data,a=new FormData;if(n instanceof Blob)a.append("file",n,`audio.${vs(n.type)}`);else if(typeof n=="string")a.append("file",n);else throw new Z("Together automatic-speech-recognition expects a Blob, ArrayBuffer, or HTTP(S) URL string audio input.");const o=this.preparePayload(t);for(const[i,s]of Object.entries(o))s!=null&&(typeof s=="string"?a.append(i,s):typeof s=="number"||typeof s=="boolean"?a.append(i,String(s)):a.append(i,JSON.stringify(s)));return a}async preparePayloadAsync(t){const n="data"in t?t.data:t.inputs;let a;if(n instanceof Blob)a=n;else if(n instanceof ArrayBuffer)a=new Blob([n]);else if(typeof n=="string"&&/^https?:\/\//.test(n))a=n;else throw new Z("Together automatic-speech-recognition expects a Blob, ArrayBuffer, or HTTP(S) URL string audio input.");return{..."data"in t?M(t,"data"):M(t,"inputs"),data:a}}async getResponse(t){if(typeof t=="object"&&t!==null&&typeof t.text=="string"){const n={text:t.text};return Array.isArray(t.segments)&&(n.chunks=t.segments.map(a=>({text:a.text,timestamp:[a.start,a.end]}))),n}throw new _(`Received malformed response from Together automatic-speech-recognition API: ${JSON.stringify(t)}`)}}const It="https://api.wavespeed.ai";async function Ua(e,t){const n=Te(new Uint8Array(e instanceof ArrayBuffer?e:await e.arrayBuffer())),a=Array.isArray(t)&&t.every(o=>typeof o=="string")?t:[n];return{base:n,images:a}}class Ot extends ye{constructor(t){super("wavespeed",t||It)}makeRoute(t){return`/api/v3/${t.model}`}preparePayload(t){var a;const n={...M(t.args,["inputs","parameters"]),...t.args.parameters?M(t.args.parameters,["images"]):void 0,prompt:t.args.inputs};return((a=t.mapping)==null?void 0:a.adapter)==="lora"&&(n.loras=[{path:t.mapping.hfModelId,scale:1}]),n}async getResponse(t,n,a,o,i){var d;if(!n||!a)throw new Z("Headers are required for WaveSpeed AI API calls");const s=new URL(n),r=new URL(t.data.urls.get).pathname,l=`${`${s.protocol}//${s.host}${s.host==="router.huggingface.co"?"/wavespeed":""}`}${r}`;for(;;){const p=await fetch(l,{headers:a,signal:i});if(!p.ok)throw new me("Failed to fetch response status from WaveSpeed AI API",{url:l,method:"GET"},{requestId:p.headers.get("x-request-id")??"",status:p.status,body:await p.text()});const f=await p.json(),g=f.data;switch(g.status){case"completed":{if(!((d=g.outputs)!=null&&d[0]))throw new _("Received malformed response from WaveSpeed AI API: No output URL in completed response");const v=g.outputs[0];if(o==="url")return v;if(o==="json")return f;const h=await fetch(v,{signal:i});if(!h.ok)throw new me("Failed to fetch generation output from WaveSpeed AI API",{url:v,method:"GET"},{requestId:h.headers.get("x-request-id")??"",status:h.status,body:await h.text()});const x=await h.blob();return o==="dataUrl"?Ve(x):x}case"failed":throw new _(g.error||"Task failed");default:{await rt(500,i);continue}}}}}class Ps extends Ot{constructor(){super(It)}}class $s extends Ot{constructor(){super(It)}async getResponse(t,n,a,o,i){return super.getResponse(t,n,a,void 0,i)}}class Ma extends Ot{constructor(){super(It)}async preparePayloadAsync(t){var i,s;const n=t.images??((i=t.parameters)==null?void 0:i.images),{base:a,images:o}=await Ua(t.inputs,n);return{...t,inputs:(s=t.parameters)==null?void 0:s.prompt,image:a,images:o}}async getResponse(t,n,a,o,i){return super.getResponse(t,n,a,void 0,i)}}class Na extends Ot{constructor(){super(It)}async preparePayloadAsync(t){var i,s;const n=t.images??((i=t.parameters)==null?void 0:i.images),{base:a,images:o}=await Ua(t.inputs,n);return{...t,inputs:(s=t.parameters)==null?void 0:s.prompt,image:a,images:o}}async getResponse(t,n,a,o,i){return super.getResponse(t,n,a,void 0,i)}}const Cs="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";function Da(){const e=Uint8Array.from(Buffer.from(Cs,"base64"));return new Blob([e],{type:"image/png"})}class Rs extends Ma{constructor(){super()}async preparePayloadAsync(t){const n=t.inputs??Da();return super.preparePayloadAsync({...t,inputs:n})}}class Us extends Na{constructor(){super()}async preparePayloadAsync(t){const n=t.inputs??Da();return super.preparePayloadAsync({...t,inputs:n})}}const ja="https://api.z.ai";class Oa extends ye{constructor(){super("zai-org",ja)}prepareHeaders(t,n){const a=super.prepareHeaders(t,n);return a["x-source-channel"]="hugging_face",a["accept-language"]="en-US,en",a}}class Ms extends fe{constructor(){super("zai-org",ja)}prepareHeaders(t,n){const a=super.prepareHeaders(t,n);return a["x-source-channel"]="hugging_face",a["accept-language"]="en-US,en",a}makeRoute(){return"/api/paas/v4/chat/completions"}}const Vn=60,Ns=5e3;class Ds extends Oa{makeRoute(){return"/api/paas/v4/async/images/generations"}preparePayload(t){return{...M(t.args,["inputs","parameters"]),...t.args.parameters,model:t.model,prompt:t.args.inputs}}async getResponse(t,n,a,o,i){var p;if(!n||!a)throw new Z("URL and headers are required for 'text-to-image' task");if(typeof t!="object"||!t||!("task_status"in t)||!("id"in t)||typeof t.id!="string")throw new _(`Received malformed response from ZAI text-to-image API: expected { id: string, task_status: string }, got: ${JSON.stringify(t)}`);if(t.task_status==="FAIL")throw new _("ZAI API returned task status: FAIL");const s=t.id,r=new URL(n),l=`${`${r.protocol}//${r.host}${r.host==="router.huggingface.co"?"/zai-org":""}`}/api/paas/v4/async-result/${s}`,d={...a,"x-source-channel":"hugging_face","accept-language":"en-US,en"};for(let f=0;f<Vn;f++){await rt(Ns,i);const g=await fetch(l,{method:"GET",headers:d,signal:i});if(!g.ok)throw new me(`Failed to fetch result from ZAI text-to-image API: ${g.status}`,{url:l,method:"GET"},{requestId:g.headers.get("x-request-id")??"",status:g.status,body:await g.text()});const v=await g.json();if(v.task_status==="FAIL")throw new _("ZAI text-to-image API task failed");if(v.task_status==="SUCCESS"){if(!v.image_result||!Array.isArray(v.image_result)||v.image_result.length===0||typeof((p=v.image_result[0])==null?void 0:p.url)!="string"||!De(v.image_result[0].url))throw new _(`Received malformed response from ZAI text-to-image API: expected { image_result: Array<{ url: string }> }, got: ${JSON.stringify(v)}`);const h=v.image_result[0].url;if(o==="json")return{...v};if(o==="url")return h;const S=await(await fetch(h,{signal:i})).blob();return o==="dataUrl"?Ve(S):S}}throw new _(`Timed out while waiting for the result from ZAI API - aborting after ${Vn} attempts`)}}class js extends Oa{makeRoute(){return"/api/paas/v4/layout_parsing"}async preparePayloadAsync(t,n){const a="data"in t&&t.data instanceof Blob?t.data:"inputs"in t?typeof t.inputs=="string"&&De(t.inputs)?await fetch(t.inputs,{signal:n}).then(r=>r.blob()):t.inputs instanceof Blob?t.inputs:void 0:void 0;if(!a||!(a instanceof Blob))throw new Z("ZAI image-to-text requires a URL string or Blob as inputs");const o=a.type||"image/png",i=Te(new Uint8Array(await a.arrayBuffer())),s=`data:${o};base64,${i}`;return{..."data"in t?M(t,"data"):M(t,"inputs"),inputs:s}}preparePayload(t){return{model:t.model,file:t.args.inputs}}async getResponse(t){const n=t==null?void 0:t.md_results;if(typeof n!="string")throw new _(`Received malformed response from ZAI layout_parsing API: expected { md_results: string }, got: ${JSON.stringify(t)}`);return{generated_text:n,generatedText:n}}}const Gt={baseten:{conversational:new ki},"black-forest-labs":{"text-to-image":new Ii},cerebras:{conversational:new Ei},clarifai:{conversational:new Si},cohere:{conversational:new Li},deepinfra:{conversational:new Pi,"text-generation":new $i},"fal-ai":{"automatic-speech-recognition":new Ni,"image-text-to-image":new Ri,"image-text-to-video":new Mi,"image-to-image":new Sa,"image-segmentation":new ji,"image-to-video":new Ta,"text-to-image":new Ci,"text-to-speech":new Di,"text-to-video":new Ui},"featherless-ai":{conversational:new Oi,"text-generation":new Bi},"hf-inference":{"text-to-image":new Wo,conversational:new Xo,"text-generation":new Qo,"text-classification":new ri,"question-answering":new li,"audio-classification":new Jo,"automatic-speech-recognition":new Yo,"fill-mask":new ci,"feature-extraction":new ei,"image-classification":new ti,"image-segmentation":new ni,"document-question-answering":new Go,"image-to-text":new ai,"object-detection":new ii,"audio-to-audio":new Zo,"zero-shot-image-classification":new si,"zero-shot-classification":new gn,"image-to-image":new oi,"sentence-similarity":new di,"table-question-answering":new Mt,"tabular-classification":new hi,"text-to-speech":new fi,"token-classification":new pi,translation:new ui,summarization:new mi,"visual-question-answering":new gi,"tabular-regression":new yi,"text-to-audio":new bi},"fireworks-ai":{conversational:new qi},groq:{conversational:new Hi,"text-generation":new Fi},hyperbolic:{"text-to-image":new Ki,conversational:new Vi,"text-generation":new zi},nebius:{"text-to-image":new Qi,conversational:new Wi,"text-generation":new Xi,"feature-extraction":new Ji},novita:{conversational:new Zi,"text-generation":new Yi,"text-to-video":new Gi},nscale:{"text-to-image":new ts,conversational:new es},nvidia:{conversational:new ns},openai:{conversational:new os},ovhcloud:{conversational:new is,"text-generation":new ss},publicai:{conversational:new rs},replicate:{"text-to-image":new ls,"text-to-speech":new cs,"text-to-video":new ds,"image-to-image":new us,"automatic-speech-recognition":new ps},sambanova:{conversational:new ms,"feature-extraction":new fs},scaleway:{conversational:new hs,"text-generation":new gs,"feature-extraction":new ys},together:{"text-to-image":new $a,"image-to-image":new _s,"text-to-video":new Ss,"image-to-video":new Ts,conversational:new ws,"text-generation":new xs,"feature-extraction":new Is,"text-to-speech":new Es,"automatic-speech-recognition":new Ls},wavespeed:{"text-to-image":new Ps,"text-to-video":new $s,"image-to-image":new Ma,"image-to-video":new Na,"image-text-to-image":new Rs,"image-text-to-video":new Us},"zai-org":{conversational:new Ms,"text-to-image":new Ds,"image-to-text":new js}};function K(e,t){if(e==="hf-inference"&&!t||e==="auto")return new G;if(!t)throw new Z("you need to provide a task name when using an external provider, e.g. 'text-to-image'");if(!(e in Gt))throw new Z(`Provider '${e}' not supported. Available providers: ${Object.keys(Gt)}`);const n=Gt[e];if(!n||!(t in n))throw new Z(`Task '${t}' not supported for provider '${e}'. Available tasks: ${Object.keys(n??{})}`);return n[t]}const Os="4.13.18",Bs="@huggingface/inference";let en=null;async function Ge(e,t,n){const{model:a}=e,o=t.provider,{task:i}=n??{};if(e.endpointUrl&&o!=="hf-inference")throw new Z("Cannot use endpointUrl with a third-party provider.");if(a&&De(a))throw new Z("Model URLs are no longer supported. Use endpointUrl instead.");if(e.endpointUrl)return zn(a??e.endpointUrl,t,e,void 0,n);if(!a&&!i)throw new Z("No model provided, and no task has been specified.");const s=a??await qs(i);if(t.clientSideRoutingOnly&&!a)throw new Z(`Provider ${o} requires a model ID to be passed directly.`);const r=t.clientSideRoutingOnly?{provider:o,providerId:Hs(a,o),hfModelId:a,status:"live",task:i}:await xi({modelId:s,task:i,provider:o,accessToken:e.accessToken},{fetch:n==null?void 0:n.fetch});if(!r)throw new Z(`We have not been able to find inference provider information for model ${s}.`);return zn(r.providerId,t,e,r,n)}function zn(e,t,n,a,o){const{accessToken:i,endpointUrl:s,provider:r,model:c,urlTransform:l,...d}=n,p=t.provider,{includeCredentials:f,task:g,signal:v,billTo:h,outputType:x}=o??{},S=(()=>{if(t.clientSideRoutingOnly&&i&&i.startsWith("hf_"))throw new Z(`Provider ${p} is closed-source and does not support HF tokens.`);return i?i.startsWith("hf_")?"hf-token":"provider-key":f==="include"?"credentials-include":"none"})(),$=s??e,C=t.makeUrl({authMethod:S,model:$,task:g,urlTransform:l}),A=t.prepareHeaders({accessToken:i,authMethod:S},"data"in n&&!!n.data);h&&(A[Ho]=h);const R=[`${Bs}/${Os}`,typeof navigator<"u"?navigator.userAgent:void 0].filter(P=>P!==void 0).join(" ");A["User-Agent"]=R;const j=t.makeBody({args:d,model:e,task:g,mapping:a,outputType:x});let W;typeof f=="string"?W=f:f===!0&&(W="include");const w={headers:A,method:"POST",body:j,...W?{credentials:W}:void 0,signal:v};return{url:C,info:w}}async function qs(e){en||(en=await Fs());const t=en[e];if(((t==null?void 0:t.models.length)??0)<=0)throw new Z(`No default model defined for task ${e}, please define the model explicitly.`);return t.models[0].id}async function Fs(){const e=`${hn}/api/tasks`,t=await fetch(e);if(!t.ok)throw new ht("Failed to load tasks definitions from Hugging Face Hub.",{url:e,method:"GET"},{requestId:t.headers.get("x-request-id")??"",status:t.status,body:await t.text()});return await t.json()}function Hs(e,t){if(!e.startsWith(`${t}/`))throw new Z(`Models from ${t} must be prefixed by "${t}/". Got "${e}".`);return e.slice(t.length+1)}function Vs(e){let t,n,a,o=!1;return function(s){t===void 0?(t=s,n=0,a=-1):t=Ks(t,s);const r=t.length;let c=0;for(;n<r;){o&&(t[n]===10&&(c=++n),o=!1);let l=-1;for(;n<r&&l===-1;++n)switch(t[n]){case 58:a===-1&&(a=n-c);break;case 13:o=!0;case 10:l=n;break}if(l===-1)break;e(t.subarray(c,l),a),c=n,a=-1}c===r?t=void 0:c!==0&&(t=t.subarray(c),n-=c)}}function zs(e,t,n){let a=Kn();const o=new TextDecoder;return function(s,r){if(s.length===0)n==null||n(a),a=Kn();else if(r>0){const c=o.decode(s.subarray(0,r)),l=r+(s[r+1]===32?2:1),d=o.decode(s.subarray(l));switch(c){case"data":a.data=a.data?a.data+`
`+d:d;break;case"event":a.event=d;break;case"id":e(a.id=d);break;case"retry":{const p=parseInt(d,10);isNaN(p)||t(a.retry=p);break}}}}}function Ks(e,t){const n=new Uint8Array(e.length+t.length);return n.set(e),n.set(t,e.length),n}function Kn(){return{data:"",event:"",id:"",retry:void 0}}function Me(e){let t=null;if(e instanceof Blob||e instanceof ArrayBuffer)t="[Blob or ArrayBuffer]";else if(typeof FormData<"u"&&e instanceof FormData)t="[FormData]";else if(typeof e=="string")try{t=JSON.parse(e)}catch{t=e}return t&&typeof t=="object"&&"accessToken"in t&&(t.accessToken="[REDACTED]"),t}async function Y(e,t,n){var c;const{url:a,info:o}=await Ge(e,t,n),i=await((n==null?void 0:n.fetch)??fetch)(a,o),s={url:a,info:o};if((n==null?void 0:n.retry_on_error)!==!1&&i.status===503)return Y(e,t,n);if(!i.ok){const l=i.headers.get("Content-Type");if(["application/json","application/problem+json"].some(p=>l==null?void 0:l.startsWith(p))){const p=await i.json();throw[400,422,404,500].includes(i.status)&&(n!=null&&n.chatCompletion)?new me(`Provider ${e.provider} does not seem to support chat completion for model ${e.model} . Error: ${JSON.stringify(p.error)}`,{url:a,method:o.method??"GET",headers:o.headers,body:Me(o.body)},{requestId:i.headers.get("x-request-id")??"",status:i.status,body:p}):typeof p.error=="string"||typeof p.detail=="string"||typeof p.message=="string"?new me(`Failed to perform inference: ${p.error??p.detail??p.message}`,{url:a,method:o.method??"GET",headers:o.headers,body:Me(o.body)},{requestId:i.headers.get("x-request-id")??"",status:i.status,body:p}):new me("Failed to perform inference: an HTTP error occurred when requesting the provider.",{url:a,method:o.method??"GET",headers:o.headers,body:Me(o.body)},{requestId:i.headers.get("x-request-id")??"",status:i.status,body:p})}const d=l!=null&&l.startsWith("text/plain;")?await i.text():void 0;throw new me(`Failed to perform inference: ${d??"an HTTP error occurred when requesting the provider"}`,{url:a,method:o.method??"GET",headers:o.headers,body:Me(o.body)},{requestId:i.headers.get("x-request-id")??"",status:i.status,body:d??""})}return(c=i.headers.get("Content-Type"))!=null&&c.startsWith("application/json")?{data:await i.json(),requestContext:s}:{data:await i.blob(),requestContext:s}}async function*Bt(e,t,n){var d,p;const{url:a,info:o}=await Ge({...e,stream:!0},t,n),i=await((n==null?void 0:n.fetch)??fetch)(a,o);if((n==null?void 0:n.retry_on_error)!==!1&&i.status===503)return yield*Bt(e,t,n);if(!i.ok){if((d=i.headers.get("Content-Type"))!=null&&d.startsWith("application/json")){const f=await i.json();if([400,422,404,500].includes(i.status)&&(n!=null&&n.chatCompletion))throw new me(`Provider ${e.provider} does not seem to support chat completion for model ${e.model} . Error: ${JSON.stringify(f.error)}`,{url:a,method:o.method??"GET",headers:o.headers,body:Me(o.body)},{requestId:i.headers.get("x-request-id")??"",status:i.status,body:f});if(typeof f.error=="string")throw new me(`Failed to perform inference: ${f.error}`,{url:a,method:o.method??"GET",headers:o.headers,body:Me(o.body)},{requestId:i.headers.get("x-request-id")??"",status:i.status,body:f});if(f.error&&"message"in f.error&&typeof f.error.message=="string")throw new me(`Failed to perform inference: ${f.error.message}`,{url:a,method:o.method??"GET",headers:o.headers,body:Me(o.body)},{requestId:i.headers.get("x-request-id")??"",status:i.status,body:f});if(typeof f.message=="string")throw new me(`Failed to perform inference: ${f.message}`,{url:a,method:o.method??"GET",headers:o.headers,body:Me(o.body)},{requestId:i.headers.get("x-request-id")??"",status:i.status,body:f})}throw new me("Failed to perform inference: an HTTP error occurred when requesting the provider.",{url:a,method:o.method??"GET",headers:o.headers,body:Me(o.body)},{requestId:i.headers.get("x-request-id")??"",status:i.status,body:""})}if(!((p=i.headers.get("content-type"))!=null&&p.startsWith("text/event-stream")))throw new me("Failed to perform inference: server does not support event stream content type, it returned "+i.headers.get("content-type"),{url:a,method:o.method??"GET",headers:o.headers,body:Me(o.body)},{requestId:i.headers.get("x-request-id")??"",status:i.status,body:""});if(!i.body)return;const s=i.body.getReader();let r=[];const l=Vs(zs(()=>{},()=>{},f=>{r.push(f)}));try{for(;;){const{done:f,value:g}=await s.read();if(f)return;l(g);for(const v of r)if(v.data.length>0){if(v.data==="[DONE]")return;const h=JSON.parse(v.data);if(typeof h=="object"&&h!==null&&"error"in h){const x=typeof h.error=="string"?h.error:typeof h.error=="object"&&h.error&&"message"in h.error&&typeof h.error.message=="string"?h.error.message:JSON.stringify(h.error);throw new me(`Failed to perform inference: an occurred while streaming the response: ${x}`,{url:a,method:o.method??"GET",headers:o.headers,body:Me(o.body)},{requestId:i.headers.get("x-request-id")??"",status:i.status,body:h})}yield h}r=[]}}finally{s.releaseLock()}}async function Ws(e,t){At().warn("The request method is deprecated and will be removed in a future version of huggingface.js. Use specific task functions instead.");const a=await z(e.provider,e.model,e.endpointUrl),o=K(a,t==null?void 0:t.task);return(await Y(e,o,t)).data}async function*Xs(e,t){At().warn("The streamingRequest method is deprecated and will be removed in a future version of huggingface.js. Use specific task functions instead.");const a=await z(e.provider,e.model,e.endpointUrl),o=K(a,t==null?void 0:t.task);yield*Bt(e,o,t)}function Ba(e){return"data"in e?e:{...M(e,"inputs"),data:e.inputs}}async function Qs(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"audio-classification"),o=Ba(e),{data:i}=await Y(o,a,{...t,task:"audio-classification"});return a.getResponse(i)}async function Js(e,t){const n="inputs"in e?e.model:void 0,a=await z(e.provider,n),o=K(a,"audio-to-audio"),i=Ba(e),{data:s}=await Y(i,o,{...t,task:"audio-to-audio"});return o.getResponse(s)}async function Ys(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"automatic-speech-recognition"),o=await a.preparePayloadAsync(e),{data:i}=await Y(o,a,{...t,task:"automatic-speech-recognition"});return a.getResponse(i,void 0,void 0,void 0,t==null?void 0:t.signal)}async function Zs(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"text-to-speech"),{data:o}=await Y(e,a,{...t,task:"text-to-speech"});return a.getResponse(o,void 0,void 0,void 0,t==null?void 0:t.signal)}function qa(e){return"data"in e?e:{...M(e,"inputs"),data:e.inputs}}async function Gs(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"image-classification"),o=qa(e),{data:i}=await Y(o,a,{...t,task:"image-classification"});return a.getResponse(i)}async function er(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"image-segmentation"),o=await a.preparePayloadAsync(e),{data:i}=await Y(o,a,{...t,task:"image-segmentation"}),{url:s,info:r}=await Ge(e,a,{...t,task:"image-segmentation"});return a.getResponse(i,s,r.headers,void 0,t==null?void 0:t.signal)}async function tr(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"image-to-image"),o=await a.preparePayloadAsync(e),{data:i}=await Y(o,a,{...t,task:"image-to-image"}),{url:s,info:r}=await Ge(e,a,{...t,task:"image-to-image"});return a.getResponse(i,s,r.headers,void 0,t==null?void 0:t.signal)}async function nr(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"image-to-text"),o=await a.preparePayloadAsync(e,t==null?void 0:t.signal),{data:i}=await Y(o,a,{...t,task:"image-to-text"});return a.getResponse(i)}async function ar(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"image-to-video"),o=await a.preparePayloadAsync(e),{data:i}=await Y(o,a,{...t,task:"image-to-video"}),{url:s,info:r}=await Ge(e,a,{...t,task:"image-to-video"});return a.getResponse(i,s,r.headers,void 0,t==null?void 0:t.signal)}async function or(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"image-text-to-image"),o=await a.preparePayloadAsync(e),{data:i,requestContext:s}=await Y(o,a,{...t,task:"image-text-to-image"});return a.getResponse(i,s.url,s.info.headers,void 0,t==null?void 0:t.signal)}async function ir(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"image-text-to-video"),o=await a.preparePayloadAsync(e),{data:i,requestContext:s}=await Y(o,a,{...t,task:"image-text-to-video"});return a.getResponse(i,s.url,s.info.headers,void 0,t==null?void 0:t.signal)}async function sr(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"object-detection"),o=qa(e),{data:i}=await Y(o,a,{...t,task:"object-detection"});return a.getResponse(i)}async function rr(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"text-to-image"),{data:o}=await Y(e,a,{...t,task:"text-to-image"}),{url:i,info:s}=await Ge(e,a,{...t,task:"text-to-image"});return a.getResponse(o,i,s.headers,t==null?void 0:t.outputType,t==null?void 0:t.signal)}async function lr(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"text-to-video"),{data:o}=await Y(e,a,{...t,task:"text-to-video"}),{url:i,info:s}=await Ge(e,a,{...t,task:"text-to-video"});return a.getResponse(o,i,s.headers,void 0,t==null?void 0:t.signal)}async function cr(e){return e.inputs instanceof Blob?{...e,inputs:{image:Te(new Uint8Array(await e.inputs.arrayBuffer()))}}:{...e,inputs:{image:Te(new Uint8Array(e.inputs.image instanceof ArrayBuffer?e.inputs.image:await e.inputs.image.arrayBuffer()))}}}async function dr(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"zero-shot-image-classification"),o=await cr(e),{data:i}=await Y(o,a,{...t,task:"zero-shot-image-classification"});return a.getResponse(i)}async function pr(e,t){let n;if(e.endpointUrl){const o=await z(e.provider,e.model,e.endpointUrl);n=K(o,"conversational")}else if(!e.provider||e.provider==="auto")n=new xa;else{const o=await z(e.provider,e.model,e.endpointUrl);n=K(o,"conversational")}const{data:a}=await Y(e,n,{...t,task:"conversational"});return n.getResponse(a)}async function*ur(e,t){let n;if(e.endpointUrl){const a=await z(e.provider,e.model,e.endpointUrl);n=K(a,"conversational")}else if(!e.provider||e.provider==="auto")n=new xa;else{const a=await z(e.provider,e.model,e.endpointUrl);n=K(a,"conversational")}yield*Bt(e,n,{...t,task:"conversational"})}async function mr(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"feature-extraction"),{data:o}=await Y(e,a,{...t,task:"feature-extraction"});return a.getResponse(o)}async function fr(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"fill-mask"),{data:o}=await Y(e,a,{...t,task:"fill-mask"});return a.getResponse(o)}async function hr(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"question-answering"),{data:o}=await Y(e,a,{...t,task:"question-answering"});return a.getResponse(o)}async function gr(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"sentence-similarity"),{data:o}=await Y(e,a,{...t,task:"sentence-similarity"});return a.getResponse(o)}async function yr(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"summarization"),{data:o}=await Y(e,a,{...t,task:"summarization"});return a.getResponse(o)}async function br(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"table-question-answering"),{data:o}=await Y(e,a,{...t,task:"table-question-answering"});return a.getResponse(o)}async function vr(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"text-classification"),{data:o}=await Y(e,a,{...t,task:"text-classification"});return a.getResponse(o)}async function wr(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"text-generation"),{data:o}=await Y(e,a,{...t,task:"text-generation"});return a.getResponse(o)}async function*xr(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"text-generation");yield*Bt(e,a,{...t,task:"text-generation"})}async function _r(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"token-classification"),{data:o}=await Y(e,a,{...t,task:"token-classification"});return a.getResponse(o)}async function kr(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"translation"),{data:o}=await Y(e,a,{...t,task:"translation"});return a.getResponse(o)}async function Ar(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"zero-shot-classification"),{data:o}=await Y(e,a,{...t,task:"zero-shot-classification"});return a.getResponse(o)}async function Sr(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"document-question-answering"),o={...e,inputs:{question:e.inputs.question,image:Te(new Uint8Array(await e.inputs.image.arrayBuffer()))}},{data:i}=await Y(o,a,{...t,task:"document-question-answering"});return a.getResponse(i)}async function Tr(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"visual-question-answering"),o={...e,inputs:{question:e.inputs.question,image:Te(new Uint8Array(await e.inputs.image.arrayBuffer()))}},{data:i}=await Y(o,a,{...t,task:"visual-question-answering"});return a.getResponse(i)}async function Ir(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"tabular-classification"),{data:o}=await Y(e,a,{...t,task:"tabular-classification"});return a.getResponse(o)}async function Er(e,t){const n=await z(e.provider,e.model,e.endpointUrl),a=K(n,"tabular-regression"),{data:o}=await Y(e,a,{...t,task:"tabular-regression"});return a.getResponse(o)}const Lr=Object.freeze(Object.defineProperty({__proto__:null,audioClassification:Qs,audioToAudio:Js,automaticSpeechRecognition:Ys,chatCompletion:pr,chatCompletionStream:ur,documentQuestionAnswering:Sr,featureExtraction:mr,fillMask:fr,imageClassification:Gs,imageSegmentation:er,imageTextToImage:or,imageTextToVideo:ir,imageToImage:tr,imageToText:nr,imageToVideo:ar,objectDetection:sr,questionAnswering:hr,request:Ws,sentenceSimilarity:gr,streamingRequest:Xs,summarization:yr,tableQuestionAnswering:br,tabularClassification:Ir,tabularRegression:Er,textClassification:vr,textGeneration:wr,textGenerationStream:xr,textToImage:rr,textToSpeech:Zs,textToVideo:lr,tokenClassification:_r,translation:kr,visualQuestionAnswering:Tr,zeroShotClassification:Ar,zeroShotImageClassification:dr},Symbol.toStringTag,{value:"Module"}));function Pr(e){return Object.entries(e)}class xn{constructor(t="",n={}){E(this,"accessToken");E(this,"defaultOptions");this.accessToken=t,this.defaultOptions=n;for(const[a,o]of Pr(Lr))Object.defineProperty(this,a,{enumerable:!1,value:(i,s)=>o({endpointUrl:n.endpointUrl,accessToken:t,...i},{...M(n,["endpointUrl"]),...s})})}endpoint(t){return new xn(this.accessToken,{...this.defaultOptions,endpointUrl:t})}}class $r extends xn{}var Cr=Object.defineProperty,Rr=(e,t,n)=>t in e?Cr(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,Ur=(e,t,n)=>(Rr(e,t+"",n),n),b=Object.freeze({Text:"Text",NumericLiteral:"NumericLiteral",StringLiteral:"StringLiteral",Identifier:"Identifier",Equals:"Equals",OpenParen:"OpenParen",CloseParen:"CloseParen",OpenStatement:"OpenStatement",CloseStatement:"CloseStatement",OpenExpression:"OpenExpression",CloseExpression:"CloseExpression",OpenSquareBracket:"OpenSquareBracket",CloseSquareBracket:"CloseSquareBracket",OpenCurlyBracket:"OpenCurlyBracket",CloseCurlyBracket:"CloseCurlyBracket",Comma:"Comma",Dot:"Dot",Colon:"Colon",Pipe:"Pipe",CallOperator:"CallOperator",AdditiveBinaryOperator:"AdditiveBinaryOperator",MultiplicativeBinaryOperator:"MultiplicativeBinaryOperator",ComparisonBinaryOperator:"ComparisonBinaryOperator",UnaryOperator:"UnaryOperator",Comment:"Comment"}),Ue=class{constructor(e,t){this.value=e,this.type=t}};function Wn(e){return/\w/.test(e)}function pt(e){return/[0-9]/.test(e)}function Xn(e){return/\s/.test(e)}var Mr=[["{%",b.OpenStatement],["%}",b.CloseStatement],["{{",b.OpenExpression],["}}",b.CloseExpression],["(",b.OpenParen],[")",b.CloseParen],["{",b.OpenCurlyBracket],["}",b.CloseCurlyBracket],["[",b.OpenSquareBracket],["]",b.CloseSquareBracket],[",",b.Comma],[".",b.Dot],[":",b.Colon],["|",b.Pipe],["<=",b.ComparisonBinaryOperator],[">=",b.ComparisonBinaryOperator],["==",b.ComparisonBinaryOperator],["!=",b.ComparisonBinaryOperator],["<",b.ComparisonBinaryOperator],[">",b.ComparisonBinaryOperator],["+",b.AdditiveBinaryOperator],["-",b.AdditiveBinaryOperator],["~",b.AdditiveBinaryOperator],["*",b.MultiplicativeBinaryOperator],["/",b.MultiplicativeBinaryOperator],["%",b.MultiplicativeBinaryOperator],["=",b.Equals]],Nr=new Map([["n",`
`],["t","	"],["r","\r"],["b","\b"],["f","\f"],["v","\v"],["'","'"],['"','"'],["\\","\\"]]);function Dr(e,t={}){return e.endsWith(`
`)&&(e=e.slice(0,-1)),t.lstrip_blocks&&(e=e.replace(/^[ \t]*({[#%-])/gm,"$1")),t.trim_blocks&&(e=e.replace(/([#%-]})\n/g,"$1")),e.replace(/(\s*){%(-?)\s*(?:end)?generation\s*(-?)%}(\s*)/gs,(n,a,o,i,s)=>(o?"":a)+(i?"":s))}function jr(e,t={}){var l,d,p;const n=[],a=Dr(e,t);let o=0,i=0;const s=f=>{let g="";for(;f(a[o]);){if(a[o]==="\\"){if(++o,o>=a.length)throw new SyntaxError("Unexpected end of input");const v=a[o++],h=Nr.get(v);if(h===void 0)throw new SyntaxError(`Unexpected escaped character: ${v}`);g+=h;continue}if(g+=a[o++],o>=a.length)throw new SyntaxError("Unexpected end of input")}return g},r=()=>{const f=n.at(-1);f&&f.type===b.Text&&(f.value=f.value.trimEnd(),f.value===""&&n.pop())},c=()=>{for(;o<a.length&&Xn(a[o]);)++o};e:for(;o<a.length;){const f=(l=n.at(-1))==null?void 0:l.type;if(f===void 0||f===b.CloseStatement||f===b.CloseExpression||f===b.Comment){let v="";for(;o<a.length&&!(a[o]==="{"&&(a[o+1]==="%"||a[o+1]==="{"||a[o+1]==="#"));)v+=a[o++];if(v.length>0){n.push(new Ue(v,b.Text));continue}}if(a[o]==="{"&&a[o+1]==="#"){o+=2;const v=a[o]==="-";v&&++o;let h="";for(;a[o]!=="#"||a[o+1]!=="}";){if(o+2>=a.length)throw new SyntaxError("Missing end of comment tag");h+=a[o++]}const x=h.endsWith("-");x&&(h=h.slice(0,-1)),v&&r(),n.push(new Ue(h,b.Comment)),o+=2,x&&c();continue}if(a.slice(o,o+3)==="{%-"){r(),n.push(new Ue("{%",b.OpenStatement)),o+=3;continue}if(a.slice(o,o+3)==="{{-"){r(),n.push(new Ue("{{",b.OpenExpression)),i=0,o+=3;continue}if(s(Xn),a.slice(o,o+3)==="-%}"){n.push(new Ue("%}",b.CloseStatement)),o+=3,c();continue}if(a.slice(o,o+3)==="-}}"){n.push(new Ue("}}",b.CloseExpression)),o+=3,c();continue}const g=a[o];if(g==="-"||g==="+"){const v=(d=n.at(-1))==null?void 0:d.type;if(v===b.Text||v===void 0)throw new SyntaxError(`Unexpected character: ${g}`);switch(v){case b.Identifier:case b.NumericLiteral:case b.StringLiteral:case b.CloseParen:case b.CloseSquareBracket:break;default:{++o;const h=s(pt);n.push(new Ue(`${g}${h}`,h.length>0?b.NumericLiteral:b.UnaryOperator));continue}}}for(const[v,h]of Mr){if(v==="}}"&&i>0)continue;if(a.slice(o,o+v.length)===v){n.push(new Ue(v,h)),h===b.OpenExpression?i=0:h===b.OpenCurlyBracket?++i:h===b.CloseCurlyBracket&&--i,o+=v.length;continue e}}if(g==="'"||g==='"'){++o;const v=s(h=>h!==g);n.push(new Ue(v,b.StringLiteral)),++o;continue}if(pt(g)){let v=s(pt);if(((p=n.at(-1))==null?void 0:p.type)!==b.Dot&&a[o]==="."&&pt(a[o+1])){++o;const h=s(pt);v=`${v}.${h}`}n.push(new Ue(v,b.NumericLiteral));continue}if(Wn(g)){const v=s(Wn);n.push(new Ue(v,b.Identifier));continue}throw new SyntaxError(`Unexpected character: ${g}`)}return n}var je=class{constructor(){E(this,"type","Statement")}},Or=class extends je{constructor(t){super();E(this,"type","Program");this.body=t}},Br=class extends je{constructor(t,n,a){super();E(this,"type","If");this.test=t,this.body=n,this.alternate=a}},qr=class extends je{constructor(t,n,a,o){super();E(this,"type","For");this.loopvar=t,this.iterable=n,this.body=a,this.defaultBlock=o}},Fr=class extends je{constructor(){super(...arguments);E(this,"type","Break")}},Hr=class extends je{constructor(){super(...arguments);E(this,"type","Continue")}},Vr=class extends je{constructor(t,n,a){super();E(this,"type","Set");this.assignee=t,this.value=n,this.body=a}},zr=class extends je{constructor(t,n,a){super();E(this,"type","Macro");this.name=t,this.args=n,this.body=a}},Kr=class extends je{constructor(t){super();E(this,"type","Comment");this.value=t}},Re=class extends je{constructor(){super(...arguments);E(this,"type","Expression")}},Wr=class extends Re{constructor(t,n,a){super();E(this,"type","MemberExpression");this.object=t,this.property=n,this.computed=a}},Qn=class extends Re{constructor(t,n){super();E(this,"type","CallExpression");this.callee=t,this.args=n}},nt=class extends Re{constructor(t){super();E(this,"type","Identifier");this.value=t}},lt=class extends Re{constructor(t){super();E(this,"type","Literal");this.value=t}},Xr=class extends lt{constructor(){super(...arguments);E(this,"type","IntegerLiteral")}},Qr=class extends lt{constructor(){super(...arguments);E(this,"type","FloatLiteral")}},Jn=class extends lt{constructor(){super(...arguments);E(this,"type","StringLiteral")}},Jr=class extends lt{constructor(){super(...arguments);E(this,"type","ArrayLiteral")}},Yn=class extends lt{constructor(){super(...arguments);E(this,"type","TupleLiteral")}},Yr=class extends lt{constructor(){super(...arguments);E(this,"type","ObjectLiteral")}},ut=class extends Re{constructor(t,n,a){super();E(this,"type","BinaryExpression");this.operator=t,this.left=n,this.right=a}},Zr=class extends Re{constructor(t,n){super();E(this,"type","FilterExpression");this.operand=t,this.filter=n}},Gr=class extends je{constructor(t,n){super();E(this,"type","FilterStatement");this.filter=t,this.body=n}},el=class extends Re{constructor(t,n){super();E(this,"type","SelectExpression");this.lhs=t,this.test=n}},tl=class extends Re{constructor(t,n,a){super();E(this,"type","TestExpression");this.operand=t,this.negate=n,this.test=a}},nl=class extends Re{constructor(t,n){super();E(this,"type","UnaryExpression");this.operator=t,this.argument=n}},al=class extends Re{constructor(t=void 0,n=void 0,a=void 0){super();E(this,"type","SliceExpression");this.start=t,this.stop=n,this.step=a}},ol=class extends Re{constructor(t,n){super();E(this,"type","KeywordArgumentExpression");this.key=t,this.value=n}},il=class extends Re{constructor(t){super();E(this,"type","SpreadExpression");this.argument=t}},sl=class extends je{constructor(t,n,a){super();E(this,"type","CallStatement");this.call=t,this.callerArgs=n,this.body=a}},rl=class extends Re{constructor(t,n,a){super();E(this,"type","Ternary");this.condition=t,this.trueExpr=n,this.falseExpr=a}};function ll(e){const t=new Or([]);let n=0;function a(u,m){const y=e[n++];if(!y||y.type!==u)throw new Error(`Parser Error: ${m}. ${y.type} !== ${u}.`);return y}function o(u){if(!c(u))throw new SyntaxError(`Expected ${u}`);++n}function i(){switch(e[n].type){case b.Comment:return new Kr(e[n++].value);case b.Text:return l();case b.OpenStatement:return d();case b.OpenExpression:return p();default:throw new SyntaxError(`Unexpected token type: ${e[n].type}`)}}function s(...u){return n+u.length<=e.length&&u.every((m,y)=>m===e[n+y].type)}function r(...u){var m,y,k;return((m=e[n])==null?void 0:m.type)===b.OpenStatement&&((y=e[n+1])==null?void 0:y.type)===b.Identifier&&u.includes((k=e[n+1])==null?void 0:k.value)}function c(...u){return n+u.length<=e.length&&u.every((m,y)=>e[n+y].type==="Identifier"&&m===e[n+y].value)}function l(){return new Jn(a(b.Text,"Expected text token").value)}function d(){if(a(b.OpenStatement,"Expected opening statement token"),e[n].type!==b.Identifier)throw new SyntaxError(`Unknown statement, got ${e[n].type}`);const u=e[n].value;let m;switch(u){case"set":++n,m=f();break;case"if":++n,m=g(),a(b.OpenStatement,"Expected {% token"),o("endif"),a(b.CloseStatement,"Expected %} token");break;case"macro":++n,m=v(),a(b.OpenStatement,"Expected {% token"),o("endmacro"),a(b.CloseStatement,"Expected %} token");break;case"for":++n,m=x(),a(b.OpenStatement,"Expected {% token"),o("endfor"),a(b.CloseStatement,"Expected %} token");break;case"call":{++n;let y=null;s(b.OpenParen)&&(y=P());const k=ne();if(k.type!=="Identifier")throw new SyntaxError("Expected identifier following call statement");const I=P();a(b.CloseStatement,"Expected closing statement token");const X=[];for(;!r("endcall");)X.push(i());a(b.OpenStatement,"Expected '{%'"),o("endcall"),a(b.CloseStatement,"Expected closing statement token");const re=new Qn(k,I);m=new sl(re,y,X);break}case"break":++n,a(b.CloseStatement,"Expected closing statement token"),m=new Fr;break;case"continue":++n,a(b.CloseStatement,"Expected closing statement token"),m=new Hr;break;case"filter":{++n;let y=ne();y instanceof nt&&s(b.OpenParen)&&(y=w(y)),a(b.CloseStatement,"Expected closing statement token");const k=[];for(;!r("endfilter");)k.push(i());a(b.OpenStatement,"Expected '{%'"),o("endfilter"),a(b.CloseStatement,"Expected '%}'"),m=new Gr(y,k);break}default:throw new SyntaxError(`Unknown statement type: ${u}`)}return m}function p(){a(b.OpenExpression,"Expected opening expression token");const u=S();return a(b.CloseExpression,"Expected closing expression token"),u}function f(){const u=h();let m=null;const y=[];if(s(b.Equals))++n,m=h();else{for(a(b.CloseStatement,"Expected %} token");!r("endset");)y.push(i());a(b.OpenStatement,"Expected {% token"),o("endset")}return a(b.CloseStatement,"Expected closing statement token"),new Vr(u,m,y)}function g(){const u=S();a(b.CloseStatement,"Expected closing statement token");const m=[],y=[];for(;!r("elif","else","endif");)m.push(i());if(r("elif")){++n,++n;const k=g();y.push(k)}else if(r("else"))for(++n,++n,a(b.CloseStatement,"Expected closing statement token");!r("endif");)y.push(i());return new Br(u,m,y)}function v(){const u=ne();if(u.type!=="Identifier")throw new SyntaxError("Expected identifier following macro statement");const m=P();a(b.CloseStatement,"Expected closing statement token");const y=[];for(;!r("endmacro");)y.push(i());return new zr(u,m,y)}function h(u=!1){const m=u?ne:S,y=[m()],k=s(b.Comma);for(;k&&(++n,y.push(m()),!!s(b.Comma)););return k?new Yn(y):y[0]}function x(){const u=h(!0);if(!(u instanceof nt||u instanceof Yn))throw new SyntaxError(`Expected identifier/tuple for the loop variable, got ${u.type} instead`);if(!c("in"))throw new SyntaxError("Expected `in` keyword following loop variable");++n;const m=S();a(b.CloseStatement,"Expected closing statement token");const y=[];for(;!r("endfor","else");)y.push(i());const k=[];if(r("else"))for(++n,++n,a(b.CloseStatement,"Expected closing statement token");!r("endfor");)k.push(i());return new qr(u,m,y,k)}function S(){return $()}function $(){const u=C();if(c("if")){++n;const m=C();if(c("else")){++n;const y=$();return new rl(m,u,y)}else return new el(u,m)}return u}function C(){let u=A();for(;c("or");){const m=e[n];++n;const y=A();u=new ut(m,u,y)}return u}function A(){let u=L();for(;c("and");){const m=e[n];++n;const y=L();u=new ut(m,u,y)}return u}function L(){let u;for(;c("not");){const m=e[n];++n;const y=L();u=new nl(m,y)}return u??R()}function R(){let u=j();for(;;){let m;if(c("not","in"))m=new Ue("not in",b.Identifier),n+=2;else if(c("in"))m=e[n++];else if(s(b.ComparisonBinaryOperator))m=e[n++];else break;const y=j();u=new ut(m,u,y)}return u}function j(){let u=ee();for(;s(b.AdditiveBinaryOperator);){const m=e[n];++n;const y=ee();u=new ut(m,u,y)}return u}function W(){const u=H(ne());return s(b.OpenParen)?w(u):u}function w(u){let m=new Qn(u,P());return m=H(m),s(b.OpenParen)&&(m=w(m)),m}function P(){a(b.OpenParen,"Expected opening parenthesis for arguments list");const u=U();return a(b.CloseParen,"Expected closing parenthesis for arguments list"),u}function U(){const u=[];for(;!s(b.CloseParen);){let m;if(e[n].type===b.MultiplicativeBinaryOperator&&e[n].value==="*"){++n;const y=S();m=new il(y)}else if(m=S(),s(b.Equals)){if(++n,!(m instanceof nt))throw new SyntaxError("Expected identifier for keyword argument");const y=S();m=new ol(m,y)}u.push(m),s(b.Comma)&&++n}return u}function N(){const u=[];let m=!1;for(;!s(b.CloseSquareBracket);)s(b.Colon)?(u.push(void 0),++n,m=!0):(u.push(S()),s(b.Colon)&&(++n,m=!0));if(u.length===0)throw new SyntaxError("Expected at least one argument for member/slice expression");if(m){if(u.length>3)throw new SyntaxError("Expected 0-3 arguments for slice expression");return new al(...u)}return u[0]}function H(u){for(;s(b.Dot)||s(b.OpenSquareBracket);){const m=e[n];++n;let y;const k=m.type===b.OpenSquareBracket;if(k)y=N(),a(b.CloseSquareBracket,"Expected closing square bracket");else if(y=ne(),y.type!=="Identifier"&&y.type!=="IntegerLiteral")throw new SyntaxError("Expected identifier or integer following dot operator");u=new Wr(u,y,k)}return u}function ee(){let u=be();for(;s(b.MultiplicativeBinaryOperator);){const m=e[n++],y=be();u=new ut(m,u,y)}return u}function be(){let u=ae();for(;c("is");){++n;const m=c("not");m&&++n;const y=ne();if(!(y instanceof nt))throw new SyntaxError("Expected identifier for the test");u=new tl(u,m,y)}return u}function ae(){let u=W();for(;s(b.Pipe);){++n;let m=ne();if(!(m instanceof nt))throw new SyntaxError("Expected identifier for the filter");s(b.OpenParen)&&(m=w(m)),u=new Zr(u,m)}return u}function ne(){const u=e[n++];switch(u.type){case b.NumericLiteral:{const m=u.value;return m.includes(".")?new Qr(Number(m)):new Xr(Number(m))}case b.StringLiteral:{let m=u.value;for(;s(b.StringLiteral);)m+=e[n++].value;return new Jn(m)}case b.Identifier:return new nt(u.value);case b.OpenParen:{const m=h();return a(b.CloseParen,"Expected closing parenthesis, got ${tokens[current].type} instead."),m}case b.OpenSquareBracket:{const m=[];for(;!s(b.CloseSquareBracket);)m.push(S()),s(b.Comma)&&++n;return++n,new Jr(m)}case b.OpenCurlyBracket:{const m=new Map;for(;!s(b.CloseCurlyBracket);){const y=S();a(b.Colon,"Expected colon between key and value in object literal");const k=S();m.set(y,k),s(b.Comma)&&++n}return++n,new Yr(m)}default:throw new SyntaxError(`Unexpected token: ${u.type}`)}}for(;n<e.length;)t.body.push(i());return t}function cl(e,t,n=1){if(t===void 0&&(t=e,e=0),n===0)throw new Error("range() step must not be zero");const a=[];if(n>0)for(let o=e;o<t;o+=n)a.push(o);else for(let o=e;o>t;o+=n)a.push(o);return a}function Zn(e,t,n,a=1){const o=Math.sign(a);o>=0?(t=(t??(t=0))<0?Math.max(e.length+t,0):Math.min(t,e.length),n=(n??(n=e.length))<0?Math.max(e.length+n,0):Math.min(n,e.length)):(t=(t??(t=e.length-1))<0?Math.max(e.length+t,-1):Math.min(t,e.length-1),n=(n??(n=-1))<-1?Math.max(e.length+n,-1):Math.min(n,e.length-1));const i=[];for(let s=t;o*s<o*n;s+=a)i.push(e[s]);return i}function dl(e){return e.replace(/\b\w/g,t=>t.toUpperCase())}function pl(e){return ul(new Date,e)}function ul(e,t){const n=new Intl.DateTimeFormat(void 0,{month:"long"}),a=new Intl.DateTimeFormat(void 0,{month:"short"}),o=i=>i<10?"0"+i:i.toString();return t.replace(/%[YmdbBHM%]/g,i=>{switch(i){case"%Y":return e.getFullYear().toString();case"%m":return o(e.getMonth()+1);case"%d":return o(e.getDate());case"%b":return a.format(e);case"%B":return n.format(e);case"%H":return o(e.getHours());case"%M":return o(e.getMinutes());case"%%":return"%";default:return i}})}function ml(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function fl(e,t,n,a){if(a===0)return e;let o=a==null||a<0?1/0:a;const i=t.length===0?new RegExp("(?=)","gu"):new RegExp(ml(t),"gu");return e.replaceAll(i,s=>o>0?(--o,n):s)}var Gn=class extends Error{},ea=class extends Error{},hl=new Map,ze=class{constructor(e=void 0){E(this,"type","RuntimeValue");E(this,"value");this.value=e}get builtins(){return hl}__bool__(){return new O(!!this.value)}toString(){return String(this.value)}},q=class extends ze{constructor(){super(...arguments);E(this,"type","IntegerValue")}},ue=class extends ze{constructor(){super(...arguments);E(this,"type","FloatValue")}toString(){return this.value%1===0?this.value.toFixed(1):this.value.toString()}},T=class extends ze{constructor(){super(...arguments);E(this,"type","StringValue");E(this,"_builtins")}get builtins(){return this._builtins??(this._builtins=new Map([["upper",new se(()=>new T(this.value.toUpperCase()))],["lower",new se(()=>new T(this.value.toLowerCase()))],["strip",new se(()=>new T(this.value.trim()))],["title",new se(()=>new T(dl(this.value)))],["capitalize",new se(()=>new T(this.value.charAt(0).toUpperCase()+this.value.slice(1)))],["length",new q(this.value.length)],["rstrip",new se(()=>new T(this.value.trimEnd()))],["lstrip",new se(()=>new T(this.value.trimStart()))],["startswith",new se(t=>{if(t.length===0)throw new Error("startswith() requires at least one argument");const n=t[0];if(n instanceof T)return new O(this.value.startsWith(n.value));if(n instanceof V){for(const a of n.value){if(!(a instanceof T))throw new Error("startswith() tuple elements must be strings");if(this.value.startsWith(a.value))return new O(!0)}return new O(!1)}throw new Error("startswith() argument must be a string or tuple of strings")})],["endswith",new se(t=>{if(t.length===0)throw new Error("endswith() requires at least one argument");const n=t[0];if(n instanceof T)return new O(this.value.endsWith(n.value));if(n instanceof V){for(const a of n.value){if(!(a instanceof T))throw new Error("endswith() tuple elements must be strings");if(this.value.endsWith(a.value))return new O(!0)}return new O(!1)}throw new Error("endswith() argument must be a string or tuple of strings")})],["split",new se(t=>{const n=t[0]??new ce;if(!(n instanceof T||n instanceof ce))throw new Error("sep argument must be a string or null");const a=t[1]??new q(-1);if(!(a instanceof q))throw new Error("maxsplit argument must be a number");let o=[];if(n instanceof ce){const i=this.value.trimStart();for(const{0:s,index:r}of i.matchAll(/\S+/g)){if(a.value!==-1&&o.length>=a.value&&r!==void 0){o.push(s+i.slice(r+s.length));break}o.push(s)}}else{if(n.value==="")throw new Error("empty separator");o=this.value.split(n.value),a.value!==-1&&o.length>a.value&&o.push(o.splice(a.value).join(n.value))}return new V(o.map(i=>new T(i)))})],["replace",new se(t=>{if(t.length<2)throw new Error("replace() requires at least two arguments");const n=t[0],a=t[1];if(!(n instanceof T&&a instanceof T))throw new Error("replace() arguments must be strings");let o;if(t.length>2?t[2].type==="KeywordArgumentsValue"?o=t[2].value.get("count")??new ce:o=t[2]:o=new ce,!(o instanceof q||o instanceof ce))throw new Error("replace() count argument must be a number or null");return new T(fl(this.value,n.value,a.value,o.value))})]]))}},O=class extends ze{constructor(){super(...arguments);E(this,"type","BooleanValue")}},gl=/[\x7f-\uffff]/g;function ta(e){return e.replace(gl,t=>"\\u"+t.charCodeAt(0).toString(16).padStart(4,"0"))}function Je(e,t={},n=0,a=!0){const{indent:o=null,ensureAscii:i=!1,separators:s=null,sortKeys:r=!1}=t;let c,l;switch(s?[c,l]=s:o?(c=",",l=": "):(c=", ",l=": "),e.type){case"NullValue":return"null";case"UndefinedValue":return a?"null":"undefined";case"IntegerValue":case"FloatValue":case"BooleanValue":return JSON.stringify(e.value);case"StringValue":{let d=JSON.stringify(e.value);return i&&(d=ta(d)),d}case"ArrayValue":case"ObjectValue":{const d=o?" ".repeat(o):"",p=`
`+d.repeat(n),f=p+d;if(e.type==="ArrayValue"){const g=e.value.map(v=>Je(v,t,n+1,a));return o?`[${f}${g.join(`${c}${f}`)}${p}]`:`[${g.join(c)}]`}else{let g=Array.from(e.value.entries());r&&(g=g.sort(([h],[x])=>h.localeCompare(x)));const v=g.map(([h,x])=>{let S=JSON.stringify(h);i&&(S=ta(S));const $=`${S}${l}${Je(x,t,n+1,a)}`;return o?`${f}${$}`:$});return o?`{${v.join(c)}${p}}`:`{${v.join(c)}}`}}default:throw new Error(`Cannot convert to JSON: ${e.type}`)}}var _e=class extends ze{constructor(){super(...arguments);E(this,"type","ObjectValue");E(this,"_builtins")}__bool__(){return new O(this.value.size>0)}get builtins(){return this._builtins??(this._builtins=new Map([["get",new se(([t,n])=>{if(!(t instanceof T))throw new Error(`Object key must be a string: got ${t.type}`);return this.value.get(t.value)??n??new ce})],["items",new se(()=>this.items())],["keys",new se(()=>this.keys())],["values",new se(()=>this.values())],["dictsort",new se(t=>{let n=new Map;const a=t.filter(c=>c instanceof gt?(n=c.value,!1):!0),o=a.at(0)??n.get("case_sensitive")??new O(!1);if(!(o instanceof O))throw new Error("case_sensitive must be a boolean");const i=a.at(1)??n.get("by")??new T("key");if(!(i instanceof T))throw new Error("by must be a string");if(!["key","value"].includes(i.value))throw new Error("by must be either 'key' or 'value'");const s=a.at(2)??n.get("reverse")??new O(!1);if(!(s instanceof O))throw new Error("reverse must be a boolean");const r=Array.from(this.value.entries()).map(([c,l])=>new V([new T(c),l])).sort((c,l)=>{const d=i.value==="key"?0:1,p=c.value[d],f=l.value[d],g=cn(p,f,o.value);return s.value?-g:g});return new V(r)})]]))}items(){return new V(Array.from(this.value.entries()).map(([t,n])=>new V([new T(t),n])))}keys(){return new V(Array.from(this.value.keys()).map(t=>new T(t)))}values(){return new V(Array.from(this.value.values()))}toString(){return Je(this,{},0,!1)}},gt=class extends _e{constructor(){super(...arguments);E(this,"type","KeywordArgumentsValue")}},V=class extends ze{constructor(){super(...arguments);E(this,"type","ArrayValue");E(this,"_builtins")}get builtins(){return this._builtins??(this._builtins=new Map([["length",new q(this.value.length)]]))}__bool__(){return new O(this.value.length>0)}toString(){return Je(this,{},0,!1)}},na=class extends V{constructor(){super(...arguments);E(this,"type","TupleValue")}},se=class extends ze{constructor(){super(...arguments);E(this,"type","FunctionValue")}},ce=class extends ze{constructor(){super(...arguments);E(this,"type","NullValue")}},ie=class extends ze{constructor(){super(...arguments);E(this,"type","UndefinedValue")}},Fa=class{constructor(e){E(this,"variables",new Map([["namespace",new se(e=>{if(e.length===0)return new _e(new Map);if(e.length!==1||!(e[0]instanceof _e))throw new Error("`namespace` expects either zero arguments or a single object argument");return e[0]})]]));E(this,"tests",Fa.TESTS);this.parent=e}set(e,t){return this.declareVariable(e,$t(t))}declareVariable(e,t){if(this.variables.has(e))throw new SyntaxError(`Variable already declared: ${e}`);return this.variables.set(e,t),t}setVariable(e,t){return this.variables.set(e,t),t}resolve(e){if(this.variables.has(e))return this;if(this.parent)return this.parent.resolve(e);throw new Error(`Unknown variable: ${e}`)}lookupVariable(e){try{return this.resolve(e).variables.get(e)??new ie}catch{return new ie}}},Xe=Fa;Ur(Xe,"TESTS",new Map([["boolean",e=>e.type==="BooleanValue"],["callable",e=>e instanceof se],["odd",e=>{if(!(e instanceof q))throw new Error(`cannot odd on ${e.type}`);return e.value%2!==0}],["even",e=>{if(!(e instanceof q))throw new Error(`cannot even on ${e.type}`);return e.value%2===0}],["false",e=>e.type==="BooleanValue"&&!e.value],["true",e=>e.type==="BooleanValue"&&e.value],["none",e=>e.type==="NullValue"],["string",e=>e.type==="StringValue"],["number",e=>e instanceof q||e instanceof ue],["integer",e=>e instanceof q],["iterable",e=>e.type==="ArrayValue"||e.type==="StringValue"],["mapping",e=>e instanceof _e],["sequence",e=>e instanceof V||e instanceof _e||e instanceof T],["lower",e=>{const t=e.value;return e.type==="StringValue"&&t===t.toLowerCase()}],["upper",e=>{const t=e.value;return e.type==="StringValue"&&t===t.toUpperCase()}],["none",e=>e.type==="NullValue"],["defined",e=>e.type!=="UndefinedValue"],["undefined",e=>e.type==="UndefinedValue"],["equalto",(e,t)=>e.value===t.value],["eq",(e,t)=>e.value===t.value]]));function yl(e){e.set("false",!1),e.set("true",!0),e.set("none",null),e.set("raise_exception",t=>{throw new Error(t)}),e.set("range",cl),e.set("strftime_now",pl),e.set("True",!0),e.set("False",!1),e.set("None",null)}function aa(e,t){const n=t.split(".");let a=e;for(const o of n)if(a instanceof _e)a=a.value.get(o)??new ie;else if(a instanceof V){const i=parseInt(o,10);if(!isNaN(i)&&i>=0&&i<a.value.length)a=a.value[i];else return new ie}else return new ie;return a}function cn(e,t,n=!1){if(e instanceof ce&&t instanceof ce)return 0;if(e instanceof ce||t instanceof ce)throw new Error(`Cannot compare ${e.type} with ${t.type}`);if(e instanceof ie&&t instanceof ie)return 0;if(e instanceof ie||t instanceof ie)throw new Error(`Cannot compare ${e.type} with ${t.type}`);const a=i=>i instanceof q||i instanceof ue||i instanceof O,o=i=>i instanceof O?i.value?1:0:i.value;if(a(e)&&a(t)){const i=o(e),s=o(t);return i<s?-1:i>s?1:0}if(e.type!==t.type)throw new Error(`Cannot compare different types: ${e.type} and ${t.type}`);switch(e.type){case"StringValue":{let i=e.value,s=t.value;return n||(i=i.toLowerCase(),s=s.toLowerCase()),i<s?-1:i>s?1:0}default:throw new Error(`Cannot compare type: ${e.type}`)}}var bl=class{constructor(e){E(this,"global");this.global=e??new Xe}run(e){return this.evaluate(e,this.global)}evaluateBinaryExpression(e,t){const n=this.evaluate(e.left,t);switch(e.operator.value){case"and":return n.__bool__().value?this.evaluate(e.right,t):n;case"or":return n.__bool__().value?n:this.evaluate(e.right,t)}const a=this.evaluate(e.right,t);switch(e.operator.value){case"==":return new O(n.value==a.value);case"!=":return new O(n.value!=a.value)}if(n instanceof ie||a instanceof ie){if(a instanceof ie&&["in","not in"].includes(e.operator.value))return new O(e.operator.value==="not in");throw new Error(`Cannot perform operation ${e.operator.value} on undefined values`)}else{if(n instanceof ce||a instanceof ce)throw new Error("Cannot perform operation on null values");if(e.operator.value==="~")return new T(n.value.toString()+a.value.toString());if((n instanceof q||n instanceof ue)&&(a instanceof q||a instanceof ue)){const o=n.value,i=a.value;switch(e.operator.value){case"+":case"-":case"*":{const s=e.operator.value==="+"?o+i:e.operator.value==="-"?o-i:o*i;return n instanceof ue||a instanceof ue?new ue(s):new q(s)}case"/":return new ue(o/i);case"%":{const s=o%i;return n instanceof ue||a instanceof ue?new ue(s):new q(s)}case"<":return new O(o<i);case">":return new O(o>i);case">=":return new O(o>=i);case"<=":return new O(o<=i)}}else if(n instanceof V&&a instanceof V)switch(e.operator.value){case"+":return new V(n.value.concat(a.value))}else if(a instanceof V){const o=a.value.find(i=>i.value===n.value)!==void 0;switch(e.operator.value){case"in":return new O(o);case"not in":return new O(!o)}}}if(n instanceof T||a instanceof T)switch(e.operator.value){case"+":return new T(n.value.toString()+a.value.toString())}if(n instanceof T&&a instanceof T)switch(e.operator.value){case"in":return new O(a.value.includes(n.value));case"not in":return new O(!a.value.includes(n.value))}if(n instanceof T&&a instanceof _e)switch(e.operator.value){case"in":return new O(a.value.has(n.value));case"not in":return new O(!a.value.has(n.value))}throw new SyntaxError(`Unknown operator "${e.operator.value}" between ${n.type} and ${a.type}`)}evaluateArguments(e,t){const n=[],a=new Map;for(const o of e)if(o.type==="SpreadExpression"){const i=o,s=this.evaluate(i.argument,t);if(!(s instanceof V))throw new Error(`Cannot unpack non-iterable type: ${s.type}`);for(const r of s.value)n.push(r)}else if(o.type==="KeywordArgumentExpression"){const i=o;a.set(i.key.value,this.evaluate(i.value,t))}else{if(a.size>0)throw new Error("Positional arguments must come before keyword arguments");n.push(this.evaluate(o,t))}return[n,a]}applyFilter(e,t,n){if(t.type==="Identifier"){const a=t;if(a.value==="safe")return e;if(a.value==="tojson")return new T(Je(e,{}));if(e instanceof V)switch(a.value){case"list":return e;case"first":return e.value[0];case"last":return e.value[e.value.length-1];case"length":return new q(e.value.length);case"reverse":return new V(e.value.slice().reverse());case"sort":return new V(e.value.slice().sort((o,i)=>cn(o,i,!1)));case"join":return new T(e.value.map(o=>o.value).join(""));case"string":return new T(Je(e,{},0,!1));case"unique":{const o=new Set,i=[];for(const s of e.value)o.has(s.value)||(o.add(s.value),i.push(s));return new V(i)}default:throw new Error(`Unknown ArrayValue filter: ${a.value}`)}else if(e instanceof T)switch(a.value){case"length":case"upper":case"lower":case"title":case"capitalize":{const o=e.builtins.get(a.value);if(o instanceof se)return o.value([],n);if(o instanceof q)return o;throw new Error(`Unknown StringValue filter: ${a.value}`)}case"trim":return new T(e.value.trim());case"indent":return new T(e.value.split(`
`).map((o,i)=>i===0||o.length===0?o:"    "+o).join(`
`));case"join":case"string":return e;case"int":{const o=parseInt(e.value,10);return new q(isNaN(o)?0:o)}case"float":{const o=parseFloat(e.value);return new ue(isNaN(o)?0:o)}default:throw new Error(`Unknown StringValue filter: ${a.value}`)}else if(e instanceof q||e instanceof ue)switch(a.value){case"abs":return e instanceof q?new q(Math.abs(e.value)):new ue(Math.abs(e.value));case"int":return new q(Math.floor(e.value));case"float":return new ue(e.value);case"string":return new T(e.toString());default:throw new Error(`Unknown NumericValue filter: ${a.value}`)}else if(e instanceof _e)switch(a.value){case"items":return new V(Array.from(e.value.entries()).map(([o,i])=>new V([new T(o),i])));case"length":return new q(e.value.size);default:{const o=e.builtins.get(a.value);if(o)return o instanceof se?o.value([],n):o;throw new Error(`Unknown ObjectValue filter: ${a.value}`)}}else if(e instanceof O)switch(a.value){case"bool":return new O(e.value);case"int":return new q(e.value?1:0);case"float":return new ue(e.value?1:0);case"string":return new T(e.value?"true":"false");default:throw new Error(`Unknown BooleanValue filter: ${a.value}`)}throw new Error(`Cannot apply filter "${a.value}" to type: ${e.type}`)}else if(t.type==="CallExpression"){const a=t;if(a.callee.type!=="Identifier")throw new Error(`Unknown filter: ${a.callee.type}`);const o=a.callee.value;if(o==="tojson"){const[,i]=this.evaluateArguments(a.args,n),s=i.get("indent")??new ce;if(!(s instanceof q||s instanceof ce))throw new Error("If set, indent must be a number");const r=i.get("ensure_ascii")??new O(!1);if(!(r instanceof O))throw new Error("If set, ensure_ascii must be a boolean");const c=i.get("sort_keys")??new O(!1);if(!(c instanceof O))throw new Error("If set, sort_keys must be a boolean");const l=i.get("separators")??new ce;let d=null;if(l instanceof V||l instanceof na){if(l.value.length!==2)throw new Error("separators must be a tuple of two strings");const[p,f]=l.value;if(!(p instanceof T)||!(f instanceof T))throw new Error("separators must be a tuple of two strings");d=[p.value,f.value]}else if(!(l instanceof ce))throw new Error("If set, separators must be a tuple of two strings");return new T(Je(e,{indent:s.value,ensureAscii:r.value,sortKeys:c.value,separators:d}))}else if(o==="join"){let i;if(e instanceof T)i=Array.from(e.value);else if(e instanceof V)i=e.value.map(l=>l.value);else throw new Error(`Cannot apply filter "${o}" to type: ${e.type}`);const[s,r]=this.evaluateArguments(a.args,n),c=s.at(0)??r.get("separator")??new T("");if(!(c instanceof T))throw new Error("separator must be a string");return new T(i.join(c.value))}else if(o==="int"||o==="float"){const[i,s]=this.evaluateArguments(a.args,n),r=i.at(0)??s.get("default")??(o==="int"?new q(0):new ue(0));if(e instanceof T){const c=o==="int"?parseInt(e.value,10):parseFloat(e.value);return isNaN(c)?r:o==="int"?new q(c):new ue(c)}else{if(e instanceof q||e instanceof ue)return e;if(e instanceof O)return o==="int"?new q(e.value?1:0):new ue(e.value?1:0);throw new Error(`Cannot apply filter "${o}" to type: ${e.type}`)}}else if(o==="default"){const[i,s]=this.evaluateArguments(a.args,n),r=i[0]??new T(""),c=i[1]??s.get("boolean")??new O(!1);if(!(c instanceof O))throw new Error("`default` filter flag must be a boolean");return e instanceof ie||c.value&&!e.__bool__().value?r:e}if(e instanceof V){switch(o){case"sort":{const[i,s]=this.evaluateArguments(a.args,n),r=i.at(0)??s.get("reverse")??new O(!1);if(!(r instanceof O))throw new Error("reverse must be a boolean");const c=i.at(1)??s.get("case_sensitive")??new O(!1);if(!(c instanceof O))throw new Error("case_sensitive must be a boolean");const l=i.at(2)??s.get("attribute")??new ce;if(!(l instanceof T||l instanceof q||l instanceof ce))throw new Error("attribute must be a string, integer, or null");const d=p=>{if(l instanceof ce)return p;const f=l instanceof q?String(l.value):l.value;return aa(p,f)};return new V(e.value.slice().sort((p,f)=>{const g=d(p),v=d(f),h=cn(g,v,c.value);return r.value?-h:h}))}case"selectattr":case"rejectattr":{const i=o==="selectattr";if(e.value.some(p=>!(p instanceof _e)))throw new Error(`\`${o}\` can only be applied to array of objects`);if(a.args.some(p=>p.type!=="StringLiteral"))throw new Error(`arguments of \`${o}\` must be strings`);const[s,r,c]=a.args.map(p=>this.evaluate(p,n));let l;if(r){const p=n.tests.get(r.value);if(!p)throw new Error(`Unknown test: ${r.value}`);l=p}else l=(...p)=>p[0].__bool__().value;const d=e.value.filter(p=>{const f=p.value.get(s.value),g=f?l(f,c):!1;return i?g:!g});return new V(d)}case"map":{const[,i]=this.evaluateArguments(a.args,n);if(i.has("attribute")){const s=i.get("attribute");if(!(s instanceof T))throw new Error("attribute must be a string");const r=i.get("default"),c=e.value.map(l=>{if(!(l instanceof _e))throw new Error("items in map must be an object");const d=aa(l,s.value);return d instanceof ie?r??new ie:d});return new V(c)}else throw new Error("`map` expressions without `attribute` set are not currently supported.")}}throw new Error(`Unknown ArrayValue filter: ${o}`)}else if(e instanceof T){switch(o){case"indent":{const[i,s]=this.evaluateArguments(a.args,n),r=i.at(0)??s.get("width")??new q(4);if(!(r instanceof q))throw new Error("width must be a number");const c=i.at(1)??s.get("first")??new O(!1),l=i.at(2)??s.get("blank")??new O(!1),d=e.value.split(`
`),p=" ".repeat(r.value),f=d.map((g,v)=>!c.value&&v===0||!l.value&&g.length===0?g:p+g);return new T(f.join(`
`))}case"replace":{const i=e.builtins.get("replace");if(!(i instanceof se))throw new Error("replace filter not available");const[s,r]=this.evaluateArguments(a.args,n);return i.value([...s,new gt(r)],n)}}throw new Error(`Unknown StringValue filter: ${o}`)}else if(e instanceof _e){const i=e.builtins.get(o);if(i&&i instanceof se){const[s,r]=this.evaluateArguments(a.args,n);return r.size>0&&s.push(new gt(r)),i.value(s,n)}throw new Error(`Unknown ObjectValue filter: ${o}`)}else throw new Error(`Cannot apply filter "${o}" to type: ${e.type}`)}throw new Error(`Unknown filter: ${t.type}`)}evaluateFilterExpression(e,t){const n=this.evaluate(e.operand,t);return this.applyFilter(n,e.filter,t)}evaluateTestExpression(e,t){const n=this.evaluate(e.operand,t),a=t.tests.get(e.test.value);if(!a)throw new Error(`Unknown test: ${e.test.value}`);const o=a(n);return new O(e.negate?!o:o)}evaluateSelectExpression(e,t){return this.evaluate(e.test,t).__bool__().value?this.evaluate(e.lhs,t):new ie}evaluateUnaryExpression(e,t){const n=this.evaluate(e.argument,t);switch(e.operator.value){case"not":return new O(!n.value);default:throw new SyntaxError(`Unknown operator: ${e.operator.value}`)}}evaluateTernaryExpression(e,t){return this.evaluate(e.condition,t).__bool__().value?this.evaluate(e.trueExpr,t):this.evaluate(e.falseExpr,t)}evalProgram(e,t){return this.evaluateBlock(e.body,t)}evaluateBlock(e,t){let n="";for(const a of e){const o=this.evaluate(a,t);o.type!=="NullValue"&&o.type!=="UndefinedValue"&&(n+=o.toString())}return new T(n)}evaluateIdentifier(e,t){return t.lookupVariable(e.value)}evaluateCallExpression(e,t){const[n,a]=this.evaluateArguments(e.args,t);a.size>0&&n.push(new gt(a));const o=this.evaluate(e.callee,t);if(o.type!=="FunctionValue")throw new Error(`Cannot call something that is not a function: got ${o.type}`);return o.value(n,t)}evaluateSliceExpression(e,t,n){if(!(e instanceof V||e instanceof T))throw new Error("Slice object must be an array or string");const a=this.evaluate(t.start,n),o=this.evaluate(t.stop,n),i=this.evaluate(t.step,n);if(!(a instanceof q||a instanceof ie))throw new Error("Slice start must be numeric or undefined");if(!(o instanceof q||o instanceof ie))throw new Error("Slice stop must be numeric or undefined");if(!(i instanceof q||i instanceof ie))throw new Error("Slice step must be numeric or undefined");return e instanceof V?new V(Zn(e.value,a.value,o.value,i.value)):new T(Zn(Array.from(e.value),a.value,o.value,i.value).join(""))}evaluateMemberExpression(e,t){const n=this.evaluate(e.object,t);let a;if(e.computed){if(e.property.type==="SliceExpression")return this.evaluateSliceExpression(n,e.property,t);a=this.evaluate(e.property,t)}else e.property.type==="IntegerLiteral"?a=new q(e.property.value):a=new T(e.property.value);let o;if(n instanceof _e){if(!(a instanceof T))throw new Error(`Cannot access property with non-string: got ${a.type}`);o=n.value.get(a.value)??n.builtins.get(a.value)}else if(n instanceof V||n instanceof T)if(a instanceof q)o=n.value.at(a.value),n instanceof T&&(o=new T(n.value.at(a.value)));else if(a instanceof T)o=n.builtins.get(a.value);else throw new Error(`Cannot access property with non-string/non-number: got ${a.type}`);else{if(!(a instanceof T))throw new Error(`Cannot access property with non-string: got ${a.type}`);o=n.builtins.get(a.value)}return o instanceof ze?o:new ie}evaluateSet(e,t){const n=e.value?this.evaluate(e.value,t):this.evaluateBlock(e.body,t);if(e.assignee.type==="Identifier"){const a=e.assignee.value;t.setVariable(a,n)}else if(e.assignee.type==="TupleLiteral"){const a=e.assignee;if(!(n instanceof V))throw new Error(`Cannot unpack non-iterable type in set: ${n.type}`);const o=n.value;if(o.length!==a.value.length)throw new Error(`Too ${a.value.length>o.length?"few":"many"} items to unpack in set`);for(let i=0;i<a.value.length;++i){const s=a.value[i];if(s.type!=="Identifier")throw new Error(`Cannot unpack to non-identifier in set: ${s.type}`);t.setVariable(s.value,o[i])}}else if(e.assignee.type==="MemberExpression"){const a=e.assignee,o=this.evaluate(a.object,t);if(!(o instanceof _e))throw new Error("Cannot assign to member of non-object");if(a.property.type!=="Identifier")throw new Error("Cannot assign to member with non-identifier property");o.value.set(a.property.value,n)}else throw new Error(`Invalid LHS inside assignment expression: ${JSON.stringify(e.assignee)}`);return new ce}evaluateIf(e,t){const n=this.evaluate(e.test,t);return this.evaluateBlock(n.__bool__().value?e.body:e.alternate,t)}evaluateFor(e,t){const n=new Xe(t);let a,o;if(e.iterable.type==="SelectExpression"){const l=e.iterable;o=this.evaluate(l.lhs,n),a=l.test}else o=this.evaluate(e.iterable,n);if(!(o instanceof V||o instanceof _e))throw new Error(`Expected iterable or object type in for loop: got ${o.type}`);o instanceof _e&&(o=o.keys());const i=[],s=[];for(let l=0;l<o.value.length;++l){const d=new Xe(n),p=o.value[l];let f;if(e.loopvar.type==="Identifier")f=g=>g.setVariable(e.loopvar.value,p);else if(e.loopvar.type==="TupleLiteral"){const g=e.loopvar;if(p.type!=="ArrayValue")throw new Error(`Cannot unpack non-iterable type: ${p.type}`);const v=p;if(g.value.length!==v.value.length)throw new Error(`Too ${g.value.length>v.value.length?"few":"many"} items to unpack`);f=h=>{for(let x=0;x<g.value.length;++x){if(g.value[x].type!=="Identifier")throw new Error(`Cannot unpack non-identifier type: ${g.value[x].type}`);h.setVariable(g.value[x].value,v.value[x])}}}else throw new Error(`Invalid loop variable(s): ${e.loopvar.type}`);a&&(f(d),!this.evaluate(a,d).__bool__().value)||(i.push(p),s.push(f))}let r="",c=!0;for(let l=0;l<i.length;++l){const d=new Map([["index",new q(l+1)],["index0",new q(l)],["revindex",new q(i.length-l)],["revindex0",new q(i.length-l-1)],["first",new O(l===0)],["last",new O(l===i.length-1)],["length",new q(i.length)],["previtem",l>0?i[l-1]:new ie],["nextitem",l<i.length-1?i[l+1]:new ie]]);n.setVariable("loop",new _e(d)),s[l](n);try{const p=this.evaluateBlock(e.body,n);r+=p.value}catch(p){if(p instanceof ea)continue;if(p instanceof Gn)break;throw p}c=!1}if(c){const l=this.evaluateBlock(e.defaultBlock,n);r+=l.value}return new T(r)}evaluateMacro(e,t){return t.setVariable(e.name.value,new se((n,a)=>{var s;const o=new Xe(a);n=n.slice();let i;((s=n.at(-1))==null?void 0:s.type)==="KeywordArgumentsValue"&&(i=n.pop());for(let r=0;r<e.args.length;++r){const c=e.args[r],l=n[r];if(c.type==="Identifier"){const d=c;if(!l)throw new Error(`Missing positional argument: ${d.value}`);o.setVariable(d.value,l)}else if(c.type==="KeywordArgumentExpression"){const d=c,p=l??(i==null?void 0:i.value.get(d.key.value))??this.evaluate(d.value,o);o.setVariable(d.key.value,p)}else throw new Error(`Unknown argument type: ${c.type}`)}return this.evaluateBlock(e.body,o)})),new ce}evaluateCallStatement(e,t){const n=new se((r,c)=>{const l=new Xe(c);if(e.callerArgs)for(let d=0;d<e.callerArgs.length;++d){const p=e.callerArgs[d];if(p.type!=="Identifier")throw new Error(`Caller parameter must be an identifier, got ${p.type}`);l.setVariable(p.value,r[d]??new ie)}return this.evaluateBlock(e.body,l)}),[a,o]=this.evaluateArguments(e.call.args,t);a.push(new gt(o));const i=this.evaluate(e.call.callee,t);if(i.type!=="FunctionValue")throw new Error(`Cannot call something that is not a function: got ${i.type}`);const s=new Xe(t);return s.setVariable("caller",n),i.value(a,s)}evaluateFilterStatement(e,t){const n=this.evaluateBlock(e.body,t);return this.applyFilter(n,e.filter,t)}evaluate(e,t){if(!e)return new ie;switch(e.type){case"Program":return this.evalProgram(e,t);case"Set":return this.evaluateSet(e,t);case"If":return this.evaluateIf(e,t);case"For":return this.evaluateFor(e,t);case"Macro":return this.evaluateMacro(e,t);case"CallStatement":return this.evaluateCallStatement(e,t);case"Break":throw new Gn;case"Continue":throw new ea;case"IntegerLiteral":return new q(e.value);case"FloatLiteral":return new ue(e.value);case"StringLiteral":return new T(e.value);case"ArrayLiteral":return new V(e.value.map(n=>this.evaluate(n,t)));case"TupleLiteral":return new na(e.value.map(n=>this.evaluate(n,t)));case"ObjectLiteral":{const n=new Map;for(const[a,o]of e.value){const i=this.evaluate(a,t);if(!(i instanceof T))throw new Error(`Object keys must be strings: got ${i.type}`);n.set(i.value,this.evaluate(o,t))}return new _e(n)}case"Identifier":return this.evaluateIdentifier(e,t);case"CallExpression":return this.evaluateCallExpression(e,t);case"MemberExpression":return this.evaluateMemberExpression(e,t);case"UnaryExpression":return this.evaluateUnaryExpression(e,t);case"BinaryExpression":return this.evaluateBinaryExpression(e,t);case"FilterExpression":return this.evaluateFilterExpression(e,t);case"FilterStatement":return this.evaluateFilterStatement(e,t);case"TestExpression":return this.evaluateTestExpression(e,t);case"SelectExpression":return this.evaluateSelectExpression(e,t);case"Ternary":return this.evaluateTernaryExpression(e,t);case"Comment":return new ce;default:throw new SyntaxError(`Unknown node type: ${e.type}`)}}};function $t(e){switch(typeof e){case"number":return Number.isInteger(e)?new q(e):new ue(e);case"string":return new T(e);case"boolean":return new O(e);case"undefined":return new ie;case"object":return e===null?new ce:Array.isArray(e)?new V(e.map($t)):new _e(new Map(Object.entries(e).map(([t,n])=>[t,$t(n)])));case"function":return new se((t,n)=>{const a=e(...t.map(o=>o.value))??null;return $t(a)});default:throw new Error(`Cannot convert to runtime value: ${e}`)}}var ve=`
`,vl="{%- ",wl=" -%}";function xl(e){switch(e.operator.type){case"MultiplicativeBinaryOperator":return 4;case"AdditiveBinaryOperator":return 3;case"ComparisonBinaryOperator":return 2;case"Identifier":return e.operator.value==="and"?1:e.operator.value==="in"||e.operator.value==="not in"?2:0}return 0}function _l(e,t="	"){const n=typeof t=="number"?" ".repeat(t):t;return Ne(e.body,0,n).replace(/\n$/,"")}function Se(...e){return vl+e.join(" ")+wl}function Ne(e,t,n){return e.map(a=>kl(a,t,n)).join(ve)}function kl(e,t,n){const a=n.repeat(t);switch(e.type){case"Program":return Ne(e.body,t,n);case"If":return Al(e,t,n);case"For":return Sl(e,t,n);case"Set":return Tl(e,t,n);case"Macro":return Il(e,t,n);case"Break":return a+Se("break");case"Continue":return a+Se("continue");case"CallStatement":return El(e,t,n);case"FilterStatement":return Ll(e,t,n);case"Comment":return a+"{# "+e.value+" #}";default:return a+"{{- "+Q(e)+" -}}"}}function Al(e,t,n){const a=n.repeat(t),o=[];let i=e;for(;i&&(o.push({test:i.test,body:i.body}),i.alternate.length===1&&i.alternate[0].type==="If");)i=i.alternate[0];let s=a+Se("if",Q(o[0].test))+ve+Ne(o[0].body,t+1,n);for(let r=1;r<o.length;++r)s+=ve+a+Se("elif",Q(o[r].test))+ve+Ne(o[r].body,t+1,n);return i&&i.alternate.length>0&&(s+=ve+a+Se("else")+ve+Ne(i.alternate,t+1,n)),s+=ve+a+Se("endif"),s}function Sl(e,t,n){const a=n.repeat(t);let o="";if(e.iterable.type==="SelectExpression"){const s=e.iterable;o=`${Q(s.lhs)} if ${Q(s.test)}`}else o=Q(e.iterable);let i=a+Se("for",Q(e.loopvar),"in",o)+ve+Ne(e.body,t+1,n);return e.defaultBlock.length>0&&(i+=ve+a+Se("else")+ve+Ne(e.defaultBlock,t+1,n)),i+=ve+a+Se("endfor"),i}function Tl(e,t,n){const a=n.repeat(t),o=Q(e.assignee),i=e.value?Q(e.value):"",s=a+Se("set",`${o}${e.value?" = "+i:""}`);return e.body.length===0?s:s+ve+Ne(e.body,t+1,n)+ve+a+Se("endset")}function Il(e,t,n){const a=n.repeat(t),o=e.args.map(Q).join(", ");return a+Se("macro",`${e.name.value}(${o})`)+ve+Ne(e.body,t+1,n)+ve+a+Se("endmacro")}function El(e,t,n){const a=n.repeat(t),o=e.callerArgs&&e.callerArgs.length>0?`(${e.callerArgs.map(Q).join(", ")})`:"",i=Q(e.call);let s=a+Se(`call${o}`,i)+ve;return s+=Ne(e.body,t+1,n)+ve,s+=a+Se("endcall"),s}function Ll(e,t,n){const a=n.repeat(t),o=e.filter.type==="Identifier"?e.filter.value:Q(e.filter);let i=a+Se("filter",o)+ve;return i+=Ne(e.body,t+1,n)+ve,i+=a+Se("endfilter"),i}function Q(e,t=-1){switch(e.type){case"SpreadExpression":return`*${Q(e.argument)}`;case"Identifier":return e.value;case"IntegerLiteral":return`${e.value}`;case"FloatLiteral":return`${e.value}`;case"StringLiteral":return JSON.stringify(e.value);case"BinaryExpression":{const n=e,a=xl(n),o=Q(n.left,a),i=Q(n.right,a+1),s=`${o} ${n.operator.value} ${i}`;return a<t?`(${s})`:s}case"UnaryExpression":{const n=e;return n.operator.value+(n.operator.value==="not"?" ":"")+Q(n.argument,1/0)}case"CallExpression":{const n=e,a=n.args.map(Q).join(", ");return`${Q(n.callee)}(${a})`}case"MemberExpression":{const n=e;let a=Q(n.object);["Identifier","MemberExpression","CallExpression","StringLiteral","IntegerLiteral","FloatLiteral","ArrayLiteral","TupleLiteral","ObjectLiteral"].includes(n.object.type)||(a=`(${a})`);let o=Q(n.property);return!n.computed&&n.property.type!=="Identifier"&&n.property.type!=="IntegerLiteral"&&(o=`(${o})`),n.computed?`${a}[${o}]`:`${a}.${o}`}case"FilterExpression":{const n=e,a=Q(n.operand,1/0);return n.filter.type==="CallExpression"?`${a} | ${Q(n.filter)}`:`${a} | ${n.filter.value}`}case"SelectExpression":{const n=e;return`${Q(n.lhs)} if ${Q(n.test)}`}case"TestExpression":{const n=e;return`${Q(n.operand)} is${n.negate?" not":""} ${n.test.value}`}case"ArrayLiteral":case"TupleLiteral":{const n=e.value.map(Q),a=e.type==="ArrayLiteral"?"[]":"()";return`${a[0]}${n.join(", ")}${a[1]}`}case"ObjectLiteral":return`{${Array.from(e.value.entries()).map(([a,o])=>`${Q(a)}: ${Q(o)}`).join(", ")}}`;case"SliceExpression":{const n=e,a=n.start?Q(n.start):"",o=n.stop?Q(n.stop):"",i=n.step?`:${Q(n.step)}`:"";return`${a}:${o}${i}`}case"KeywordArgumentExpression":{const n=e;return`${n.key.value}=${Q(n.value)}`}case"Ternary":{const n=e,a=`${Q(n.trueExpr)} if ${Q(n.condition,0)} else ${Q(n.falseExpr)}`;return t>-1?`(${a})`:a}default:throw new Error(`Unknown expression type: ${e.type}`)}}var Pl=class{constructor(e){E(this,"parsed");const t=jr(e,{lstrip_blocks:!0,trim_blocks:!0});this.parsed=ll(t)}render(e){const t=new Xe;if(yl(t),e)for(const[o,i]of Object.entries(e))t.set(o,i);return new bl(t).run(this.parsed).value}format(e){return _l(this.parsed,(e==null?void 0:e.indent)||"	")}};const $l={transformers:["audio-classification","automatic-speech-recognition","depth-estimation","document-question-answering","feature-extraction","fill-mask","image-classification","image-feature-extraction","image-segmentation","image-to-image","image-to-text","image-text-to-text","mask-generation","object-detection","question-answering","summarization","table-question-answering","text-classification","text-generation","text-to-audio","text-to-speech","token-classification","translation","video-classification","visual-question-answering","zero-shot-classification","zero-shot-image-classification","zero-shot-object-detection"]},Cl=["image-to-text","summarization","translation"],_n={"text-classification":{name:"Text Classification",subtasks:[{type:"acceptability-classification",name:"Acceptability Classification"},{type:"entity-linking-classification",name:"Entity Linking Classification"},{type:"fact-checking",name:"Fact Checking"},{type:"intent-classification",name:"Intent Classification"},{type:"language-identification",name:"Language Identification"},{type:"multi-class-classification",name:"Multi Class Classification"},{type:"multi-label-classification",name:"Multi Label Classification"},{type:"multi-input-text-classification",name:"Multi-input Text Classification"},{type:"natural-language-inference",name:"Natural Language Inference"},{type:"semantic-similarity-classification",name:"Semantic Similarity Classification"},{type:"sentiment-classification",name:"Sentiment Classification"},{type:"topic-classification",name:"Topic Classification"},{type:"semantic-similarity-scoring",name:"Semantic Similarity Scoring"},{type:"sentiment-scoring",name:"Sentiment Scoring"},{type:"sentiment-analysis",name:"Sentiment Analysis"},{type:"hate-speech-detection",name:"Hate Speech Detection"},{type:"text-scoring",name:"Text Scoring"}],modality:"nlp"},"token-classification":{name:"Token Classification",subtasks:[{type:"named-entity-recognition",name:"Named Entity Recognition"},{type:"part-of-speech",name:"Part of Speech"},{type:"parsing",name:"Parsing"},{type:"lemmatization",name:"Lemmatization"},{type:"word-sense-disambiguation",name:"Word Sense Disambiguation"},{type:"coreference-resolution",name:"Coreference-resolution"}],modality:"nlp"},"table-question-answering":{name:"Table Question Answering",modality:"nlp"},"question-answering":{name:"Question Answering",subtasks:[{type:"extractive-qa",name:"Extractive QA"},{type:"open-domain-qa",name:"Open Domain QA"},{type:"closed-domain-qa",name:"Closed Domain QA"}],modality:"nlp"},"zero-shot-classification":{name:"Zero-Shot Classification",modality:"nlp"},translation:{name:"Translation",modality:"nlp"},summarization:{name:"Summarization",subtasks:[{type:"news-articles-summarization",name:"News Articles Summarization"},{type:"news-articles-headline-generation",name:"News Articles Headline Generation"}],modality:"nlp"},"feature-extraction":{name:"Feature Extraction",modality:"nlp"},"text-generation":{name:"Text Generation",subtasks:[{type:"dialogue-modeling",name:"Dialogue Modeling"},{type:"dialogue-generation",name:"Dialogue Generation"},{type:"conversational",name:"Conversational"},{type:"language-modeling",name:"Language Modeling"},{type:"text-simplification",name:"Text simplification"},{type:"explanation-generation",name:"Explanation Generation"},{type:"abstractive-qa",name:"Abstractive QA"},{type:"open-domain-abstractive-qa",name:"Open Domain Abstractive QA"},{type:"closed-domain-qa",name:"Closed Domain QA"},{type:"open-book-qa",name:"Open Book QA"},{type:"closed-book-qa",name:"Closed Book QA"},{type:"text2text-generation",name:"Text2Text Generation"}],modality:"nlp"},"fill-mask":{name:"Fill-Mask",subtasks:[{type:"slot-filling",name:"Slot Filling"},{type:"masked-language-modeling",name:"Masked Language Modeling"}],modality:"nlp"},"sentence-similarity":{name:"Sentence Similarity",modality:"nlp"},"text-to-speech":{name:"Text-to-Speech",modality:"audio"},"text-to-audio":{name:"Text-to-Audio",modality:"audio"},"automatic-speech-recognition":{name:"Automatic Speech Recognition",modality:"audio"},"audio-to-audio":{name:"Audio-to-Audio",modality:"audio"},"audio-classification":{name:"Audio Classification",subtasks:[{type:"keyword-spotting",name:"Keyword Spotting"},{type:"speaker-identification",name:"Speaker Identification"},{type:"audio-intent-classification",name:"Audio Intent Classification"},{type:"audio-emotion-recognition",name:"Audio Emotion Recognition"},{type:"audio-language-identification",name:"Audio Language Identification"}],modality:"audio"},"audio-text-to-text":{name:"Audio-Text-to-Text",modality:"multimodal",hideInDatasets:!0},"voice-activity-detection":{name:"Voice Activity Detection",modality:"audio"},"depth-estimation":{name:"Depth Estimation",modality:"cv"},"image-classification":{name:"Image Classification",subtasks:[{type:"multi-label-image-classification",name:"Multi Label Image Classification"},{type:"multi-class-image-classification",name:"Multi Class Image Classification"}],modality:"cv"},"object-detection":{name:"Object Detection",subtasks:[{type:"face-detection",name:"Face Detection"},{type:"vehicle-detection",name:"Vehicle Detection"}],modality:"cv"},"image-segmentation":{name:"Image Segmentation",subtasks:[{type:"instance-segmentation",name:"Instance Segmentation"},{type:"semantic-segmentation",name:"Semantic Segmentation"},{type:"panoptic-segmentation",name:"Panoptic Segmentation"}],modality:"cv"},"text-to-image":{name:"Text-to-Image",modality:"cv"},"image-to-text":{name:"Image-to-Text",subtasks:[{type:"image-captioning",name:"Image Captioning"}],modality:"cv"},"image-to-image":{name:"Image-to-Image",subtasks:[{type:"image-inpainting",name:"Image Inpainting"},{type:"image-colorization",name:"Image Colorization"},{type:"super-resolution",name:"Super Resolution"}],modality:"cv"},"image-to-video":{name:"Image-to-Video",modality:"cv"},"unconditional-image-generation":{name:"Unconditional Image Generation",modality:"cv"},"video-classification":{name:"Video Classification",modality:"cv"},"reinforcement-learning":{name:"Reinforcement Learning",modality:"rl"},robotics:{name:"Robotics",modality:"rl",subtasks:[{type:"grasping",name:"Grasping"},{type:"task-planning",name:"Task Planning"}]},"tabular-classification":{name:"Tabular Classification",modality:"tabular",subtasks:[{type:"tabular-multi-class-classification",name:"Tabular Multi Class Classification"},{type:"tabular-multi-label-classification",name:"Tabular Multi Label Classification"}]},"tabular-regression":{name:"Tabular Regression",modality:"tabular",subtasks:[{type:"tabular-single-column-regression",name:"Tabular Single Column Regression"}]},"tabular-to-text":{name:"Tabular to Text",modality:"tabular",subtasks:[{type:"rdf-to-text",name:"RDF to text"}],hideInModels:!0},"table-to-text":{name:"Table to Text",modality:"nlp",hideInModels:!0},"multiple-choice":{name:"Multiple Choice",subtasks:[{type:"multiple-choice-qa",name:"Multiple Choice QA"},{type:"multiple-choice-coreference-resolution",name:"Multiple Choice Coreference Resolution"}],modality:"nlp",hideInModels:!0},"text-ranking":{name:"Text Ranking",modality:"nlp"},"text-retrieval":{name:"Text Retrieval",subtasks:[{type:"document-retrieval",name:"Document Retrieval"},{type:"utterance-retrieval",name:"Utterance Retrieval"},{type:"entity-linking-retrieval",name:"Entity Linking Retrieval"},{type:"fact-checking-retrieval",name:"Fact Checking Retrieval"}],modality:"nlp",hideInModels:!0},"time-series-forecasting":{name:"Time Series Forecasting",modality:"tabular",subtasks:[{type:"univariate-time-series-forecasting",name:"Univariate Time Series Forecasting"},{type:"multivariate-time-series-forecasting",name:"Multivariate Time Series Forecasting"}]},"text-to-video":{name:"Text-to-Video",modality:"cv"},"image-text-to-text":{name:"Image-Text-to-Text",modality:"multimodal"},"image-text-to-image":{name:"Image-Text-to-Image",modality:"multimodal"},"image-text-to-video":{name:"Image-Text-to-Video",modality:"multimodal"},"visual-question-answering":{name:"Visual Question Answering",subtasks:[{type:"visual-question-answering",name:"Visual Question Answering"}],modality:"multimodal"},"document-question-answering":{name:"Document Question Answering",subtasks:[{type:"document-question-answering",name:"Document Question Answering"}],modality:"multimodal",hideInDatasets:!0},"zero-shot-image-classification":{name:"Zero-Shot Image Classification",modality:"cv"},"graph-ml":{name:"Graph Machine Learning",modality:"other"},"mask-generation":{name:"Mask Generation",modality:"cv"},"zero-shot-object-detection":{name:"Zero-Shot Object Detection",modality:"cv"},"text-to-3d":{name:"Text-to-3D",modality:"cv"},"image-to-3d":{name:"Image-to-3D",modality:"cv"},"image-feature-extraction":{name:"Image Feature Extraction",modality:"cv"},"video-text-to-text":{name:"Video-Text-to-Text",modality:"multimodal",hideInDatasets:!1},"keypoint-detection":{name:"Keypoint Detection",subtasks:[{type:"pose-estimation",name:"Pose Estimation"}],modality:"cv",hideInDatasets:!0},"visual-document-retrieval":{name:"Visual Document Retrieval",modality:"multimodal"},"any-to-any":{name:"Any-to-Any",modality:"multimodal"},"video-to-video":{name:"Video-to-Video",modality:"cv",hideInDatasets:!0},other:{name:"Other",modality:"other",hideInModels:!0,hideInDatasets:!0}},Rl=Object.keys(_n);Object.values(_n).flatMap(e=>"subtasks"in e?e.subtasks:[]).map(e=>e.type);new Set(Rl);const Ul={datasets:[{description:"A dataset with multiple modality input and output pairs.",id:"PKU-Alignment/align-anything"}],demo:{inputs:[{filename:"any-to-any-input.jpg",type:"img"},{label:"Text Prompt",content:"What is the significance of this place?",type:"text"}],outputs:[{label:"Generated Text",content:"The place in the picture is Osaka Castle, located in Osaka, Japan. Osaka Castle is a historic castle that was originally built in the 16th century by Toyotomi Hideyoshi, a powerful warlord of the time. It is one of the most famous landmarks in Osaka and is known for its distinctive white walls and black roof tiles. The castle has been rebuilt several times over the centuries and is now a popular tourist attraction, offering visitors a glimpse into Japan's rich history and culture.",type:"text"},{filename:"any-to-any-output.wav",type:"audio"}]},metrics:[],models:[{description:"Strong model that can take in video, audio, image, text and output text and natural speech.",id:"Qwen/Qwen2.5-Omni-7B"},{description:"Robust model that can take in image and text and generate image and text.",id:"OmniGen2/OmniGen2"},{description:"Any-to-any model with speech, video, audio, image and text understanding capabilities.",id:"openbmb/MiniCPM-o-2_6"},{description:"A model that can understand image and text and generate image and text.",id:"ByteDance-Seed/BAGEL-7B-MoT"}],spaces:[{description:"An application to chat with an any-to-any (image & text) model.",id:"OmniGen2/OmniGen2"}],summary:"Any-to-any models can understand two or more modalities and output two or more modalities.",widgetModels:[],youtubeId:""},Ml={datasets:[{description:"A benchmark of 10 different audio tasks.",id:"s3prl/superb"},{description:"A dataset of YouTube clips and their sound categories.",id:"agkphysics/AudioSet"}],demo:{inputs:[{filename:"audio.wav",type:"audio"}],outputs:[{data:[{label:"Up",score:.2},{label:"Down",score:.8}],type:"chart"}]},metrics:[{description:"",id:"accuracy"},{description:"",id:"recall"},{description:"",id:"precision"},{description:"",id:"f1"}],models:[{description:"An easy-to-use model for command recognition.",id:"speechbrain/google_speech_command_xvector"},{description:"An emotion recognition model.",id:"ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition"},{description:"A language identification model.",id:"facebook/mms-lid-126"}],spaces:[{description:"An application that can classify music into different genre.",id:"kurianbenoy/audioclassification"}],summary:"Audio classification is the task of assigning a label or class to a given audio. It can be used for recognizing which command a user is giving or the emotion of a statement, as well as identifying a speaker.",widgetModels:["MIT/ast-finetuned-audioset-10-10-0.4593"],youtubeId:"KWwzcmG98Ds"},Nl={datasets:[{description:"A dataset containing audio conversations with question–answer pairs.",id:"nvidia/AF-Think"},{description:"A more advanced and comprehensive dataset that contains characteristics of the audio as well",id:"tsinghua-ee/QualiSpeech"}],demo:{inputs:[{filename:"audio.wav",type:"audio"},{label:"Text Prompt",content:"What is the gender of the speaker?",type:"text"}],outputs:[{label:"Generated Text",content:"The gender of the speaker is female.",type:"text"}]},metrics:[],models:[{description:"A lightweight model that has capabilities of taking both audio and text as inputs and generating responses.",id:"fixie-ai/ultravox-v0_5-llama-3_2-1b"},{description:"A multimodal model that supports voice chat and audio analysis.",id:"Qwen/Qwen2-Audio-7B-Instruct"},{description:"A model for audio understanding, speech translation, and transcription.",id:"mistralai/Voxtral-Small-24B-2507"},{description:"A new model capable of audio question answering and reasoning.",id:"nvidia/audio-flamingo-3"}],spaces:[{description:"A space that takes input as both audio and text and generates answers.",id:"iamomtiwari/ATTT"},{description:"A web application that demonstrates chatting with the Qwen2Audio Model.",id:"freddyaboulton/talk-to-qwen-webrtc"}],summary:"Audio-text-to-text models take both an audio clip and a text prompt as input, and generate natural language text as output. These models can answer questions about spoken content, summarize meetings, analyze music, or interpret speech beyond simple transcription. They are useful for applications that combine speech understanding with reasoning or conversation.",widgetModels:[],youtubeId:""},Dl={datasets:[{description:"512-element X-vector embeddings of speakers from CMU ARCTIC dataset.",id:"Matthijs/cmu-arctic-xvectors"}],demo:{inputs:[{filename:"input.wav",type:"audio"}],outputs:[{filename:"label-0.wav",type:"audio"},{filename:"label-1.wav",type:"audio"}]},metrics:[{description:"The Signal-to-Noise ratio is the relationship between the target signal level and the background noise level. It is calculated as the logarithm of the target signal divided by the background noise, in decibels.",id:"snri"},{description:"The Signal-to-Distortion ratio is the relationship between the target signal and the sum of noise, interference, and artifact errors",id:"sdri"}],models:[{description:"A speech enhancement model.",id:"ResembleAI/resemble-enhance"},{description:"A model that can change the voice in a speech recording.",id:"microsoft/speecht5_vc"}],spaces:[{description:"An application for speech separation.",id:"younver/speechbrain-speech-separation"},{description:"An application for audio style transfer.",id:"nakas/audio-diffusion_style_transfer"}],summary:"Audio-to-Audio is a family of tasks in which the input is an audio and the output is one or multiple generated audios. Some example tasks are speech enhancement and source separation.",widgetModels:["speechbrain/sepformer-wham"],youtubeId:"iohj7nCCYoM"},jl={datasets:[{description:"31,175 hours of multilingual audio-text dataset in 108 languages.",id:"mozilla-foundation/common_voice_17_0"},{description:"Multilingual and diverse audio dataset with 101k hours of audio.",id:"amphion/Emilia-Dataset"},{description:"A dataset with 44.6k hours of English speaker data and 6k hours of other language speakers.",id:"parler-tts/mls_eng"},{description:"A multilingual audio dataset with 370K hours of audio.",id:"espnet/yodas"}],demo:{inputs:[{filename:"input.flac",type:"audio"}],outputs:[{label:"Transcript",content:"Going along slushy country roads and speaking to damp audiences in...",type:"text"}]},metrics:[{description:"",id:"wer"},{description:"",id:"cer"}],models:[{description:"A powerful ASR model by OpenAI.",id:"openai/whisper-large-v3"},{description:"A good generic speech model by MetaAI for fine-tuning.",id:"facebook/w2v-bert-2.0"},{description:"An end-to-end model that performs ASR and Speech Translation by MetaAI.",id:"facebook/seamless-m4t-v2-large"},{description:"A powerful multilingual ASR and Speech Translation model by Nvidia.",id:"nvidia/canary-1b"},{description:"Powerful speaker diarization model.",id:"pyannote/speaker-diarization-3.1"}],spaces:[{description:"A powerful general-purpose speech recognition application.",id:"hf-audio/whisper-large-v3"},{description:"Latest ASR model from Useful Sensors.",id:"mrfakename/Moonshinex"},{description:"A high quality speech and text translation model by Meta.",id:"facebook/seamless_m4t"},{description:"A powerful multilingual ASR and Speech Translation model by Nvidia",id:"nvidia/canary-1b"}],summary:"Automatic Speech Recognition (ASR), also known as Speech to Text (STT), is the task of transcribing a given audio to text. It has many applications, such as voice user interfaces.",widgetModels:["openai/whisper-large-v3"],youtubeId:"TksaY_FDgnk"},Ol={datasets:[{description:"Largest document understanding dataset.",id:"HuggingFaceM4/Docmatix"},{description:"Dataset from the 2020 DocVQA challenge. The documents are taken from the UCSF Industry Documents Library.",id:"eliolio/docvqa"}],demo:{inputs:[{label:"Question",content:"What is the idea behind the consumer relations efficiency team?",type:"text"},{filename:"document-question-answering-input.png",type:"img"}],outputs:[{label:"Answer",content:"Balance cost efficiency with quality customer service",type:"text"}]},metrics:[{description:"The evaluation metric for the DocVQA challenge is the Average Normalized Levenshtein Similarity (ANLS). This metric is flexible to character regognition errors and compares the predicted answer with the ground truth answer.",id:"anls"},{description:"Exact Match is a metric based on the strict character match of the predicted answer and the right answer. For answers predicted correctly, the Exact Match will be 1. Even if only one character is different, Exact Match will be 0",id:"exact-match"}],models:[{description:"A robust document question answering model.",id:"impira/layoutlm-document-qa"},{description:"A document question answering model specialized in invoices.",id:"impira/layoutlm-invoices"},{description:"A special model for OCR-free document question answering.",id:"microsoft/udop-large"},{description:"A powerful model for document question answering.",id:"google/pix2struct-docvqa-large"}],spaces:[{description:"A robust document question answering application.",id:"impira/docquery"},{description:"An application that can answer questions from invoices.",id:"impira/invoices"},{description:"An application to compare different document question answering models.",id:"merve/compare_docvqa_models"}],summary:"Document Question Answering (also known as Document Visual Question Answering) is the task of answering questions on document images. Document question answering models take a (document, question) pair as input and return an answer in natural language. Models usually rely on multi-modal features, combining text, position of words (bounding-boxes) and image.",widgetModels:["impira/layoutlm-invoices"],youtubeId:""},Bl={datasets:[{description:"Wikipedia dataset containing cleaned articles of all languages. Can be used to train `feature-extraction` models.",id:"wikipedia"}],demo:{inputs:[{label:"Input",content:"India, officially the Republic of India, is a country in South Asia.",type:"text"}],outputs:[{table:[["Dimension 1","Dimension 2","Dimension 3"],["2.583383083343506","2.757075071334839","0.9023529887199402"],["8.29393482208252","1.1071064472198486","2.03399395942688"],["-0.7754912972450256","-1.647324562072754","-0.6113331913948059"],["0.07087723910808563","1.5942802429199219","1.4610432386398315"]],type:"tabular"}]},metrics:[],models:[{description:"A powerful feature extraction model for natural language processing tasks.",id:"thenlper/gte-large"},{description:"A strong feature extraction model for retrieval.",id:"Alibaba-NLP/gte-Qwen1.5-7B-instruct"}],spaces:[{description:"A leaderboard to rank text feature extraction models based on a benchmark.",id:"mteb/leaderboard"},{description:"A leaderboard to rank best feature extraction models based on human feedback.",id:"mteb/arena"}],summary:"Feature extraction is the task of extracting features learnt in a model.",widgetModels:["facebook/bart-base"]},ql={datasets:[{description:"A common dataset that is used to train models for many languages.",id:"wikipedia"},{description:"A large English dataset with text crawled from the web.",id:"c4"}],demo:{inputs:[{label:"Input",content:"The <mask> barked at me",type:"text"}],outputs:[{type:"chart",data:[{label:"wolf",score:.487},{label:"dog",score:.061},{label:"cat",score:.058},{label:"fox",score:.047},{label:"squirrel",score:.025}]}]},metrics:[{description:"Cross Entropy is a metric that calculates the difference between two probability distributions. Each probability distribution is the distribution of predicted words",id:"cross_entropy"},{description:"Perplexity is the exponential of the cross-entropy loss. It evaluates the probabilities assigned to the next word by the model. Lower perplexity indicates better performance",id:"perplexity"}],models:[{description:"State-of-the-art masked language model.",id:"answerdotai/ModernBERT-large"},{description:"A multilingual model trained on 100 languages.",id:"FacebookAI/xlm-roberta-base"}],spaces:[],summary:"Masked language modeling is the task of masking some of the words in a sentence and predicting which words should replace those masks. These models are useful when we want to get a statistical understanding of the language in which the model is trained in.",widgetModels:["distilroberta-base"],youtubeId:"mqElG5QJWUg"},Fl={datasets:[{description:"Benchmark dataset used for image classification with images that belong to 100 classes.",id:"cifar100"},{description:"Dataset consisting of images of garments.",id:"fashion_mnist"}],demo:{inputs:[{filename:"image-classification-input.jpeg",type:"img"}],outputs:[{type:"chart",data:[{label:"Egyptian cat",score:.514},{label:"Tabby cat",score:.193},{label:"Tiger cat",score:.068}]}]},metrics:[{description:"",id:"accuracy"},{description:"",id:"recall"},{description:"",id:"precision"},{description:"",id:"f1"}],models:[{description:"A strong image classification model.",id:"google/vit-base-patch16-224"},{description:"A robust image classification model.",id:"facebook/deit-base-distilled-patch16-224"},{description:"A strong image classification model.",id:"facebook/convnext-large-224"}],spaces:[{description:"A leaderboard to evaluate different image classification models.",id:"timm/leaderboard"}],summary:"Image classification is the task of assigning a label or class to an entire image. Images are expected to have only one class for each image. Image classification models take an image as input and return a prediction about which class the image belongs to.",widgetModels:["google/vit-base-patch16-224"],youtubeId:"tjAIM7BOYhw"},Hl={datasets:[{description:"ImageNet-1K is a image classification dataset in which images are used to train image-feature-extraction models.",id:"imagenet-1k"}],demo:{inputs:[{filename:"mask-generation-input.png",type:"img"}],outputs:[{table:[["Dimension 1","Dimension 2","Dimension 3"],["0.21236686408519745","1.0919708013534546","0.8512550592422485"],["0.809657871723175","-0.18544459342956543","-0.7851548194885254"],["1.3103108406066895","-0.2479034662246704","-0.9107287526130676"],["1.8536205291748047","-0.36419737339019775","0.09717650711536407"]],type:"tabular"}]},metrics:[],models:[{description:"A powerful image feature extraction model.",id:"timm/vit_large_patch14_dinov2.lvd142m"},{description:"A strong image feature extraction model.",id:"nvidia/MambaVision-T-1K"},{description:"A robust image feature extraction model.",id:"facebook/dino-vitb16"},{description:"Cutting-edge image feature extraction model.",id:"apple/aimv2-large-patch14-336-distilled"},{description:"Strong image feature extraction model that can be used on images and documents.",id:"OpenGVLab/InternViT-6B-448px-V1-2"}],spaces:[{description:"A leaderboard to evaluate different image-feature-extraction models on classification performances",id:"timm/leaderboard"}],summary:"Image feature extraction is the task of extracting features learnt in a computer vision model.",widgetModels:[]},Vl={datasets:[{description:"Synthetic dataset, for image relighting",id:"VIDIT"},{description:"Multiple images of celebrities, used for facial expression translation",id:"huggan/CelebA-faces"},{description:"12M image-caption pairs.",id:"Spawning/PD12M"}],demo:{inputs:[{filename:"image-to-image-input.jpeg",type:"img"}],outputs:[{filename:"image-to-image-output.png",type:"img"}]},isPlaceholder:!1,metrics:[{description:"Peak Signal to Noise Ratio (PSNR) is an approximation of the human perception, considering the ratio of the absolute intensity with respect to the variations. Measured in dB, a high value indicates a high fidelity.",id:"PSNR"},{description:"Structural Similarity Index (SSIM) is a perceptual metric which compares the luminance, contrast and structure of two images. The values of SSIM range between -1 and 1, and higher values indicate closer resemblance to the original image.",id:"SSIM"},{description:"Inception Score (IS) is an analysis of the labels predicted by an image classification model when presented with a sample of the generated images.",id:"IS"}],models:[{description:"An image-to-image model to improve image resolution.",id:"fal/AuraSR-v2"},{description:"Powerful image editing model.",id:"black-forest-labs/FLUX.1-Kontext-dev"},{description:"Virtual try-on model.",id:"yisol/IDM-VTON"},{description:"Image re-lighting model.",id:"kontext-community/relighting-kontext-dev-lora-v3"},{description:"Strong model for inpainting and outpainting.",id:"black-forest-labs/FLUX.1-Fill-dev"},{description:"Strong model for image editing using depth maps.",id:"black-forest-labs/FLUX.1-Depth-dev-lora"}],spaces:[{description:"Image editing application.",id:"black-forest-labs/FLUX.1-Kontext-Dev"},{description:"Image relighting application.",id:"lllyasviel/iclight-v2-vary"},{description:"An application for image upscaling.",id:"jasperai/Flux.1-dev-Controlnet-Upscaler"}],summary:"Image-to-image is the task of transforming an input image through a variety of possible manipulations and enhancements, such as super-resolution, image inpainting, colorization, and more.",widgetModels:["Qwen/Qwen-Image"],youtubeId:""},zl={datasets:[{description:"Dataset from 12M image-text of Reddit",id:"red_caps"},{description:"Dataset from 3.3M images of Google",id:"datasets/conceptual_captions"}],demo:{inputs:[{filename:"savanna.jpg",type:"img"}],outputs:[{label:"Detailed description",content:"a herd of giraffes and zebras grazing in a field",type:"text"}]},metrics:[],models:[{description:"Strong OCR model.",id:"allenai/olmOCR-7B-0725"},{description:"Powerful image captioning model.",id:"fancyfeast/llama-joycaption-beta-one-hf-llava"}],spaces:[{description:"SVG generator app from images.",id:"multimodalart/OmniSVG-3B"},{description:"An application that converts documents to markdown.",id:"numind/NuMarkdown-8B-Thinking"},{description:"An application that can caption images.",id:"fancyfeast/joy-caption-beta-one"}],summary:"Image to text models output a text from a given image. Image captioning or optical character recognition can be considered as the most common applications of image to text.",widgetModels:["Salesforce/blip-image-captioning-large"],youtubeId:""},Kl={datasets:[{description:"Instructions composed of image and text.",id:"liuhaotian/LLaVA-Instruct-150K"},{description:"Collection of image-text pairs on scientific topics.",id:"DAMO-NLP-SG/multimodal_textbook"},{description:"A collection of datasets made for model fine-tuning.",id:"HuggingFaceM4/the_cauldron"},{description:"Screenshots of websites with their HTML/CSS codes.",id:"HuggingFaceM4/WebSight"}],demo:{inputs:[{filename:"image-text-to-text-input.png",type:"img"},{label:"Text Prompt",content:"Describe the position of the bee in detail.",type:"text"}],outputs:[{label:"Answer",content:"The bee is sitting on a pink flower, surrounded by other flowers. The bee is positioned in the center of the flower, with its head and front legs sticking out.",type:"text"}]},metrics:[],models:[{description:"Small and efficient yet powerful vision language model.",id:"HuggingFaceTB/SmolVLM-Instruct"},{description:"Cutting-edge reasoning vision language model.",id:"zai-org/GLM-4.5V"},{description:"Cutting-edge small vision language model to convert documents to text.",id:"rednote-hilab/dots.ocr"},{description:"Small yet powerful model.",id:"Qwen/Qwen2.5-VL-3B-Instruct"},{description:"Image-text-to-text model with agentic capabilities.",id:"microsoft/Magma-8B"}],spaces:[{description:"Leaderboard to evaluate vision language models.",id:"opencompass/open_vlm_leaderboard"},{description:"An application that compares object detection capabilities of different vision language models.",id:"sergiopaniego/vlm_object_understanding"},{description:"An application to compare different OCR models.",id:"prithivMLmods/Multimodal-OCR"}],summary:"Image-text-to-text models take in an image and text prompt and output text. These models are also called vision-language models, or VLMs. The difference from image-to-text models is that these models take an additional text input, not restricting the model to certain use cases like image captioning, and may also be trained to accept a conversation as input.",widgetModels:["zai-org/GLM-4.5V"],youtubeId:"IoGaGfU1CIg"},Wl={datasets:[],demo:{inputs:[{filename:"image-text-to-image-input.jpeg",type:"img"},{label:"Input",content:"A city above clouds, pastel colors, Victorian style",type:"text"}],outputs:[{filename:"image-text-to-image-output.png",type:"img"}]},metrics:[{description:"The Fréchet Inception Distance (FID) calculates the distance between distributions between synthetic and real samples. A lower FID score indicates better similarity between the distributions of real and generated images.",id:"FID"},{description:"CLIP Score measures the similarity between the generated image and the text prompt using CLIP embeddings. A higher score indicates better alignment with the text prompt.",id:"CLIP"}],models:[{description:"A powerful model for image-text-to-image generation.",id:"black-forest-labs/FLUX.2-dev"}],spaces:[{description:"An application for image-text-to-image generation.",id:"black-forest-labs/FLUX.2-dev"}],summary:"Image-text-to-image models take an image and a text prompt as input and generate a new image based on the reference image and text instructions. These models are useful for image editing, style transfer, image variations, and guided image generation tasks.",widgetModels:["black-forest-labs/FLUX.2-dev"],youtubeId:void 0},Xl={datasets:[],demo:{inputs:[{filename:"image-text-to-video-input.jpg",type:"img"},{label:"Input",content:"Darth Vader is surfing on the waves.",type:"text"}],outputs:[{filename:"image-text-to-video-output.gif",type:"img"}]},metrics:[{description:"Frechet Video Distance uses a model that captures coherence for changes in frames and the quality of each frame. A smaller score indicates better video generation.",id:"fvd"},{description:"CLIPSIM measures similarity between video frames and text using an image-text similarity model. A higher score indicates better video generation.",id:"clipsim"}],models:[{description:"A powerful model for image-text-to-video generation.",id:"Lightricks/LTX-Video"}],spaces:[{description:"An application for image-text-to-video generation.",id:"Lightricks/ltx-video-distilled"}],summary:"Image-text-to-video models take an reference image and a text instructions as and generate a video based on them. These models are useful for animating still images, creating dynamic content from static references, and generating videos with specific motion or transformation guidance.",widgetModels:["Lightricks/LTX-Video"],youtubeId:void 0},Ql={datasets:[{description:"Scene segmentation dataset.",id:"scene_parse_150"}],demo:{inputs:[{filename:"image-segmentation-input.jpeg",type:"img"}],outputs:[{filename:"image-segmentation-output.png",type:"img"}]},metrics:[{description:"Average Precision (AP) is the Area Under the PR Curve (AUC-PR). It is calculated for each semantic class separately",id:"Average Precision"},{description:"Mean Average Precision (mAP) is the overall average of the AP values",id:"Mean Average Precision"},{description:"Intersection over Union (IoU) is the overlap of segmentation masks. Mean IoU is the average of the IoU of all semantic classes",id:"Mean Intersection over Union"},{description:"APα is the Average Precision at the IoU threshold of a α value, for example, AP50 and AP75",id:"APα"}],models:[{description:"Solid panoptic segmentation model trained on COCO.",id:"tue-mps/coco_panoptic_eomt_large_640"},{description:"Background removal model.",id:"briaai/RMBG-1.4"},{description:"A multipurpose image segmentation model for high resolution images.",id:"ZhengPeng7/BiRefNet"},{description:"Powerful human-centric image segmentation model.",id:"facebook/sapiens-seg-1b"},{description:"Panoptic segmentation model trained on the COCO (common objects) dataset.",id:"facebook/mask2former-swin-large-coco-panoptic"}],spaces:[{description:"A semantic segmentation application that can predict unseen instances out of the box.",id:"facebook/ov-seg"},{description:"One of the strongest segmentation applications.",id:"jbrinkma/segment-anything"},{description:"A human-centric segmentation model.",id:"facebook/sapiens-pose"},{description:"An instance segmentation application to predict neuronal cell types from microscopy images.",id:"rashmi/sartorius-cell-instance-segmentation"},{description:"An application that segments videos.",id:"ArtGAN/Segment-Anything-Video"},{description:"An panoptic segmentation application built for outdoor environments.",id:"segments/panoptic-segment-anything"}],summary:"Image Segmentation divides an image into segments where each pixel in the image is mapped to an object. This task has multiple variants such as instance segmentation, panoptic segmentation and semantic segmentation.",widgetModels:["nvidia/segformer-b0-finetuned-ade-512-512"],youtubeId:"dKE8SIt9C-w"},Jl={datasets:[{description:"A benchmark dataset for reference image controlled video generation.",id:"ali-vilab/VACE-Benchmark"},{description:"A dataset of video generation style preferences.",id:"Rapidata/sora-video-generation-style-likert-scoring"},{description:"A dataset with videos and captions throughout the videos.",id:"BestWishYsh/ChronoMagic"}],demo:{inputs:[{filename:"image-to-video-input.jpg",type:"img"},{label:"Optional Text Prompt",content:"This penguin is dancing",type:"text"}],outputs:[{filename:"image-to-video-output.gif",type:"img"}]},metrics:[{description:"Fréchet Video Distance (FVD) measures the perceptual similarity between the distributions of generated videos and a set of real videos, assessing overall visual quality and temporal coherence of the video generated from an input image.",id:"fvd"},{description:"CLIP Score measures the semantic similarity between a textual prompt (if provided alongside the input image) and the generated video frames. It evaluates how well the video's generated content and motion align with the textual description, conditioned on the initial image.",id:"clip_score"},{description:"First Frame Fidelity, often measured using LPIPS (Learned Perceptual Image Patch Similarity), PSNR, or SSIM, quantifies how closely the first frame of the generated video matches the input conditioning image.",id:"lpips"},{description:"Identity Preservation Score measures the consistency of identity (e.g., a person's face or a specific object's characteristics) between the input image and throughout the generated video frames, often calculated using features from specialized models like face recognition (e.g., ArcFace) or re-identification models.",id:"identity_preservation"},{description:"Motion Score evaluates the quality, realism, and temporal consistency of motion in the video generated from a static image. This can be based on optical flow analysis (e.g., smoothness, magnitude), consistency of object trajectories, or specific motion plausibility assessments.",id:"motion_score"}],models:[{description:"LTX-Video, a 13B parameter model for high quality video generation",id:"Lightricks/LTX-Video-0.9.7-dev"},{description:"A 14B parameter model for reference image controlled video generation",id:"Wan-AI/Wan2.1-VACE-14B"},{description:"An image-to-video generation model using FramePack F1 methodology with Hunyuan-DiT architecture",id:"lllyasviel/FramePack_F1_I2V_HY_20250503"},{description:"A distilled version of the LTX-Video-0.9.7-dev model for faster inference",id:"Lightricks/LTX-Video-0.9.7-distilled"},{description:"An image-to-video generation model by Skywork AI, 14B parameters, producing 720p videos.",id:"Skywork/SkyReels-V2-I2V-14B-720P"},{description:"Image-to-video variant of Tencent's HunyuanVideo.",id:"tencent/HunyuanVideo-I2V"},{description:"A 14B parameter model for 720p image-to-video generation by Wan-AI.",id:"Wan-AI/Wan2.1-I2V-14B-720P"},{description:"A Diffusers version of the Wan2.1-I2V-14B-720P model for 720p image-to-video generation.",id:"Wan-AI/Wan2.1-I2V-14B-720P-Diffusers"}],spaces:[{description:"An application to generate videos fast.",id:"Lightricks/ltx-video-distilled"},{description:"Generate videos with the FramePack-F1",id:"linoyts/FramePack-F1"},{description:"Generate videos with the FramePack",id:"lisonallen/framepack-i2v"},{description:"Wan2.1 with CausVid LoRA",id:"multimodalart/wan2-1-fast"},{description:"A demo for Stable Video Diffusion",id:"multimodalart/stable-video-diffusion"}],summary:"Image-to-video models take a still image as input and generate a video. These models can be guided by text prompts to influence the content and style of the output video.",widgetModels:[],youtubeId:void 0},Yl={datasets:[{description:"Widely used benchmark dataset for multiple Vision tasks.",id:"merve/coco2017"},{description:"Medical Imaging dataset of the Human Brain for segmentation and mask generating tasks",id:"rocky93/BraTS_segmentation"}],demo:{inputs:[{filename:"mask-generation-input.png",type:"img"}],outputs:[{filename:"mask-generation-output.png",type:"img"}]},metrics:[{description:"IoU is used to measure the overlap between predicted mask and the ground truth mask.",id:"Intersection over Union (IoU)"}],models:[{description:"Small yet powerful mask generation model.",id:"Zigeng/SlimSAM-uniform-50"},{description:"Very strong mask generation model.",id:"facebook/sam2-hiera-large"}],spaces:[{description:"An application that combines a mask generation model with a zero-shot object detection model for text-guided image segmentation.",id:"merve/OWLSAM2"},{description:"An application that compares the performance of a large and a small mask generation model.",id:"merve/slimsam"},{description:"An application based on an improved mask generation model.",id:"SkalskiP/segment-anything-model-2"},{description:"An application to remove objects from videos using mask generation models.",id:"SkalskiP/SAM_and_ProPainter"}],summary:"Mask generation is the task of generating masks that identify a specific object or region of interest in a given image. Masks are often used in segmentation tasks, where they provide a precise way to isolate the object of interest for further processing or analysis.",widgetModels:[],youtubeId:""},Zl={datasets:[{description:"Widely used benchmark dataset for multiple vision tasks.",id:"merve/coco2017"},{description:"Multi-task computer vision benchmark.",id:"merve/pascal-voc"}],demo:{inputs:[{filename:"object-detection-input.jpg",type:"img"}],outputs:[{filename:"object-detection-output.jpg",type:"img"}]},metrics:[{description:"The Average Precision (AP) metric is the Area Under the PR Curve (AUC-PR). It is calculated for each class separately",id:"Average Precision"},{description:"The Mean Average Precision (mAP) metric is the overall average of the AP values",id:"Mean Average Precision"},{description:"The APα metric is the Average Precision at the IoU threshold of a α value, for example, AP50 and AP75",id:"APα"}],models:[{description:"Solid object detection model pre-trained on the COCO 2017 dataset.",id:"facebook/detr-resnet-50"},{description:"Accurate object detection model.",id:"IDEA-Research/dab-detr-resnet-50"},{description:"Fast and accurate object detection model.",id:"PekingU/rtdetr_v2_r50vd"},{description:"Object detection model for low-lying objects.",id:"StephanST/WALDO30"}],spaces:[{description:"Real-time object detection demo.",id:"Roboflow/RF-DETR"},{description:"An application that contains various object detection models to try from.",id:"Gradio-Blocks/Object-Detection-With-DETR-and-YOLOS"},{description:"A cutting-edge object detection application.",id:"sunsmarterjieleaf/yolov12"},{description:"An object tracking, segmentation and inpainting application.",id:"VIPLab/Track-Anything"},{description:"Very fast object tracking application based on object detection.",id:"merve/RT-DETR-tracking-coco"}],summary:"Object Detection models allow users to identify objects of certain defined classes. Object detection models receive an image as input and output the images with bounding boxes and labels on detected objects.",widgetModels:["facebook/detr-resnet-50"],youtubeId:"WdAeKSOpxhw"},Gl={datasets:[{description:"NYU Depth V2 Dataset: Video dataset containing both RGB and depth sensor data.",id:"sayakpaul/nyu_depth_v2"},{description:"Monocular depth estimation benchmark based without noise and errors.",id:"depth-anything/DA-2K"}],demo:{inputs:[{filename:"depth-estimation-input.jpg",type:"img"}],outputs:[{filename:"depth-estimation-output.png",type:"img"}]},metrics:[],models:[{description:"Cutting-edge depth estimation model.",id:"depth-anything/Depth-Anything-V2-Large"},{description:"A strong monocular depth estimation model.",id:"jingheya/lotus-depth-g-v1-0"},{description:"A depth estimation model that predicts depth in videos.",id:"tencent/DepthCrafter"},{description:"A robust depth estimation model.",id:"apple/DepthPro-hf"}],spaces:[{description:"An application that predicts the depth of an image and then reconstruct the 3D model as voxels.",id:"radames/dpt-depth-estimation-3d-voxels"},{description:"An application for bleeding-edge depth estimation.",id:"akhaliq/depth-pro"},{description:"An application on cutting-edge depth estimation in videos.",id:"tencent/DepthCrafter"},{description:"A human-centric depth estimation application.",id:"facebook/sapiens-depth"}],summary:"Depth estimation is the task of predicting depth of the objects present in an image.",widgetModels:[""],youtubeId:""},ec={datasets:[],demo:{inputs:[],outputs:[]},isPlaceholder:!0,metrics:[],models:[],spaces:[],summary:"",widgetModels:[],youtubeId:void 0,canonicalId:void 0},tc={datasets:[{description:"A curation of widely used datasets for Data Driven Deep Reinforcement Learning (D4RL)",id:"edbeeching/decision_transformer_gym_replay"}],demo:{inputs:[{label:"State",content:"Red traffic light, pedestrians are about to pass.",type:"text"}],outputs:[{label:"Action",content:"Stop the car.",type:"text"},{label:"Next State",content:"Yellow light, pedestrians have crossed.",type:"text"}]},metrics:[{description:"Accumulated reward across all time steps discounted by a factor that ranges between 0 and 1 and determines how much the agent optimizes for future relative to immediate rewards. Measures how good is the policy ultimately found by a given algorithm considering uncertainty over the future.",id:"Discounted Total Reward"},{description:"Average return obtained after running the policy for a certain number of evaluation episodes. As opposed to total reward, mean reward considers how much reward a given algorithm receives while learning.",id:"Mean Reward"},{description:"Measures how good a given algorithm is after a predefined time. Some algorithms may be guaranteed to converge to optimal behavior across many time steps. However, an agent that reaches an acceptable level of optimality after a given time horizon may be preferable to one that ultimately reaches optimality but takes a long time.",id:"Level of Performance After Some Time"}],models:[{description:"A Reinforcement Learning model trained on expert data from the Gym Hopper environment",id:"edbeeching/decision-transformer-gym-hopper-expert"},{description:"A PPO agent playing seals/CartPole-v0 using the stable-baselines3 library and the RL Zoo.",id:"HumanCompatibleAI/ppo-seals-CartPole-v0"}],spaces:[{description:"An application for a cute puppy agent learning to catch a stick.",id:"ThomasSimonini/Huggy"},{description:"An application to play Snowball Fight with a reinforcement learning agent.",id:"ThomasSimonini/SnowballFight"}],summary:"Reinforcement learning is the computational approach of learning from action by interacting with an environment through trial and error and receiving rewards (negative or positive) as feedback",widgetModels:[],youtubeId:"q0BiUn5LiBc"},nc={datasets:[{description:"A famous question answering dataset based on English articles from Wikipedia.",id:"squad_v2"},{description:"A dataset of aggregated anonymized actual queries issued to the Google search engine.",id:"natural_questions"}],demo:{inputs:[{label:"Question",content:"Which name is also used to describe the Amazon rainforest in English?",type:"text"},{label:"Context",content:"The Amazon rainforest, also known in English as Amazonia or the Amazon Jungle",type:"text"}],outputs:[{label:"Answer",content:"Amazonia",type:"text"}]},metrics:[{description:"Exact Match is a metric based on the strict character match of the predicted answer and the right answer. For answers predicted correctly, the Exact Match will be 1. Even if only one character is different, Exact Match will be 0",id:"exact-match"},{description:" The F1-Score metric is useful if we value both false positives and false negatives equally. The F1-Score is calculated on each word in the predicted sequence against the correct answer",id:"f1"}],models:[{description:"A robust baseline model for most question answering domains.",id:"deepset/roberta-base-squad2"},{description:"Small yet robust model that can answer questions.",id:"distilbert/distilbert-base-cased-distilled-squad"},{description:"A special model that can answer questions from tables.",id:"google/tapas-base-finetuned-wtq"}],spaces:[{description:"An application that can answer a long question from Wikipedia.",id:"deepset/wikipedia-assistant"}],summary:"Question Answering models can retrieve the answer to a question from a given text, which is useful for searching for an answer in a document. Some question answering models can generate answers without context!",widgetModels:["deepset/roberta-base-squad2"],youtubeId:"ajPx5LwJD-I"},ac={datasets:[{description:"Bing queries with relevant passages from various web sources.",id:"microsoft/ms_marco"}],demo:{inputs:[{label:"Source sentence",content:"Machine learning is so easy.",type:"text"},{label:"Sentences to compare to",content:"Deep learning is so straightforward.",type:"text"},{label:"",content:"This is so difficult, like rocket science.",type:"text"},{label:"",content:"I can't believe how much I struggled with this.",type:"text"}],outputs:[{type:"chart",data:[{label:"Deep learning is so straightforward.",score:.623},{label:"This is so difficult, like rocket science.",score:.413},{label:"I can't believe how much I struggled with this.",score:.256}]}]},metrics:[{description:"Reciprocal Rank is a measure used to rank the relevancy of documents given a set of documents. Reciprocal Rank is the reciprocal of the rank of the document retrieved, meaning, if the rank is 3, the Reciprocal Rank is 0.33. If the rank is 1, the Reciprocal Rank is 1",id:"Mean Reciprocal Rank"},{description:"The similarity of the embeddings is evaluated mainly on cosine similarity. It is calculated as the cosine of the angle between two vectors. It is particularly useful when your texts are not the same length",id:"Cosine Similarity"}],models:[{description:"This model works well for sentences and paragraphs and can be used for clustering/grouping and semantic searches.",id:"sentence-transformers/all-mpnet-base-v2"},{description:"A multilingual robust sentence similarity model.",id:"BAAI/bge-m3"},{description:"A robust sentence similarity model.",id:"HIT-TMG/KaLM-embedding-multilingual-mini-instruct-v1.5"}],spaces:[{description:"An application that leverages sentence similarity to answer questions from YouTube videos.",id:"Gradio-Blocks/Ask_Questions_To_YouTube_Videos"},{description:"An application that retrieves relevant PubMed abstracts for a given online article which can be used as further references.",id:"Gradio-Blocks/pubmed-abstract-retriever"},{description:"An application that leverages sentence similarity to summarize text.",id:"nickmuchi/article-text-summarizer"},{description:"A guide that explains how Sentence Transformers can be used for semantic search.",id:"sentence-transformers/Sentence_Transformers_for_semantic_search"}],summary:"Sentence Similarity is the task of determining how similar two texts are. Sentence similarity models convert input texts into vectors (embeddings) that capture semantic information and calculate how close (similar) they are between them. This task is particularly useful for information retrieval and clustering/grouping.",widgetModels:["sentence-transformers/all-MiniLM-L6-v2"],youtubeId:"VCZq5AkbNEU"},oc={canonicalId:"text-generation",datasets:[{description:"News articles in five different languages along with their summaries. Widely used for benchmarking multilingual summarization models.",id:"mlsum"},{description:"English conversations and their summaries. Useful for benchmarking conversational agents.",id:"samsum"}],demo:{inputs:[{label:"Input",content:"The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. It was the first structure to reach a height of 300 metres. Excluding transmitters, the Eiffel Tower is the second tallest free-standing structure in France after the Millau Viaduct.",type:"text"}],outputs:[{label:"Output",content:"The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building. It was the first structure to reach a height of 300 metres.",type:"text"}]},metrics:[{description:"The generated sequence is compared against its summary, and the overlap of tokens are counted. ROUGE-N refers to overlap of N subsequent tokens, ROUGE-1 refers to overlap of single tokens and ROUGE-2 is the overlap of two subsequent tokens.",id:"rouge"}],models:[{description:"A strong summarization model trained on English news articles. Excels at generating factual summaries.",id:"facebook/bart-large-cnn"},{description:"A summarization model trained on medical articles.",id:"Falconsai/medical_summarization"}],spaces:[{description:"An application that can summarize long paragraphs.",id:"pszemraj/summarize-long-text"},{description:"A much needed summarization application for terms and conditions.",id:"ml6team/distilbart-tos-summarizer-tosdr"},{description:"An application that summarizes long documents.",id:"pszemraj/document-summarization"},{description:"An application that can detect errors in abstractive summarization.",id:"ml6team/post-processing-summarization"}],summary:"Summarization is the task of producing a shorter version of a document while preserving its important information. Some models can extract text from the original input, while other models can generate entirely new text.",widgetModels:["facebook/bart-large-cnn"],youtubeId:"yHnr5Dk2zCI"},ic={datasets:[{description:"The WikiTableQuestions dataset is a large-scale dataset for the task of question answering on semi-structured tables.",id:"wikitablequestions"},{description:"WikiSQL is a dataset of 80654 hand-annotated examples of questions and SQL queries distributed across 24241 tables from Wikipedia.",id:"wikisql"}],demo:{inputs:[{table:[["Rank","Name","No.of reigns","Combined days"],["1","lou Thesz","3","3749"],["2","Ric Flair","8","3103"],["3","Harley Race","7","1799"]],type:"tabular"},{label:"Question",content:"What is the number of reigns for Harley Race?",type:"text"}],outputs:[{label:"Result",content:"7",type:"text"}]},metrics:[{description:"Checks whether the predicted answer(s) is the same as the ground-truth answer(s).",id:"Denotation Accuracy"}],models:[{description:"A table question answering model that is capable of neural SQL execution, i.e., employ TAPEX to execute a SQL query on a given table.",id:"microsoft/tapex-base"},{description:"A robust table question answering model.",id:"google/tapas-base-finetuned-wtq"}],spaces:[{description:"An application that answers questions based on table CSV files.",id:"katanaml/table-query"}],summary:"Table Question Answering (Table QA) is the answering a question about an information on a given table.",widgetModels:["google/tapas-base-finetuned-wtq"]},sc={datasets:[{description:"A comprehensive curation of datasets covering all benchmarks.",id:"inria-soda/tabular-benchmark"}],demo:{inputs:[{table:[["Glucose","Blood Pressure ","Skin Thickness","Insulin","BMI"],["148","72","35","0","33.6"],["150","50","30","0","35.1"],["141","60","29","1","39.2"]],type:"tabular"}],outputs:[{table:[["Diabetes"],["1"],["1"],["0"]],type:"tabular"}]},metrics:[{description:"",id:"accuracy"},{description:"",id:"recall"},{description:"",id:"precision"},{description:"",id:"f1"}],models:[{description:"Breast cancer prediction model based on decision trees.",id:"scikit-learn/cancer-prediction-trees"}],spaces:[{description:"An application that can predict defective products on a production line.",id:"scikit-learn/tabular-playground"},{description:"An application that compares various tabular classification techniques on different datasets.",id:"scikit-learn/classification"}],summary:"Tabular classification is the task of classifying a target category (a group) based on set of attributes.",widgetModels:["scikit-learn/tabular-playground"],youtubeId:""},rc={datasets:[{description:"A comprehensive curation of datasets covering all benchmarks.",id:"inria-soda/tabular-benchmark"}],demo:{inputs:[{table:[["Car Name","Horsepower","Weight"],["ford torino","140","3,449"],["amc hornet","97","2,774"],["toyota corolla","65","1,773"]],type:"tabular"}],outputs:[{table:[["MPG (miles per gallon)"],["17"],["18"],["31"]],type:"tabular"}]},metrics:[{description:"",id:"mse"},{description:"Coefficient of determination (or R-squared) is a measure of how well the model fits the data. Higher R-squared is considered a better fit.",id:"r-squared"}],models:[{description:"Fish weight prediction based on length measurements and species.",id:"scikit-learn/Fish-Weight"}],spaces:[{description:"An application that can predict weight of a fish based on set of attributes.",id:"scikit-learn/fish-weight-prediction"}],summary:"Tabular regression is the task of predicting a numerical value given a set of attributes.",widgetModels:["scikit-learn/Fish-Weight"],youtubeId:""},lc={datasets:[{description:"RedCaps is a large-scale dataset of 12M image-text pairs collected from Reddit.",id:"red_caps"},{description:"Conceptual Captions is a dataset consisting of ~3.3M images annotated with captions.",id:"conceptual_captions"},{description:"12M image-caption pairs.",id:"Spawning/PD12M"}],demo:{inputs:[{label:"Input",content:"A city above clouds, pastel colors, Victorian style",type:"text"}],outputs:[{filename:"image.jpeg",type:"img"}]},metrics:[{description:"The Inception Score (IS) measure assesses diversity and meaningfulness. It uses a generated image sample to predict its label. A higher score signifies more diverse and meaningful images.",id:"IS"},{description:"The Fréchet Inception Distance (FID) calculates the distance between distributions between synthetic and real samples. A lower FID score indicates better similarity between the distributions of real and generated images.",id:"FID"},{description:"R-precision assesses how the generated image aligns with the provided text description. It uses the generated images as queries to retrieve relevant text descriptions. The top 'r' relevant descriptions are selected and used to calculate R-precision as r/R, where 'R' is the number of ground truth descriptions associated with the generated images. A higher R-precision value indicates a better model.",id:"R-Precision"}],models:[{description:"One of the most powerful image generation models that can generate realistic outputs.",id:"black-forest-labs/FLUX.1-Krea-dev"},{description:"A powerful image generation model.",id:"Qwen/Qwen-Image"},{description:"Powerful and fast image generation model.",id:"ByteDance/SDXL-Lightning"},{description:"A powerful text-to-image model.",id:"ByteDance/Hyper-SD"}],spaces:[{description:"A powerful text-to-image application.",id:"stabilityai/stable-diffusion-3-medium"},{description:"A text-to-image application to generate comics.",id:"jbilcke-hf/ai-comic-factory"},{description:"An application to match multiple custom image generation models.",id:"multimodalart/flux-lora-lab"},{description:"A powerful yet very fast image generation application.",id:"latent-consistency/lcm-lora-for-sdxl"},{description:"A gallery to explore various text-to-image models.",id:"multimodalart/LoraTheExplorer"},{description:"An application for `text-to-image`, `image-to-image` and image inpainting.",id:"ArtGAN/Stable-Diffusion-ControlNet-WebUI"},{description:"An application to generate realistic images given photos of a person and a prompt.",id:"InstantX/InstantID"}],summary:"Text-to-image is the task of generating images from input text. These pipelines can also be used to modify and edit images based on text prompts.",widgetModels:["black-forest-labs/FLUX.1-dev"],youtubeId:""},cc={canonicalId:"text-to-audio",datasets:[{description:"10K hours of multi-speaker English dataset.",id:"parler-tts/mls_eng_10k"},{description:"Multi-speaker English dataset.",id:"mythicinfinity/libritts_r"},{description:"Multi-lingual dataset.",id:"facebook/multilingual_librispeech"}],demo:{inputs:[{label:"Input",content:"I love audio models on the Hub!",type:"text"}],outputs:[{filename:"audio.wav",type:"audio"}]},metrics:[{description:"The Mel Cepstral Distortion (MCD) metric is used to calculate the quality of generated speech.",id:"mel cepstral distortion"}],models:[{description:"Small yet powerful TTS model.",id:"KittenML/kitten-tts-nano-0.1"},{description:"Bleeding edge TTS model.",id:"ResembleAI/chatterbox"},{description:"A massively multi-lingual TTS model.",id:"fishaudio/fish-speech-1.5"},{description:"A text-to-dialogue model.",id:"nari-labs/Dia-1.6B-0626"}],spaces:[{description:"An application for generate high quality speech in different languages.",id:"hexgrad/Kokoro-TTS"},{description:"A multilingual text-to-speech application.",id:"fishaudio/fish-speech-1"},{description:"Performant TTS application.",id:"ResembleAI/Chatterbox"},{description:"An application to compare different TTS models.",id:"TTS-AGI/TTS-Arena-V2"},{description:"An application that generates podcast episodes.",id:"ngxson/kokoro-podcast-generator"}],summary:"Text-to-Speech (TTS) is the task of generating natural sounding speech given text input. TTS models can be extended to have a single model that generates speech for multiple speakers and multiple languages.",widgetModels:["suno/bark"],youtubeId:"NW62DpzJ274"},dc={datasets:[{description:"A widely used dataset useful to benchmark named entity recognition models.",id:"eriktks/conll2003"},{description:"A multilingual dataset of Wikipedia articles annotated for named entity recognition in over 150 different languages.",id:"unimelb-nlp/wikiann"}],demo:{inputs:[{label:"Input",content:"My name is Omar and I live in Zürich.",type:"text"}],outputs:[{text:"My name is Omar and I live in Zürich.",tokens:[{type:"PERSON",start:11,end:15},{type:"GPE",start:30,end:36}],type:"text-with-tokens"}]},metrics:[{description:"",id:"accuracy"},{description:"",id:"recall"},{description:"",id:"precision"},{description:"",id:"f1"}],models:[{description:"A robust performance model to identify people, locations, organizations and names of miscellaneous entities.",id:"dslim/bert-base-NER"},{description:"A strong model to identify people, locations, organizations and names in multiple languages.",id:"FacebookAI/xlm-roberta-large-finetuned-conll03-english"},{description:"A token classification model specialized on medical entity recognition.",id:"blaze999/Medical-NER"},{description:"Flair models are typically the state of the art in named entity recognition tasks.",id:"flair/ner-english"}],spaces:[{description:"An application that can recognizes entities, extracts noun chunks and recognizes various linguistic features of each token.",id:"spacy/gradio_pipeline_visualizer"}],summary:"Token classification is a natural language understanding task in which a label is assigned to some tokens in a text. Some popular token classification subtasks are Named Entity Recognition (NER) and Part-of-Speech (PoS) tagging. NER models could be trained to identify specific entities in a text, such as dates, individuals and places; and PoS tagging would identify, for example, which words in a text are verbs, nouns, and punctuation marks.",widgetModels:["FacebookAI/xlm-roberta-large-finetuned-conll03-english"],youtubeId:"wVHdVlPScxA"},pc={canonicalId:"text-generation",datasets:[{description:"A dataset of copyright-free books translated into 16 different languages.",id:"Helsinki-NLP/opus_books"},{description:"An example of translation between programming languages. This dataset consists of functions in Java and C#.",id:"google/code_x_glue_cc_code_to_code_trans"}],demo:{inputs:[{label:"Input",content:"My name is Omar and I live in Zürich.",type:"text"}],outputs:[{label:"Output",content:"Mein Name ist Omar und ich wohne in Zürich.",type:"text"}]},metrics:[{description:"BLEU score is calculated by counting the number of shared single or subsequent tokens between the generated sequence and the reference. Subsequent n tokens are called “n-grams”. Unigram refers to a single token while bi-gram refers to token pairs and n-grams refer to n subsequent tokens. The score ranges from 0 to 1, where 1 means the translation perfectly matched and 0 did not match at all",id:"bleu"},{description:"",id:"sacrebleu"}],models:[{description:"Very powerful model that can translate many languages between each other, especially low-resource languages.",id:"facebook/nllb-200-1.3B"},{description:"A general-purpose Transformer that can be used to translate from English to German, French, or Romanian.",id:"google-t5/t5-base"}],spaces:[{description:"An application that can translate between 100 languages.",id:"Iker/Translate-100-languages"},{description:"An application that can translate between many languages.",id:"Geonmo/nllb-translation-demo"}],summary:"Translation is the task of converting text from one language to another.",widgetModels:["facebook/mbart-large-50-many-to-many-mmt"],youtubeId:"1JvfrvZgi6c"},uc={datasets:[{description:"A widely used dataset used to benchmark multiple variants of text classification.",id:"nyu-mll/glue"},{description:"A text classification dataset used to benchmark natural language inference models",id:"stanfordnlp/snli"}],demo:{inputs:[{label:"Input",content:"I love Hugging Face!",type:"text"}],outputs:[{type:"chart",data:[{label:"POSITIVE",score:.9},{label:"NEUTRAL",score:.1},{label:"NEGATIVE",score:0}]}]},metrics:[{description:"",id:"accuracy"},{description:"",id:"recall"},{description:"",id:"precision"},{description:"The F1 metric is the harmonic mean of the precision and recall. It can be calculated as: F1 = 2 * (precision * recall) / (precision + recall)",id:"f1"}],models:[{description:"A robust model trained for sentiment analysis.",id:"distilbert/distilbert-base-uncased-finetuned-sst-2-english"},{description:"A sentiment analysis model specialized in financial sentiment.",id:"ProsusAI/finbert"},{description:"A sentiment analysis model specialized in analyzing tweets.",id:"cardiffnlp/twitter-roberta-base-sentiment-latest"},{description:"A model that can classify languages.",id:"papluca/xlm-roberta-base-language-detection"},{description:"A model that can classify text generation attacks.",id:"meta-llama/Prompt-Guard-86M"}],spaces:[{description:"An application that can classify financial sentiment.",id:"IoannisTr/Tech_Stocks_Trading_Assistant"},{description:"A dashboard that contains various text classification tasks.",id:"miesnerjacob/Multi-task-NLP"},{description:"An application that analyzes user reviews in healthcare.",id:"spacy/healthsea-demo"}],summary:"Text Classification is the task of assigning a label or class to a given text. Some use cases are sentiment analysis, natural language inference, and assessing grammatical correctness.",widgetModels:["distilbert/distilbert-base-uncased-finetuned-sst-2-english"],youtubeId:"leNG9fN9FQU"},mc={datasets:[{description:"Multilingual dataset used to evaluate text generation models.",id:"CohereForAI/Global-MMLU"},{description:"High quality multilingual data used to train text-generation models.",id:"HuggingFaceFW/fineweb-2"},{description:"Truly open-source, curated and cleaned dialogue dataset.",id:"HuggingFaceH4/ultrachat_200k"},{description:"A reasoning dataset.",id:"open-r1/OpenThoughts-114k-math"},{description:"A multilingual instruction dataset with preference ratings on responses.",id:"allenai/tulu-3-sft-mixture"},{description:"A large synthetic dataset for alignment of text generation models.",id:"HuggingFaceTB/smoltalk"},{description:"A dataset made for training text generation models solving math questions.",id:"HuggingFaceTB/finemath"}],demo:{inputs:[{label:"Input",content:"Once upon a time,",type:"text"}],outputs:[{label:"Output",content:"Once upon a time, we knew that our ancestors were on the verge of extinction. The great explorers and poets of the Old World, from Alexander the Great to Chaucer, are dead and gone. A good many of our ancient explorers and poets have",type:"text"}]},metrics:[{description:"Cross Entropy is a metric that calculates the difference between two probability distributions. Each probability distribution is the distribution of predicted words",id:"Cross Entropy"},{description:"The Perplexity metric is the exponential of the cross-entropy loss. It evaluates the probabilities assigned to the next word by the model. Lower perplexity indicates better performance",id:"Perplexity"}],models:[{description:"A text-generation model trained to follow instructions.",id:"google/gemma-2-2b-it"},{description:"Powerful text generation model for coding.",id:"Qwen/Qwen3-Coder-480B-A35B-Instruct"},{description:"Great text generation model with top-notch tool calling capabilities.",id:"openai/gpt-oss-120b"},{description:"Powerful text generation model.",id:"zai-org/GLM-4.5"},{description:"A powerful small model with reasoning capabilities.",id:"Qwen/Qwen3-4B-Thinking-2507"},{description:"Strong conversational model that supports very long instructions.",id:"Qwen/Qwen2.5-7B-Instruct-1M"},{description:"Text generation model used to write code.",id:"Qwen/Qwen2.5-Coder-32B-Instruct"},{description:"Powerful reasoning based open large language model.",id:"deepseek-ai/DeepSeek-R1"}],spaces:[{description:"An application that writes and executes code from text instructions and supports many models.",id:"akhaliq/anycoder"},{description:"An application that builds websites from natural language prompts.",id:"enzostvs/deepsite"},{description:"A leaderboard for comparing chain-of-thought performance of models.",id:"logikon/open_cot_leaderboard"},{description:"An text generation based application based on a very powerful LLaMA2 model.",id:"ysharma/Explore_llamav2_with_TGI"},{description:"An text generation based application to converse with Zephyr model.",id:"HuggingFaceH4/zephyr-chat"},{description:"A leaderboard that ranks text generation models based on blind votes from people.",id:"lmsys/chatbot-arena-leaderboard"},{description:"An chatbot to converse with a very powerful text generation model.",id:"mlabonne/phixtral-chat"}],summary:"Generating text is the task of generating new text given another text. These models can, for example, fill in incomplete text or paraphrase.",widgetModels:["mistralai/Mistral-Nemo-Instruct-2407"],youtubeId:"e9gNEAlsOvU"},fc={datasets:[{description:"Bing queries with relevant passages from various web sources.",id:"microsoft/ms_marco"}],demo:{inputs:[{label:"Source sentence",content:"Machine learning is so easy.",type:"text"},{label:"Sentences to compare to",content:"Deep learning is so straightforward.",type:"text"},{label:"",content:"This is so difficult, like rocket science.",type:"text"},{label:"",content:"I can't believe how much I struggled with this.",type:"text"}],outputs:[{type:"chart",data:[{label:"Deep learning is so straightforward.",score:2.2006407},{label:"This is so difficult, like rocket science.",score:-6.2634873},{label:"I can't believe how much I struggled with this.",score:-10.251488}]}]},metrics:[{description:"Discounted Cumulative Gain (DCG) measures the gain, or usefulness, of search results discounted by their position. The normalization is done by dividing the DCG by the ideal DCG, which is the DCG of the perfect ranking.",id:"Normalized Discounted Cumulative Gain"},{description:"Reciprocal Rank is a measure used to rank the relevancy of documents given a set of documents. Reciprocal Rank is the reciprocal of the rank of the document retrieved, meaning, if the rank is 3, the Reciprocal Rank is 0.33. If the rank is 1, the Reciprocal Rank is 1",id:"Mean Reciprocal Rank"},{description:"Mean Average Precision (mAP) is the overall average of the Average Precision (AP) values, where AP is the Area Under the PR Curve (AUC-PR)",id:"Mean Average Precision"}],models:[{description:"An extremely efficient text ranking model trained on a web search dataset.",id:"cross-encoder/ms-marco-MiniLM-L6-v2"},{description:"A strong multilingual text reranker model.",id:"Alibaba-NLP/gte-multilingual-reranker-base"},{description:"An efficient text ranking model that punches above its weight.",id:"Alibaba-NLP/gte-reranker-modernbert-base"}],spaces:[],summary:"Text Ranking is the task of ranking a set of texts based on their relevance to a query. Text ranking models are trained on large datasets of queries and relevant documents to learn how to rank documents based on their relevance to the query. This task is particularly useful for search engines and information retrieval systems.",widgetModels:["cross-encoder/ms-marco-MiniLM-L6-v2"],youtubeId:""},hc={datasets:[{description:"Microsoft Research Video to Text is a large-scale dataset for open domain video captioning",id:"iejMac/CLIP-MSR-VTT"},{description:"UCF101 Human Actions dataset consists of 13,320 video clips from YouTube, with 101 classes.",id:"quchenyuan/UCF101-ZIP"},{description:"A high-quality dataset for human action recognition in YouTube videos.",id:"nateraw/kinetics"},{description:"A dataset of video clips of humans performing pre-defined basic actions with everyday objects.",id:"HuggingFaceM4/something_something_v2"},{description:"This dataset consists of text-video pairs and contains noisy samples with irrelevant video descriptions",id:"HuggingFaceM4/webvid"},{description:"A dataset of short Flickr videos for the temporal localization of events with descriptions.",id:"iejMac/CLIP-DiDeMo"}],demo:{inputs:[{label:"Input",content:"Darth Vader is surfing on the waves.",type:"text"}],outputs:[{filename:"text-to-video-output.gif",type:"img"}]},metrics:[{description:"Inception Score uses an image classification model that predicts class labels and evaluates how distinct and diverse the images are. A higher score indicates better video generation.",id:"is"},{description:"Frechet Inception Distance uses an image classification model to obtain image embeddings. The metric compares mean and standard deviation of the embeddings of real and generated images. A smaller score indicates better video generation.",id:"fid"},{description:"Frechet Video Distance uses a model that captures coherence for changes in frames and the quality of each frame. A smaller score indicates better video generation.",id:"fvd"},{description:"CLIPSIM measures similarity between video frames and text using an image-text similarity model. A higher score indicates better video generation.",id:"clipsim"}],models:[{description:"A strong model for consistent video generation.",id:"tencent/HunyuanVideo"},{description:"A text-to-video model with high fidelity motion and strong prompt adherence.",id:"Lightricks/LTX-Video"},{description:"A text-to-video model focusing on physics-aware applications like robotics.",id:"nvidia/Cosmos-1.0-Diffusion-7B-Text2World"},{description:"Very fast model for video generation.",id:"Lightricks/LTX-Video-0.9.8-13B-distilled"}],spaces:[{description:"An application that generates video from text.",id:"VideoCrafter/VideoCrafter"},{description:"Consistent video generation application.",id:"Wan-AI/Wan2.1"},{description:"A cutting edge video generation application.",id:"Pyramid-Flow/pyramid-flow"}],summary:"Text-to-video models can be used in any application that requires generating consistent sequence of images from text. ",widgetModels:["Wan-AI/Wan2.2-TI2V-5B"],youtubeId:void 0},gc={datasets:[{description:"The CIFAR-100 dataset consists of 60000 32x32 colour images in 100 classes, with 600 images per class.",id:"cifar100"},{description:"Multiple images of celebrities, used for facial expression translation.",id:"CelebA"}],demo:{inputs:[{label:"Seed",content:"42",type:"text"},{label:"Number of images to generate:",content:"4",type:"text"}],outputs:[{filename:"unconditional-image-generation-output.jpeg",type:"img"}]},metrics:[{description:"The inception score (IS) evaluates the quality of generated images. It measures the diversity of the generated images (the model predictions are evenly distributed across all possible labels) and their 'distinction' or 'sharpness' (the model confidently predicts a single label for each image).",id:"Inception score (IS)"},{description:"The Fréchet Inception Distance (FID) evaluates the quality of images created by a generative model by calculating the distance between feature vectors for real and generated images.",id:"Frećhet Inception Distance (FID)"}],models:[{description:"High-quality image generation model trained on the CIFAR-10 dataset. It synthesizes images of the ten classes presented in the dataset using diffusion probabilistic models, a class of latent variable models inspired by considerations from nonequilibrium thermodynamics.",id:"google/ddpm-cifar10-32"},{description:"High-quality image generation model trained on the 256x256 CelebA-HQ dataset. It synthesizes images of faces using diffusion probabilistic models, a class of latent variable models inspired by considerations from nonequilibrium thermodynamics.",id:"google/ddpm-celebahq-256"}],spaces:[{description:"An application that can generate realistic faces.",id:"CompVis/celeba-latent-diffusion"}],summary:"Unconditional image generation is the task of generating images with no condition in any context (like a prompt text or another image). Once trained, the model will create images that resemble its training data distribution.",widgetModels:[""],youtubeId:""},yc={datasets:[{description:"Benchmark dataset used for video classification with videos that belong to 400 classes.",id:"kinetics400"}],demo:{inputs:[{filename:"video-classification-input.gif",type:"img"}],outputs:[{type:"chart",data:[{label:"Playing Guitar",score:.514},{label:"Playing Tennis",score:.193},{label:"Cooking",score:.068}]}]},metrics:[{description:"",id:"accuracy"},{description:"",id:"recall"},{description:"",id:"precision"},{description:"",id:"f1"}],models:[{description:"Strong Video Classification model trained on the Kinetics 400 dataset.",id:"google/vivit-b-16x2-kinetics400"},{description:"Strong Video Classification model trained on the Kinetics 400 dataset.",id:"microsoft/xclip-base-patch32"}],spaces:[{description:"An application that classifies video at different timestamps.",id:"nateraw/lavila"},{description:"An application that classifies video.",id:"fcakyon/video-classification"}],summary:"Video classification is the task of assigning a label or class to an entire video. Videos are expected to have only one class for each video. Video classification models take a video as input and return a prediction about which class the video belongs to.",widgetModels:[],youtubeId:""},bc={datasets:[{description:"A large dataset used to train visual document retrieval models.",id:"vidore/colpali_train_set"}],demo:{inputs:[{filename:"input.png",type:"img"},{label:"Question",content:"Is the model in this paper the fastest for inference?",type:"text"}],outputs:[{type:"chart",data:[{label:"Page 10",score:.7},{label:"Page 11",score:.06},{label:"Page 9",score:.003}]}]},isPlaceholder:!1,metrics:[{description:"NDCG@k scores ranked recommendation lists for top-k results. 0 is the worst, 1 is the best.",id:"Normalized Discounted Cumulative Gain at K"}],models:[{description:"Very accurate visual document retrieval model for multilingual queries and documents.",id:"vidore/colqwen2-v1.0"},{description:"Very fast and efficient visual document retrieval model that can also take in other modalities like audio.",id:"Tevatron/OmniEmbed-v0.1"}],spaces:[{description:"A leaderboard of visual document retrieval models.",id:"vidore/vidore-leaderboard"},{description:"Visual retrieval augmented generation demo based on ColQwen2 model.",id:"vidore/visual-rag-tool"}],summary:"Visual document retrieval is the task of searching for relevant image-based documents, such as PDFs. These models take a text query and multiple documents as input and return the top-most relevant documents and relevancy scores as output.",widgetModels:[""],youtubeId:""},vc={datasets:[{description:"A widely used dataset containing questions (with answers) about images.",id:"Graphcore/vqa"},{description:"A dataset to benchmark visual reasoning based on text in images.",id:"facebook/textvqa"}],demo:{inputs:[{filename:"elephant.jpeg",type:"img"},{label:"Question",content:"What is in this image?",type:"text"}],outputs:[{type:"chart",data:[{label:"elephant",score:.97},{label:"elephants",score:.06},{label:"animal",score:.003}]}]},isPlaceholder:!1,metrics:[{description:"",id:"accuracy"},{description:"Measures how much a predicted answer differs from the ground truth based on the difference in their semantic meaning.",id:"wu-palmer similarity"}],models:[{description:"A visual question answering model trained to convert charts and plots to text.",id:"google/deplot"},{description:"A visual question answering model trained for mathematical reasoning and chart derendering from images.",id:"google/matcha-base"},{description:"A strong visual question answering that answers questions from book covers.",id:"google/pix2struct-ocrvqa-large"}],spaces:[{description:"An application that compares visual question answering models across different tasks.",id:"merve/pix2struct"},{description:"An application that can answer questions based on images.",id:"nielsr/vilt-vqa"},{description:"An application that can caption images and answer questions about a given image. ",id:"Salesforce/BLIP"},{description:"An application that can caption images and answer questions about a given image. ",id:"vumichien/Img2Prompt"}],summary:"Visual Question Answering is the task of answering open-ended questions based on an image. They output natural language responses to natural language questions.",widgetModels:["dandelin/vilt-b32-finetuned-vqa"],youtubeId:""},wc={datasets:[{description:"A widely used dataset used to benchmark multiple variants of text classification.",id:"nyu-mll/glue"},{description:"The Multi-Genre Natural Language Inference (MultiNLI) corpus is a crowd-sourced collection of 433k sentence pairs annotated with textual entailment information.",id:"nyu-mll/multi_nli"},{description:"FEVER is a publicly available dataset for fact extraction and verification against textual sources.",id:"fever/fever"}],demo:{inputs:[{label:"Text Input",content:"Dune is the best movie ever.",type:"text"},{label:"Candidate Labels",content:"CINEMA, ART, MUSIC",type:"text"}],outputs:[{type:"chart",data:[{label:"CINEMA",score:.9},{label:"ART",score:.1},{label:"MUSIC",score:0}]}]},metrics:[],models:[{description:"Powerful zero-shot text classification model.",id:"facebook/bart-large-mnli"},{description:"Cutting-edge zero-shot multilingual text classification model.",id:"MoritzLaurer/ModernBERT-large-zeroshot-v2.0"},{description:"Zero-shot text classification model that can be used for topic and sentiment classification.",id:"knowledgator/gliclass-modern-base-v2.0-init"}],spaces:[],summary:"Zero-shot text classification is a task in natural language processing where a model is trained on a set of labeled examples but is then able to classify new examples from previously unseen classes.",widgetModels:["facebook/bart-large-mnli"]},xc={datasets:[{description:"",id:""}],demo:{inputs:[{filename:"image-classification-input.jpeg",type:"img"},{label:"Classes",content:"cat, dog, bird",type:"text"}],outputs:[{type:"chart",data:[{label:"Cat",score:.664},{label:"Dog",score:.329},{label:"Bird",score:.008}]}]},metrics:[{description:"Computes the number of times the correct label appears in top K labels predicted",id:"top-K accuracy"}],models:[{description:"Multilingual image classification model for 80 languages.",id:"visheratin/mexma-siglip"},{description:"Strong zero-shot image classification model.",id:"google/siglip2-base-patch16-224"},{description:"Robust zero-shot image classification model.",id:"intfloat/mmE5-mllama-11b-instruct"},{description:"Powerful zero-shot image classification model supporting 94 languages.",id:"jinaai/jina-clip-v2"},{description:"Strong image classification model for biomedical domain.",id:"microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224"}],spaces:[{description:"An application that leverages zero-shot image classification to find best captions to generate an image. ",id:"pharma/CLIP-Interrogator"},{description:"An application to compare different zero-shot image classification models. ",id:"merve/compare_clip_siglip"}],summary:"Zero-shot image classification is the task of classifying previously unseen classes during training of a model.",widgetModels:["google/siglip-so400m-patch14-224"],youtubeId:""},_c={datasets:[],demo:{inputs:[{filename:"zero-shot-object-detection-input.jpg",type:"img"},{label:"Classes",content:"cat, dog, bird",type:"text"}],outputs:[{filename:"zero-shot-object-detection-output.jpg",type:"img"}]},metrics:[{description:"The Average Precision (AP) metric is the Area Under the PR Curve (AUC-PR). It is calculated for each class separately",id:"Average Precision"},{description:"The Mean Average Precision (mAP) metric is the overall average of the AP values",id:"Mean Average Precision"},{description:"The APα metric is the Average Precision at the IoU threshold of a α value, for example, AP50 and AP75",id:"APα"}],models:[{description:"Solid zero-shot object detection model.",id:"openmmlab-community/mm_grounding_dino_large_all"},{description:"Cutting-edge zero-shot object detection model.",id:"fushh7/LLMDet"}],spaces:[{description:"A demo to compare different zero-shot object detection models per output and latency.",id:"ariG23498/zero-shot-od"},{description:"A demo that combines a zero-shot object detection and mask generation model for zero-shot segmentation.",id:"merve/OWLSAM"}],summary:"Zero-shot object detection is a computer vision task to detect objects and their classes in images, without any prior training or knowledge of the classes. Zero-shot object detection models receive an image as input, as well as a list of candidate classes, and output the bounding boxes and labels where the objects have been detected.",widgetModels:[],youtubeId:""},kc={datasets:[{description:"A large dataset of over 10 million 3D objects.",id:"allenai/objaverse-xl"},{description:"A dataset of isolated object images for evaluating image-to-3D models.",id:"dylanebert/iso3d"}],demo:{inputs:[{filename:"image-to-3d-image-input.png",type:"img"}],outputs:[{label:"Result",content:"image-to-3d-3d-output-filename.glb",type:"text"}]},metrics:[],models:[{description:"Fast image-to-3D mesh model by Tencent.",id:"TencentARC/InstantMesh"},{description:"3D world generation model.",id:"tencent/HunyuanWorld-1"},{description:"A scaled up image-to-3D mesh model derived from TripoSR.",id:"hwjiang/Real3D"},{description:"Consistent image-to-3d generation model.",id:"stabilityai/stable-point-aware-3d"}],spaces:[{description:"Leaderboard to evaluate image-to-3D models.",id:"dylanebert/3d-arena"},{description:"Image-to-3D demo with mesh outputs.",id:"TencentARC/InstantMesh"},{description:"Image-to-3D demo.",id:"stabilityai/stable-point-aware-3d"},{description:"Image-to-3D demo with mesh outputs.",id:"hwjiang/Real3D"},{description:"Image-to-3D demo with splat outputs.",id:"dylanebert/LGM-mini"}],summary:"Image-to-3D models take in image input and produce 3D output.",widgetModels:[],youtubeId:""},Ac={datasets:[{description:"A large dataset of over 10 million 3D objects.",id:"allenai/objaverse-xl"},{description:"Descriptive captions for 3D objects in Objaverse.",id:"tiange/Cap3D"}],demo:{inputs:[{label:"Prompt",content:"a cat statue",type:"text"}],outputs:[{label:"Result",content:"text-to-3d-3d-output-filename.glb",type:"text"}]},metrics:[],models:[{description:"Text-to-3D mesh model by OpenAI",id:"openai/shap-e"},{description:"Generative 3D gaussian splatting model.",id:"ashawkey/LGM"}],spaces:[{description:"Text-to-3D demo with mesh outputs.",id:"hysts/Shap-E"},{description:"Text/image-to-3D demo with splat outputs.",id:"ashawkey/LGM"}],summary:"Text-to-3D models take in text input and produce 3D output.",widgetModels:[],youtubeId:""},Sc={datasets:[{description:"A dataset of hand keypoints of over 500k examples.",id:"Vincent-luo/hagrid-mediapipe-hands"}],demo:{inputs:[{filename:"keypoint-detection-input.png",type:"img"}],outputs:[{filename:"keypoint-detection-output.png",type:"img"}]},metrics:[],models:[{description:"A robust keypoint detection model.",id:"magic-leap-community/superpoint"},{description:"A robust keypoint matching model.",id:"magic-leap-community/superglue_outdoor"},{description:"Strong keypoint detection model used to detect human pose.",id:"qualcomm/RTMPose-Body2d"},{description:"Powerful keypoint matching model.",id:"ETH-CVG/lightglue_disk"}],spaces:[{description:"An application that detects hand keypoints in real-time.",id:"datasciencedojo/Hand-Keypoint-Detection-Realtime"},{description:"An application for keypoint detection and matching.",id:"ETH-CVG/LightGlue"}],summary:"Keypoint detection is the task of identifying meaningful distinctive points or features in an image.",widgetModels:[],youtubeId:""},Tc={datasets:[{description:"Multiple-choice questions and answers about videos.",id:"lmms-lab/Video-MME"},{description:"A dataset of instructions and question-answer pairs about videos.",id:"lmms-lab/VideoChatGPT"},{description:"Large video understanding dataset.",id:"HuggingFaceFV/finevideo"}],demo:{inputs:[{filename:"video-text-to-text-input.gif",type:"img"},{label:"Text Prompt",content:"What is happening in this video?",type:"text"}],outputs:[{label:"Answer",content:"The video shows a series of images showing a fountain with water jets and a variety of colorful flowers and butterflies in the background.",type:"text"}]},metrics:[],models:[{description:"A robust video-text-to-text model.",id:"Vision-CAIR/LongVU_Qwen2_7B"},{description:"Strong video-text-to-text model with reasoning capabilities.",id:"GoodiesHere/Apollo-LMMs-Apollo-7B-t32"},{description:"Strong video-text-to-text model.",id:"HuggingFaceTB/SmolVLM2-2.2B-Instruct"}],spaces:[{description:"An application to chat with a video-text-to-text model.",id:"llava-hf/video-llava"},{description:"A leaderboard for various video-text-to-text models.",id:"opencompass/openvlm_video_leaderboard"},{description:"An application to generate highlights from a video.",id:"HuggingFaceTB/SmolVLM2-HighlightGenerator"}],summary:"Video-text-to-text models take in a video and a text prompt and output text. These models are also called video-language models.",widgetModels:[""],youtubeId:""},Ic={datasets:[{description:"Dataset with detailed annotations for training and benchmarking video instance editing.",id:"suimu/VIRESET"},{description:"Dataset to evaluate models on long video generation and understanding.",id:"zhangsh2001/LongV-EVAL"},{description:"Collection of 104 demo videos from the SeedVR/SeedVR2 series showcasing model outputs.",id:"Iceclear/SeedVR_VideoDemos"}],demo:{inputs:[{filename:"input.gif",type:"img"}],outputs:[{filename:"output.gif",type:"img"}]},metrics:[],models:[{description:"Model for editing outfits, character, and scenery in videos.",id:"decart-ai/Lucy-Edit-Dev"},{description:"Framework that uses 3D mesh proxies for precise, consistent video editing.",id:"LeoLau/Shape-for-Motion"},{description:"Model for generating physics-aware videos from input videos and control conditions.",id:"nvidia/Cosmos-Transfer2.5-2B"},{description:"A model to upscale videos at input, designed for seamless use with ComfyUI.",id:"numz/SeedVR2_comfyUI"}],spaces:[{description:"Interactive demo space for Lucy-Edit-Dev video editing.",id:"decart-ai/lucy-edit-dev"},{description:"Demo space for SeedVR2-3B showcasing video upscaling and restoration.",id:"ByteDance-Seed/SeedVR2-3B"}],summary:"Video-to-video models take one or more videos as input and generate new videos as output. They can enhance quality, interpolate frames, modify styles, or create new motion dynamics, enabling creative applications, video production, and research.",widgetModels:[],youtubeId:""},Ec={"audio-classification":["speechbrain","transformers","transformers.js"],"audio-to-audio":["asteroid","fairseq","speechbrain"],"automatic-speech-recognition":["espnet","nemo","speechbrain","transformers","transformers.js"],"audio-text-to-text":["transformers"],"depth-estimation":["transformers","transformers.js"],"document-question-answering":["transformers","transformers.js"],"feature-extraction":["sentence-transformers","transformers","transformers.js"],"fill-mask":["transformers","transformers.js"],"graph-ml":["transformers"],"image-classification":["keras","timm","transformers","transformers.js"],"image-feature-extraction":["timm","transformers"],"image-segmentation":["transformers","transformers.js"],"image-text-to-text":["transformers"],"image-text-to-image":["diffusers"],"image-text-to-video":["diffusers"],"image-to-image":["diffusers","transformers","transformers.js"],"image-to-text":["transformers","transformers.js"],"image-to-video":["diffusers"],"keypoint-detection":["transformers"],"video-classification":["transformers"],"mask-generation":["transformers"],"multiple-choice":["transformers"],"object-detection":["transformers","transformers.js","ultralytics"],other:[],"question-answering":["adapter-transformers","allennlp","transformers","transformers.js"],robotics:[],"reinforcement-learning":["transformers","stable-baselines3","ml-agents","sample-factory"],"sentence-similarity":["sentence-transformers","spacy","transformers.js"],summarization:["transformers","transformers.js"],"table-question-answering":["transformers"],"table-to-text":["transformers"],"tabular-classification":["sklearn"],"tabular-regression":["sklearn"],"tabular-to-text":["transformers"],"text-classification":["adapter-transformers","setfit","spacy","transformers","transformers.js"],"text-generation":["transformers","transformers.js"],"text-ranking":["sentence-transformers","transformers"],"text-retrieval":[],"text-to-image":["diffusers"],"text-to-speech":["espnet","tensorflowtts","transformers","transformers.js"],"text-to-audio":["transformers","transformers.js"],"text-to-video":["diffusers"],"time-series-forecasting":[],"token-classification":["adapter-transformers","flair","spacy","span-marker","stanza","transformers","transformers.js"],translation:["transformers","transformers.js"],"unconditional-image-generation":["diffusers"],"video-text-to-text":["transformers"],"visual-question-answering":["transformers","transformers.js"],"voice-activity-detection":[],"zero-shot-classification":["transformers","transformers.js"],"zero-shot-image-classification":["transformers","transformers.js"],"zero-shot-object-detection":["transformers","transformers.js"],"text-to-3d":["diffusers"],"image-to-3d":["diffusers"],"any-to-any":["transformers"],"visual-document-retrieval":["transformers"],"video-to-video":["diffusers"]};function B(e,t=ec){return{...t,id:e,label:_n[e].name,libraries:Ec[e]}}B("any-to-any",Ul),B("audio-classification",Ml),B("audio-to-audio",Dl),B("audio-text-to-text",Nl),B("automatic-speech-recognition",jl),B("depth-estimation",Gl),B("document-question-answering",Ol),B("visual-document-retrieval",bc),B("feature-extraction",Bl),B("fill-mask",ql),B("image-classification",Fl),B("image-feature-extraction",Hl),B("image-segmentation",Ql),B("image-to-image",Vl),B("image-text-to-text",Kl),B("image-text-to-image",Wl),B("image-text-to-video",Xl),B("image-to-text",zl),B("image-to-video",Jl),B("keypoint-detection",Sc),B("mask-generation",Yl),B("object-detection",Zl),B("video-classification",yc),B("question-answering",nc),B("reinforcement-learning",tc),B("sentence-similarity",ac),B("summarization",oc),B("table-question-answering",ic),B("tabular-classification",sc),B("tabular-regression",rc),B("text-classification",uc),B("text-generation",mc),B("text-ranking",fc),B("text-to-image",lc),B("text-to-speech",cc),B("text-to-video",hc),B("token-classification",dc),B("translation",pc),B("unconditional-image-generation",gc),B("video-text-to-text",Tc),B("video-to-video",Ic),B("visual-question-answering",vc),B("zero-shot-classification",wc),B("zero-shot-image-classification",xc),B("zero-shot-object-detection",_c),B("text-to-3d",Ac),B("image-to-3d",kc);const Lc=()=>'"Hi, I recently bought a device from your company but it is not working as advertised and I would like to get reimbursed!"',Pc=()=>'"Меня зовут Вольфганг и я живу в Берлине"',$c=()=>'"The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest man-made structure in the world, a title it held for 41 years until the Chrysler Building in New York City was finished in 1930. It was the first structure to reach a height of 300 metres. Due to the addition of a broadcasting aerial at the top of the tower in 1957, it is now taller than the Chrysler Building by 5.2 metres (17 ft). Excluding transmitters, the Eiffel Tower is the second tallest free-standing structure in France after the Millau Viaduct."',Cc=()=>`{
    "query": "How many stars does the transformers repository have?",
    "table": {
        "Repository": ["Transformers", "Datasets", "Tokenizers"],
        "Stars": ["36542", "4512", "3934"],
        "Contributors": ["651", "77", "34"],
        "Programming language": [
            "Python",
            "Python",
            "Rust, Python and NodeJS"
        ]
    }
}`,Rc=()=>`{
        "image": "cat.png",
        "question": "What is in this image?"
    }`,Uc=()=>`{
    "question": "What is my name?",
    "context": "My name is Clara and I live in Berkeley."
}`,Mc=()=>'"I like you. I love you"',Nc=()=>'"My name is Sarah Jessica Parker but you can call me Jessica"',oa=e=>e.tags.includes("conversational")?e.pipeline_tag==="text-generation"?[{role:"user",content:"What is the capital of France?"}]:[{role:"user",content:[{type:"text",text:"Describe this image in one sentence."},{type:"image_url",image_url:{url:"https://cdn.britannica.com/61/93061-050-99147DCE/Statue-of-Liberty-Island-New-York-Bay.jpg"}}]}]:'"Can you please let us know more details about your "',Dc=e=>`"The answer to the universe is ${e.mask_token}."`,jc=()=>`{
    "source_sentence": "That is a happy person",
    "sentences": [
        "That is a happy dog",
        "That is a very happy person",
        "Today is a sunny day"
    ]
}`,Oc=()=>'"Today is a sunny day and I will get some ice cream."',Bc=()=>'"cats.jpg"',qc=()=>'"cats.jpg"',Fc=()=>`{
    "image": "cat.png",
    "prompt": "Turn the cat into a tiger."
}`,Hc=()=>`{
    "image": "cat.png",
    "prompt": "The cat starts to dance"
}`,Vc=()=>`{
    "image": "cat.png",
    "prompt": "Turn the cat into a tiger."
}`,zc=()=>`{
    "image": "cat.png",
    "prompt": "The cat starts to dance"
}`,Kc=()=>'"cats.jpg"',Wc=()=>'"cats.jpg"',Xc=()=>'"sample1.flac"',Qc=()=>'"sample1.flac"',Jc=()=>'"Astronaut riding a horse"',Yc=()=>'"A young man walking on the street"',Zc=()=>'"The answer to the universe is 42"',Gc=()=>'"liquid drum and bass, atmospheric synths, airy sounds"',ed=()=>'"sample1.flac"',ia=()=>`'{"Height":[11.52,12.48],"Length1":[23.2,24.0],"Length2":[25.4,26.3],"Species": ["Bream","Bream"]}'`,td=()=>'"cats.jpg"',nd={"audio-to-audio":Xc,"audio-classification":Qc,"automatic-speech-recognition":ed,"document-question-answering":Rc,"feature-extraction":Oc,"fill-mask":Dc,"image-classification":Bc,"image-to-text":qc,"image-to-image":Fc,"image-to-video":Hc,"image-text-to-image":Vc,"image-text-to-video":zc,"image-segmentation":Kc,"object-detection":Wc,"question-answering":Uc,"sentence-similarity":jc,summarization:$c,"table-question-answering":Cc,"tabular-regression":ia,"tabular-classification":ia,"text-classification":Mc,"text-generation":oa,"image-text-to-text":oa,"text-to-image":Jc,"text-to-video":Yc,"text-to-speech":Zc,"text-to-audio":Gc,"token-classification":Nc,translation:Pc,"zero-shot-classification":Lc,"zero-shot-image-classification":td};function ad(e,t=!1,n=!1){if(e.pipeline_tag){const a=nd[e.pipeline_tag];if(a){let o=a(e);if(typeof o=="string"&&(t&&(o=o.replace(/(?:(?:\r?\n|\r)\t*)|\t+/g," ")),n)){const i=/^"(.+)"$/s,s=o.match(i);o=s?s[1]:o}return o}}return"No input example has been defined for this model task."}function od(e,t){let n=JSON.stringify(e,null,"	");return t!=null&&t.indent&&(n=n.replaceAll(`
`,`
${t.indent}`)),t!=null&&t.attributeKeyQuotes||(n=n.replace(/"([^"]+)":/g,"$1:")),t!=null&&t.customContentEscaper&&(n=t.customContentEscaper(n)),n}const Ha="custom_code";function qe(e){const t=e.split("/");return t.length===1?t[0]:t[1]}const id=e=>JSON.stringify(e).slice(1,-1),sd=e=>{var t,n;return[`from adapters import AutoAdapterModel

model = AutoAdapterModel.from_pretrained("${(n=(t=e.config)==null?void 0:t.adapter_transformers)==null?void 0:n.model_name}")
model.load_adapter("${e.id}", set_active=True)`]},rd=e=>[`import allennlp_models
from allennlp.predictors.predictor import Predictor

predictor = Predictor.from_path("hf://${e.id}")`],ld=e=>[`import allennlp_models
from allennlp.predictors.predictor import Predictor

predictor = Predictor.from_path("hf://${e.id}")
predictor_input = {"passage": "My name is Wolfgang and I live in Berlin", "question": "Where do I live?"}
predictions = predictor.predict_json(predictor_input)`],cd=e=>e.tags.includes("question-answering")?ld(e):rd(e),dd=e=>[`from araclip import AraClip

model = AraClip.from_pretrained("${e.id}")`],pd=e=>[`from asteroid.models import BaseModel

model = BaseModel.from_pretrained("${e.id}")`],ud=e=>{const t=`# Watermark Generator
from audioseal import AudioSeal

model = AudioSeal.load_generator("${e.id}")
# pass a tensor (tensor_wav) of shape (batch, channels, samples) and a sample rate
wav, sr = tensor_wav, 16000

watermark = model.get_watermark(wav, sr)
watermarked_audio = wav + watermark`,n=`# Watermark Detector
from audioseal import AudioSeal

detector = AudioSeal.load_detector("${e.id}")

result, message = detector.detect_watermark(watermarked_audio, sr)`;return[t,n]};function ct(e){var t,n;return((n=(t=e.cardData)==null?void 0:t.base_model)==null?void 0:n.toString())??"fill-in-base-model"}function et(e){var n,a,o;const t=((a=(n=e.widgetData)==null?void 0:n[0])==null?void 0:a.text)??((o=e.cardData)==null?void 0:o.instance_prompt);if(t)return id(t)}const md=e=>[`import requests
from PIL import Image
from ben2 import AutoModel

url = "https://huggingface.co/datasets/mishig/sample_images/resolve/main/teapot.jpg"
image = Image.open(requests.get(url, stream=True).raw)

model = AutoModel.from_pretrained("${e.id}")
model.to("cuda").eval()
foreground = model.inference(image)
`],fd=e=>[`from bertopic import BERTopic

model = BERTopic.load("${e.id}")`],hd=e=>[`from bm25s.hf import BM25HF

retriever = BM25HF.load_from_hub("${e.id}")`],gd=()=>[`# pip install chatterbox-tts
import torchaudio as ta
from chatterbox.tts import ChatterboxTTS

model = ChatterboxTTS.from_pretrained(device="cuda")

text = "Ezreal and Jinx teamed up with Ahri, Yasuo, and Teemo to take down the enemy's Nexus in an epic late-game pentakill."
wav = model.generate(text)
ta.save("test-1.wav", wav, model.sr)

# If you want to synthesize with a different voice, specify the audio prompt
AUDIO_PROMPT_PATH="YOUR_FILE.wav"
wav = model.generate(text, audio_prompt_path=AUDIO_PROMPT_PATH)
ta.save("test-2.wav", wav, model.sr)`],yd=e=>{const t="pip install chronos-forecasting",n=`import pandas as pd
from chronos import BaseChronosPipeline

pipeline = BaseChronosPipeline.from_pretrained("${e.id}", device_map="cuda")

# Load historical data
context_df = pd.read_csv("https://autogluon.s3.us-west-2.amazonaws.com/datasets/timeseries/misc/AirPassengers.csv")

# Generate predictions
pred_df = pipeline.predict_df(
    context_df,
    prediction_length=36,  # Number of steps to forecast
    quantile_levels=[0.1, 0.5, 0.9],  # Quantiles for probabilistic forecast
    id_column="item_id",  # Column identifying different time series
    timestamp_column="Month",  # Column with datetime information
    target="#Passengers",  # Column(s) with time series values to predict
)`;return[t,n]},bd=e=>["pip install git+https://github.com/HanClinto/CollectorVision huggingface_hub",`from huggingface_hub import hf_hub_download
import collector_vision as cvg

checkpoint = hf_hub_download(repo_id="${e.id}", filename="model.onnx")

# Detector models, such as Cornelius:
detector = cvg.NeuralCornerDetector(checkpoint)

# Embedder models, such as Milo:
embedder = cvg.NeuralEmbedder(checkpoint)`],vd=e=>{const t="pip install colipri",n=`from colipri import get_model
from colipri import get_processor
from colipri import load_sample_ct
from colipri import ZeroShotImageClassificationPipeline

model = get_model().cuda()
processor = get_processor()
pipeline = ZeroShotImageClassificationPipeline("${e.id}", processor)

image = load_sample_ct()

pipeline(image, ["No lung nodules", "Lung nodules"])
`;return[t,n]},wd=()=>["pip install git+https://github.com/SAP-samples/sap-rpt-1-oss",`# Run a classification task
from sklearn.datasets import load_breast_cancer
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

from sap_rpt_oss import SAP_RPT_OSS_Classifier

# Load sample data
X, y = load_breast_cancer(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.5, random_state=42)

# Initialize a classifier, 8k context and 8-fold bagging gives best performance, reduce if running out of memory
clf = SAP_RPT_OSS_Classifier(max_context_size=8192, bagging=8)

clf.fit(X_train, y_train)

# Predict probabilities
prediction_probabilities = clf.predict_proba(X_test)
# Predict labels
predictions = clf.predict(X_test)
print("Accuracy", accuracy_score(y_test, predictions))`,`# Run a regression task
from sklearn.datasets import fetch_openml
from sklearn.metrics import r2_score
from sklearn.model_selection import train_test_split

from sap_rpt_oss import SAP_RPT_OSS_Regressor

# Load sample data
df = fetch_openml(data_id=531, as_frame=True)
X = df.data
y = df.target.astype(float)

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.5, random_state=42)

# Initialize the regressor, 8k context and 8-fold bagging gives best performance, reduce if running out of memory
regressor = SAP_RPT_OSS_Regressor(max_context_size=8192, bagging=8)

regressor.fit(X_train, y_train)

# Predict on the test set
predictions = regressor.predict(X_test)

r2 = r2_score(y_test, predictions)
print("R² Score:", r2)`],xd=()=>[`# pip install git+https://github.com/Google-Health/cxr-foundation.git#subdirectory=python

# Load image as grayscale (Stillwaterising, CC0, via Wikimedia Commons)
import requests
from PIL import Image
from io import BytesIO
image_url = "https://upload.wikimedia.org/wikipedia/commons/c/c8/Chest_Xray_PA_3-8-2010.png"
img = Image.open(requests.get(image_url, headers={'User-Agent': 'Demo'}, stream=True).raw).convert('L')

# Run inference
from clientside.clients import make_hugging_face_client
cxr_client = make_hugging_face_client('cxr_model')
print(cxr_client.get_image_embeddings_from_images([img]))`],_d=e=>{let t,n,a;return t="<ENCODER>",n="<NUMBER_OF_FEATURES>",a="<OUT_CHANNELS>",e.id==="depth-anything/Depth-Anything-V2-Small"?(t="vits",n="64",a="[48, 96, 192, 384]"):e.id==="depth-anything/Depth-Anything-V2-Base"?(t="vitb",n="128",a="[96, 192, 384, 768]"):e.id==="depth-anything/Depth-Anything-V2-Large"&&(t="vitl",n="256",a="[256, 512, 1024, 1024"),[`
# Install from https://github.com/DepthAnything/Depth-Anything-V2

# Load the model and infer depth from an image
import cv2
import torch

from depth_anything_v2.dpt import DepthAnythingV2

# instantiate the model
model = DepthAnythingV2(encoder="${t}", features=${n}, out_channels=${a})

# load the weights
filepath = hf_hub_download(repo_id="${e.id}", filename="depth_anything_v2_${t}.pth", repo_type="model")
state_dict = torch.load(filepath, map_location="cpu")
model.load_state_dict(state_dict).eval()

raw_img = cv2.imread("your/image/path")
depth = model.infer_image(raw_img) # HxW raw depth map in numpy
    `]},kd=e=>[`# Download checkpoint
pip install huggingface-hub
huggingface-cli download --local-dir checkpoints ${e.id}`,`import depth_pro

# Load model and preprocessing transform
model, transform = depth_pro.create_model_and_transforms()
model.eval()

# Load and preprocess an image.
image, _, f_px = depth_pro.load_rgb("example.png")
image = transform(image)

# Run inference.
prediction = model.infer(image, f_px=f_px)

# Results: 1. Depth in meters
depth = prediction["depth"]
# Results: 2. Focal length in pixels
focallength_px = prediction["focallength_px"]`],Ad=()=>[`from huggingface_hub import from_pretrained_keras
import tensorflow as tf, requests

# Load and format input
IMAGE_URL = "https://storage.googleapis.com/dx-scin-public-data/dataset/images/3445096909671059178.png"
input_tensor = tf.train.Example(
    features=tf.train.Features(
        feature={
            "image/encoded": tf.train.Feature(
                bytes_list=tf.train.BytesList(value=[requests.get(IMAGE_URL, stream=True).content])
            )
        }
    )
).SerializeToString()

# Load model and run inference
loaded_model = from_pretrained_keras("google/derm-foundation")
infer = loaded_model.signatures["serving_default"]
print(infer(inputs=tf.constant([input_tensor])))`],Sd=e=>[`import soundfile as sf
from dia.model import Dia

model = Dia.from_pretrained("${e.id}")
text = "[S1] Dia is an open weights text to dialogue model. [S2] You get full control over scripts and voices. [S1] Wow. Amazing. (laughs) [S2] Try it now on Git hub or Hugging Face."
output = model.generate(text)

sf.write("simple.mp3", output, 44100)`],Td=e=>[`from dia2 import Dia2, GenerationConfig, SamplingConfig

dia = Dia2.from_repo("${e.id}", device="cuda", dtype="bfloat16")
config = GenerationConfig(
    cfg_scale=2.0,
    audio=SamplingConfig(temperature=0.8, top_k=50),
    use_cuda_graph=True,
)
result = dia.generate("[S1] Hello Dia2!", config=config, output_wav="hello.wav", verbose=True)
`],Id=e=>[`# pip install git+https://github.com/NVlabs/describe-anything
from huggingface_hub import snapshot_download
from dam import DescribeAnythingModel

snapshot_download(${e.id}, local_dir="checkpoints")

dam = DescribeAnythingModel(
	model_path="checkpoints",
	conv_mode="v1",
	prompt_mode="focal_prompt",
)`],Ed="pip install -U diffusers transformers accelerate",Va="Astronaut in a jungle, cold color palette, muted colors, detailed, 8k",za="Turn this cat into a dog",kn="A man with short gray hair plays a red electric guitar.",Ld=e=>[`import torch
from diffusers import DiffusionPipeline

# switch to "mps" for apple devices
pipe = DiffusionPipeline.from_pretrained("${e.id}", dtype=torch.bfloat16, device_map="cuda")

prompt = "${et(e)??Va}"
image = pipe(prompt).images[0]`],Pd=e=>[`import torch
from diffusers import DiffusionPipeline
from diffusers.utils import load_image

# switch to "mps" for apple devices
pipe = DiffusionPipeline.from_pretrained("${e.id}", dtype=torch.bfloat16, device_map="cuda")

prompt = "${et(e)??za}"
input_image = load_image("https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/cat.png")

image = pipe(image=input_image, prompt=prompt).images[0]`],$d=e=>[`import torch
from diffusers import DiffusionPipeline
from diffusers.utils import load_image, export_to_video

# switch to "mps" for apple devices
pipe = DiffusionPipeline.from_pretrained("${e.id}", dtype=torch.bfloat16, device_map="cuda")
pipe.to("cuda")

prompt = "${et(e)??kn}"
image = load_image(
    "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/guitar-man.png"
)

output = pipe(image=image, prompt=prompt).frames[0]
export_to_video(output, "output.mp4")`],Cd=e=>[`from diffusers import ControlNetModel, StableDiffusionControlNetPipeline

controlnet = ControlNetModel.from_pretrained("${e.id}")
pipe = StableDiffusionControlNetPipeline.from_pretrained(
	"${ct(e)}", controlnet=controlnet
)`],Rd=e=>[`import torch
from diffusers import DiffusionPipeline

# switch to "mps" for apple devices
pipe = DiffusionPipeline.from_pretrained("${ct(e)}", dtype=torch.bfloat16, device_map="cuda")
pipe.load_lora_weights("${e.id}")

prompt = "${et(e)??Va}"
image = pipe(prompt).images[0]`],Ud=e=>[`import torch
from diffusers import DiffusionPipeline
from diffusers.utils import load_image

# switch to "mps" for apple devices
pipe = DiffusionPipeline.from_pretrained("${ct(e)}", dtype=torch.bfloat16, device_map="cuda")
pipe.load_lora_weights("${e.id}")

prompt = "${et(e)??za}"
input_image = load_image("https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/cat.png")

image = pipe(image=input_image, prompt=prompt).images[0]`],Md=e=>[`import torch
from diffusers import DiffusionPipeline
from diffusers.utils import export_to_video

# switch to "mps" for apple devices
pipe = DiffusionPipeline.from_pretrained("${ct(e)}", dtype=torch.bfloat16, device_map="cuda")
pipe.load_lora_weights("${e.id}")

prompt = "${et(e)??kn}"

output = pipe(prompt=prompt).frames[0]
export_to_video(output, "output.mp4")`],Nd=e=>[`import torch
from diffusers import DiffusionPipeline
from diffusers.utils import load_image, export_to_video

# switch to "mps" for apple devices
pipe = DiffusionPipeline.from_pretrained("${ct(e)}", dtype=torch.bfloat16, device_map="cuda")
pipe.load_lora_weights("${e.id}")

prompt = "${et(e)??kn}"
input_image = load_image("https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/diffusers/guitar-man.png")

image = pipe(image=input_image, prompt=prompt).frames[0]
export_to_video(output, "output.mp4")`],Dd=e=>[`import torch
from diffusers import DiffusionPipeline

# switch to "mps" for apple devices
pipe = DiffusionPipeline.from_pretrained("${ct(e)}", dtype=torch.bfloat16, device_map="cuda")
pipe.load_textual_inversion("${e.id}")`],jd=e=>[`import torch
from diffusers import FluxFillPipeline
from diffusers.utils import load_image

image = load_image("https://huggingface.co/datasets/diffusers/diffusers-images-docs/resolve/main/cup.png")
mask = load_image("https://huggingface.co/datasets/diffusers/diffusers-images-docs/resolve/main/cup_mask.png")

# switch to "mps" for apple devices
pipe = FluxFillPipeline.from_pretrained("${e.id}", dtype=torch.bfloat16, device_map="cuda")
image = pipe(
    prompt="a white paper cup",
    image=image,
    mask_image=mask,
    height=1632,
    width=1232,
    guidance_scale=30,
    num_inference_steps=50,
    max_sequence_length=512,
    generator=torch.Generator("cpu").manual_seed(0)
).images[0]
image.save(f"flux-fill-dev.png")`],Od=e=>[`import torch
from diffusers import AutoPipelineForInpainting
from diffusers.utils import load_image

# switch to "mps" for apple devices
pipe = AutoPipelineForInpainting.from_pretrained("${e.id}", dtype=torch.float16, variant="fp16", device_map="cuda")

img_url = "https://raw.githubusercontent.com/CompVis/latent-diffusion/main/data/inpainting_examples/overture-creations-5sI6fQgYIuo.png"
mask_url = "https://raw.githubusercontent.com/CompVis/latent-diffusion/main/data/inpainting_examples/overture-creations-5sI6fQgYIuo_mask.png"

image = load_image(img_url).resize((1024, 1024))
mask_image = load_image(mask_url).resize((1024, 1024))

prompt = "a tiger sitting on a park bench"
generator = torch.Generator(device="cuda").manual_seed(0)

image = pipe(
  prompt=prompt,
  image=image,
  mask_image=mask_image,
  guidance_scale=8.0,
  num_inference_steps=20,  # steps between 15 and 30 work well for us
  strength=0.99,  # make sure to use \`strength\` below 1.0
  generator=generator,
).images[0]`],Ka=e=>{let t;return e.tags.includes("StableDiffusionInpaintPipeline")||e.tags.includes("StableDiffusionXLInpaintPipeline")?t=Od(e):e.tags.includes("controlnet")?t=Cd(e):e.tags.includes("lora")?e.pipeline_tag==="image-to-image"?t=Ud(e):e.pipeline_tag==="image-to-video"?t=Nd(e):e.pipeline_tag==="text-to-video"?t=Md(e):t=Rd(e):e.tags.includes("textual_inversion")?t=Dd(e):e.tags.includes("FluxFillPipeline")?t=jd(e):e.pipeline_tag==="image-to-video"?t=$d(e):e.pipeline_tag==="image-to-image"?t=Pd(e):t=Ld(e),[Ed,...t]},Bd=e=>{const t=`# Pipeline for Stable Diffusion 3
from diffusionkit.mlx import DiffusionPipeline

pipeline = DiffusionPipeline(
	shift=3.0,
	use_t5=False,
	model_version=${e.id},
	low_memory_mode=True,
	a16=True,
	w16=True,
)`,n=`# Pipeline for Flux
from diffusionkit.mlx import FluxPipeline

pipeline = FluxPipeline(
  shift=1.0,
  model_version=${e.id},
  low_memory_mode=True,
  a16=True,
  w16=True,
)`,a=`# Image Generation
HEIGHT = 512
WIDTH = 512
NUM_STEPS = ${e.tags.includes("flux")?4:50}
CFG_WEIGHT = ${e.tags.includes("flux")?0:5}

image, _ = pipeline.generate_image(
  "a photo of a cat",
  cfg_weight=CFG_WEIGHT,
  num_steps=NUM_STEPS,
  latent_size=(HEIGHT // 8, WIDTH // 8),
)`;return[e.tags.includes("flux")?n:t,a]},qd=e=>[`# pip install --no-binary :all: cartesia-pytorch
from cartesia_pytorch import ReneLMHeadModel
from transformers import AutoTokenizer

model = ReneLMHeadModel.from_pretrained("${e.id}")
tokenizer = AutoTokenizer.from_pretrained("allenai/OLMo-1B-hf")

in_message = ["Rene Descartes was"]
inputs = tokenizer(in_message, return_tensors="pt")

outputs = model.generate(inputs.input_ids, max_length=50, top_k=100, top_p=0.99)
out_message = tokenizer.batch_decode(outputs, skip_special_tokens=True)[0]

print(out_message)
)`],Fd=e=>[`import mlx.core as mx
import cartesia_mlx as cmx

model = cmx.from_pretrained("${e.id}")
model.set_dtype(mx.float32)

prompt = "Rene Descartes was"

for text in model.generate(
    prompt,
    max_tokens=500,
    eval_every_n=5,
    verbose=True,
    top_p=0.99,
    temperature=0.85,
):
    print(text, end="", flush=True)
`],Hd=e=>{const t=qe(e.id).replaceAll("-","_");return[`# Load it from the Hub directly
import edsnlp
nlp = edsnlp.load("${e.id}")
`,`# Or install it as a package
!pip install git+https://huggingface.co/${e.id}

# and import it as a module
import ${t}

nlp = ${t}.load()  # or edsnlp.load("${t}")
`]},Vd=e=>[`from espnet2.bin.tts_inference import Text2Speech

model = Text2Speech.from_pretrained("${e.id}")

speech, *_ = model("text to generate speech from")`],zd=e=>[`from espnet2.bin.asr_inference import Speech2Text

model = Speech2Text.from_pretrained(
  "${e.id}"
)

speech, rate = soundfile.read("speech.wav")
text, *_ = model(speech)[0]`],Kd=()=>["unknown model type (must be text-to-speech or automatic-speech-recognition)"],Wd=e=>e.tags.includes("text-to-speech")?Vd(e):e.tags.includes("automatic-speech-recognition")?zd(e):Kd(),Xd=e=>[`from fairseq.checkpoint_utils import load_model_ensemble_and_task_from_hf_hub

models, cfg, task = load_model_ensemble_and_task_from_hf_hub(
    "${e.id}"
)`],Qd=e=>[`from flair.models import SequenceTagger

tagger = SequenceTagger.load("${e.id}")`],Jd=e=>[`from gliner import GLiNER

model = GLiNER.from_pretrained("${e.id}")`],Yd=e=>[`from gliner2 import GLiNER2

model = GLiNER2.from_pretrained("${e.id}")

# Extract entities
text = "Apple CEO Tim Cook announced iPhone 15 in Cupertino yesterday."
result = extractor.extract_entities(text, ["company", "person", "product", "location"])

print(result)`],Zd=e=>[`# Download model
from huggingface_hub import snapshot_download

snapshot_download(${e.id}, local_dir="checkpoints")

from indextts.infer import IndexTTS

# Ensure config.yaml is present in the checkpoints directory
tts = IndexTTS(model_dir="checkpoints", cfg_path="checkpoints/config.yaml")

voice = "path/to/your/reference_voice.wav"  # Path to the voice reference audio file
text = "Hello, how are you?"
output_path = "output_index.wav"

tts.infer(voice, text, output_path)`],Gd=e=>[`# CLI usage
# see docs: https://ai-riksarkivet.github.io/htrflow/latest/getting_started/quick_start.html
htrflow pipeline <path/to/pipeline.yaml> <path/to/image>`,`# Python usage
from htrflow.pipeline.pipeline import Pipeline
from htrflow.pipeline.steps import Task
from htrflow.models.framework.model import ModelClass

pipeline = Pipeline(
    [
        Task(
            ModelClass, {"model": "${e.id}"}, {}
        ),
    ])`],ep=e=>[`# Available backend options are: "jax", "torch", "tensorflow".
import os
os.environ["KERAS_BACKEND"] = "jax"

import keras

model = keras.saving.load_model("hf://${e.id}")
`],tp=e=>`
import keras_hub

# Load CausalLM model (optional: use half precision for inference)
causal_lm = keras_hub.models.CausalLM.from_preset("hf://${e}", dtype="bfloat16")
causal_lm.compile(sampler="greedy")  # (optional) specify a sampler

# Generate text
causal_lm.generate("Keras: deep learning for", max_length=64)
`,np=e=>`
import keras_hub

# Load TextToImage model (optional: use half precision for inference)
text_to_image = keras_hub.models.TextToImage.from_preset("hf://${e}", dtype="bfloat16")

# Generate images with a TextToImage model.
text_to_image.generate("Astronaut in a jungle")
`,ap=e=>`
import keras_hub

# Load TextClassifier model
text_classifier = keras_hub.models.TextClassifier.from_preset(
    "hf://${e}",
    num_classes=2,
)
# Fine-tune
text_classifier.fit(x=["Thilling adventure!", "Total snoozefest."], y=[1, 0])
# Classify text
text_classifier.predict(["Not my cup of tea."])
`,op=e=>`
import keras_hub
import keras

# Load ImageClassifier model
image_classifier = keras_hub.models.ImageClassifier.from_preset(
    "hf://${e}",
    num_classes=2,
)
# Fine-tune
image_classifier.fit(
    x=keras.random.randint((32, 64, 64, 3), 0, 256),
    y=keras.random.randint((32, 1), 0, 2),
)
# Classify image
image_classifier.predict(keras.random.randint((1, 64, 64, 3), 0, 256))
`,sa={CausalLM:tp,TextToImage:np,TextClassifier:ap,ImageClassifier:op},ip=(e,t)=>`
import keras_hub

# Create a ${e} model
task = keras_hub.models.${e}.from_preset("hf://${t}")
`,sp=e=>`
import keras_hub

# Create a Backbone model unspecialized for any task
backbone = keras_hub.models.Backbone.from_preset("hf://${e}")
`,rp=e=>{var o,i;const t=e.id,n=((i=(o=e.config)==null?void 0:o.keras_hub)==null?void 0:i.tasks)??[],a=[];for(const[s,r]of Object.entries(sa))n.includes(s)&&a.push(r(t));for(const s of n)Object.keys(sa).includes(s)||a.push(ip(s,t));return a.push(sp(t)),a},lp=e=>[`# !pip install kernels

from kernels import get_kernel

kernel = get_kernel("${e.id}")`],cp=e=>[`# Example usage for KimiAudio
# pip install git+https://github.com/MoonshotAI/Kimi-Audio.git

from kimia_infer.api.kimia import KimiAudio

model = KimiAudio(model_path="${e.id}", load_detokenizer=True)

sampling_params = {
    "audio_temperature": 0.8,
    "audio_top_k": 10,
    "text_temperature": 0.0,
    "text_top_k": 5,
}

# For ASR
asr_audio = "asr_example.wav"
messages_asr = [
    {"role": "user", "message_type": "text", "content": "Please transcribe the following audio:"},
    {"role": "user", "message_type": "audio", "content": asr_audio}
]
_, text = model.generate(messages_asr, **sampling_params, output_type="text")
print(text)

# For Q&A
qa_audio = "qa_example.wav"
messages_conv = [{"role": "user", "message_type": "audio", "content": qa_audio}]
wav, text = model.generate(messages_conv, **sampling_params, output_type="both")
sf.write("output_audio.wav", wav.cpu().view(-1).numpy(), 24000)
print(text)
`],dp=e=>[`from kittentts import KittenTTS
m = KittenTTS("${e.id}")

audio = m.generate("This high quality TTS model works without a GPU")

# Save the audio
import soundfile as sf
sf.write('output.wav', audio, 24000)`],pp=e=>e.tags.includes("bi-encoder")?[`#install from https://github.com/webis-de/lightning-ir

from lightning_ir import BiEncoderModule
model = BiEncoderModule("${e.id}")

model.score("query", ["doc1", "doc2", "doc3"])`]:e.tags.includes("cross-encoder")?[`#install from https://github.com/webis-de/lightning-ir

from lightning_ir import CrossEncoderModule
model = CrossEncoderModule("${e.id}")

model.score("query", ["doc1", "doc2", "doc3"])`]:[`#install from https://github.com/webis-de/lightning-ir

from lightning_ir import BiEncoderModule, CrossEncoderModule

# depending on the model type, use either BiEncoderModule or CrossEncoderModule
model = BiEncoderModule("${e.id}")
# model = CrossEncoderModule("${e.id}")

model.score("query", ["doc1", "doc2", "doc3"])`],up=e=>{const t=[`# !pip install llama-cpp-python

from llama_cpp import Llama

llm = Llama.from_pretrained(
	repo_id="${e.id}",
	filename="{{GGUF_FILE}}",
)
`];if(e.tags.includes("conversational")){const n=ad(e);t.push(`llm.create_chat_completion(
	messages = ${od(n,{attributeKeyQuotes:!0,indent:"	"})}
)`)}else t.push(`output = llm(
	"Once upon a time,",
	max_tokens=512,
	echo=True
)
print(output)`);return t},mp=e=>{if(e.tags.includes("smolvla")){const t=[`# See https://github.com/huggingface/lerobot?tab=readme-ov-file#installation for more details
git clone https://github.com/huggingface/lerobot.git
cd lerobot
pip install -e .[smolvla]`,`# Launch finetuning on your dataset
python lerobot/scripts/train.py \\
--policy.path=${e.id} \\
--dataset.repo_id=lerobot/svla_so101_pickplace \\
--batch_size=64 \\
--steps=20000 \\
--output_dir=outputs/train/my_smolvla \\
--job_name=my_smolvla_training \\
--policy.device=cuda \\
--wandb.enable=true`];return e.id!=="lerobot/smolvla_base"&&t.push(`# Run the policy using the record function
python -m lerobot.record \\
  --robot.type=so101_follower \\
  --robot.port=/dev/ttyACM0 \\ # <- Use your port
  --robot.id=my_blue_follower_arm \\ # <- Use your robot id
  --robot.cameras="{ front: {type: opencv, index_or_path: 8, width: 640, height: 480, fps: 30}}" \\ # <- Use your cameras
  --dataset.single_task="Grasp a lego block and put it in the bin." \\ # <- Use the same task description you used in your dataset recording
  --dataset.repo_id=HF_USER/dataset_name \\  # <- This will be the dataset name on HF Hub
  --dataset.episode_time_s=50 \\
  --dataset.num_episodes=10 \\
  --policy.path=${e.id}`),t}return[]},fp=e=>[`# Note: 'keras<3.x' or 'tf_keras' must be installed (legacy)
# See https://github.com/keras-team/tf-keras for more details.
from huggingface_hub import from_pretrained_keras

model = from_pretrained_keras("${e.id}")
`],hp=e=>[`from mamba_ssm import MambaLMHeadModel

model = MambaLMHeadModel.from_pretrained("${e.id}")`],gp=e=>[`# Install from https://github.com/Camb-ai/MARS5-TTS

from inference import Mars5TTS
mars5 = Mars5TTS.from_pretrained("${e.id}")`],yp=e=>[`# Install from https://github.com/pq-yang/MatAnyone.git

from matanyone.model.matanyone import MatAnyone
model = MatAnyone.from_pretrained("${e.id}")`,`
from matanyone import InferenceCore
processor = InferenceCore("${e.id}")`],bp=()=>[`# Install from https://github.com/buaacyw/MeshAnything.git

from MeshAnything.models.meshanything import MeshAnything

# refer to https://github.com/buaacyw/MeshAnything/blob/main/main.py#L91 on how to define args
# and https://github.com/buaacyw/MeshAnything/blob/main/app.py regarding usage
model = MeshAnything(args)`],vp=e=>{var s;const t=(s=e.widgetData)==null?void 0:s[0],n=t==null?void 0:t.text,a=e.mask_token??"<mask>",o=n==null?void 0:n.replace(a,"A"),i=["pip install multimolecule"];return o?i.push(`from multimolecule import AutoModel, AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("${e.id}")
model = AutoModel.from_pretrained("${e.id}")

inputs = tokenizer("${o}", return_tensors="pt")
outputs = model(**inputs)
embeddings = outputs.last_hidden_state`):i.push(`from multimolecule import AutoModel, AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("${e.id}")
model = AutoModel.from_pretrained("${e.id}")`),e.tags.includes("rna-secondary-structure")&&n?i.push(`import multimolecule
from transformers import pipeline

predictor = pipeline("rna-secondary-structure", model="${e.id}")
output = predictor("${n}")
print(output["secondary_structure"])`):e.pipeline_tag==="fill-mask"&&n&&i.push(`import multimolecule
from transformers import pipeline

predictor = pipeline("fill-mask", model="${e.id}")
output = predictor("${n}")`),i},wp=e=>[`import open_clip

model, preprocess_train, preprocess_val = open_clip.create_model_and_transforms('hf-hub:${e.id}')
tokenizer = open_clip.get_tokenizer('hf-hub:${e.id}')`],xp=e=>{var t,n;if((n=(t=e.config)==null?void 0:t.architectures)!=null&&n[0]){const a=e.config.architectures[0];return[[`from paddlenlp.transformers import AutoTokenizer, ${a}`,"",`tokenizer = AutoTokenizer.from_pretrained("${e.id}", from_hf_hub=True)`,`model = ${a}.from_pretrained("${e.id}", from_hf_hub=True)`].join(`
`)]}else return[["# ⚠️ Type of model unknown","from paddlenlp.transformers import AutoTokenizer, AutoModel","",`tokenizer = AutoTokenizer.from_pretrained("${e.id}", from_hf_hub=True)`,`model = AutoModel.from_pretrained("${e.id}", from_hf_hub=True)`].join(`
`)]},_p=e=>{const t={textline_detection:{className:"TextDetection"},textline_recognition:{className:"TextRecognition"},seal_text_detection:{className:"SealTextDetection"},doc_img_unwarping:{className:"TextImageUnwarping"},doc_img_orientation_classification:{className:"DocImgOrientationClassification"},textline_orientation_classification:{className:"TextLineOrientationClassification"},chart_parsing:{className:"ChartParsing"},formula_recognition:{className:"FormulaRecognition"},layout_detection:{className:"LayoutDetection"},table_cells_detection:{className:"TableCellsDetection"},wired_table_classification:{className:"TableClassification"},table_structure_recognition:{className:"TableStructureRecognition"}};if(e.tags.includes("doc_vlm"))return[`# 1. See https://www.paddlepaddle.org.cn/en/install to install paddlepaddle
# 2. pip install paddleocr

from paddleocr import DocVLM
model = DocVLM(model_name="${qe(e.id)}")
output = model.predict(
    input={"image": "path/to/image.png", "query": "Parsing this image and output the content in Markdown format."},
    batch_size=1
)
for res in output:
    res.print()
    res.save_to_json(save_path="./output/res.json")`];if(e.tags.includes("document-parse")){const n=e.id.replace("PaddlePaddle/PaddleOCR-VL-","v");return[`# See https://www.paddleocr.ai/latest/version3.x/pipeline_usage/PaddleOCR-VL.html to installation

from paddleocr import PaddleOCRVL
pipeline = PaddleOCRVL(pipeline_version="${n==="PaddlePaddle/PaddleOCR-VL"?"v1":n}")
output = pipeline.predict("path/to/document_image.png")
for res in output:
	res.print()
	res.save_to_json(save_path="output")
	res.save_to_markdown(save_path="output")`]}for(const n of e.tags)if(n in t){const{className:a}=t[n];return[`# 1. See https://www.paddlepaddle.org.cn/en/install to install paddlepaddle
# 2. pip install paddleocr

from paddleocr import ${a}
model = ${a}(model_name="${qe(e.id)}")
output = model.predict(input="path/to/image.png", batch_size=1)
for res in output:
    res.print()
    res.save_to_img(save_path="./output/")
    res.save_to_json(save_path="./output/res.json")`]}return[`# Please refer to the document for information on how to use the model.
# https://paddlepaddle.github.io/PaddleOCR/latest/en/version3.x/module_usage/module_overview.html`]},kp=e=>{const t=`# Use PE-Core models as CLIP models
import core.vision_encoder.pe as pe

model = pe.CLIP.from_config("${e.id}", pretrained=True)`,n=`# Use any PE model as a vision encoder
import core.vision_encoder.pe as pe

model = pe.VisionTransformer.from_config("${e.id}", pretrained=True)`;return e.id.includes("Core")?[t,n]:[n]},Ap=e=>[`from huggingface_hub import snapshot_download
from phantom_wan import WANI2V, configs

checkpoint_dir = snapshot_download("${e.id}")
wan_i2v = WanI2V(
            config=configs.WAN_CONFIGS['i2v-14B'],
            checkpoint_dir=checkpoint_dir,
        )
 video = wan_i2v.generate(text_prompt, image_prompt)`],Sp=e=>[`from pocket_tts import TTSModel
import scipy.io.wavfile

tts_model = TTSModel.load_model("${e.id}")
voice_state = tts_model.get_state_for_audio_prompt(
    "hf://kyutai/tts-voices/alba-mackenna/casual.wav"
)
audio = tts_model.generate_audio(voice_state, "Hello world, this is a test.")
# Audio is a 1D torch tensor containing PCM data.
scipy.io.wavfile.write("output.wav", tts_model.sample_rate, audio.numpy())`],Tp=e=>[`from pyannote.audio import Pipeline

pipeline = Pipeline.from_pretrained("${e.id}")

# inference on the whole file
pipeline("file.wav")

# inference on an excerpt
from pyannote.core import Segment
excerpt = Segment(start=2.0, end=5.0)

from pyannote.audio import Audio
waveform, sample_rate = Audio().crop("file.wav", excerpt)
pipeline({"waveform": waveform, "sample_rate": sample_rate})`],Ip=e=>[`from pyannote.audio import Model, Inference

model = Model.from_pretrained("${e.id}")
inference = Inference(model)

# inference on the whole file
inference("file.wav")

# inference on an excerpt
from pyannote.core import Segment
excerpt = Segment(start=2.0, end=5.0)
inference.crop("file.wav", excerpt)`],Ep=e=>e.tags.includes("pyannote-audio-pipeline")?Tp(e):Ip(e),Lp=e=>[`from relik import Relik

relik = Relik.from_pretrained("${e.id}")`],Pp=e=>[`# Install from https://github.com/microsoft/renderformer

from renderformer import RenderFormerRenderingPipeline
pipeline = RenderFormerRenderingPipeline.from_pretrained("${e.id}")`],$p=e=>[`from tensorflow_tts.inference import AutoProcessor, TFAutoModel

processor = AutoProcessor.from_pretrained("${e.id}")
model = TFAutoModel.from_pretrained("${e.id}")
`],Cp=e=>[`from tensorflow_tts.inference import TFAutoModel

model = TFAutoModel.from_pretrained("${e.id}")
audios = model.inference(mels)
`],Rp=e=>[`from tensorflow_tts.inference import TFAutoModel

model = TFAutoModel.from_pretrained("${e.id}")
`],Up=e=>e.tags.includes("text-to-mel")?$p(e):e.tags.includes("mel-to-wav")?Cp(e):Rp(e),Mp=e=>[`import timm

model = timm.create_model("hf_hub:${e.id}", pretrained=True)`],Np=()=>[`# pip install sae-lens
from sae_lens import SAE

sae, cfg_dict, sparsity = SAE.from_pretrained(
    release = "RELEASE_ID", # e.g., "gpt2-small-res-jb". See other options in https://github.com/jbloomAus/SAELens/blob/main/sae_lens/pretrained_saes.yaml
    sae_id = "SAE_ID", # e.g., "blocks.8.hook_resid_pre". Won't always be a hook point
)`],Dp=()=>[`# seed_story_cfg_path refers to 'https://github.com/TencentARC/SEED-Story/blob/master/configs/clm_models/agent_7b_sft.yaml'
# llm_cfg_path refers to 'https://github.com/TencentARC/SEED-Story/blob/master/configs/clm_models/llama2chat7b_lora.yaml'
from omegaconf import OmegaConf
import hydra

# load Llama2
llm_cfg = OmegaConf.load(llm_cfg_path)
llm = hydra.utils.instantiate(llm_cfg, torch_dtype="fp16")

# initialize seed_story
seed_story_cfg = OmegaConf.load(seed_story_cfg_path)
seed_story = hydra.utils.instantiate(seed_story_cfg, llm=llm) `],jp=(e,t)=>[`import joblib
from skops.hub_utils import download
download("${e.id}", "path_to_folder")
model = joblib.load(
	"${t}"
)
# only load pickle files from sources you trust
# read more about it here https://skops.readthedocs.io/en/stable/persistence.html`],Op=(e,t)=>[`from skops.hub_utils import download
from skops.io import load
download("${e.id}", "path_to_folder")
# make sure model file is in skops format
# if model is a pickle file, make sure it's from a source you trust
model = load("path_to_folder/${t}")`],Bp=e=>[`from huggingface_hub import hf_hub_download
import joblib
model = joblib.load(
	hf_hub_download("${e.id}", "sklearn_model.joblib")
)
# only load pickle files from sources you trust
# read more about it here https://skops.readthedocs.io/en/stable/persistence.html`],qp=e=>{var t,n,a,o,i;if(e.tags.includes("skops")){const s=(a=(n=(t=e.config)==null?void 0:t.sklearn)==null?void 0:n.model)==null?void 0:a.file,r=(i=(o=e.config)==null?void 0:o.sklearn)==null?void 0:i.model_format;return s?r==="pickle"?jp(e,s):Op(e,s):["# ⚠️ Model filename not specified in config.json"]}else return Bp(e)},Fp=e=>[`import torch
import torchaudio
from einops import rearrange
from stable_audio_tools import get_pretrained_model
from stable_audio_tools.inference.generation import generate_diffusion_cond

device = "cuda" if torch.cuda.is_available() else "cpu"

# Download model
model, model_config = get_pretrained_model("${e.id}")
sample_rate = model_config["sample_rate"]
sample_size = model_config["sample_size"]

model = model.to(device)

# Set up text and timing conditioning
conditioning = [{
	"prompt": "128 BPM tech house drum loop",
}]

# Generate stereo audio
output = generate_diffusion_cond(
	model,
	conditioning=conditioning,
	sample_size=sample_size,
	device=device
)

# Rearrange audio batch to a single sequence
output = rearrange(output, "b d n -> d (b n)")

# Peak normalize, clip, convert to int16, and save to file
output = output.to(torch.float32).div(torch.max(torch.abs(output))).clamp(-1, 1).mul(32767).to(torch.int16).cpu()
torchaudio.save("output.wav", output, sample_rate)`],Hp=e=>[`from huggingface_hub import from_pretrained_fastai

learn = from_pretrained_fastai("${e.id}")`],Vp=e=>{const t=`# Use SAM2 with images
import torch
from sam2.sam2_image_predictor import SAM2ImagePredictor

predictor = SAM2ImagePredictor.from_pretrained(${e.id})

with torch.inference_mode(), torch.autocast("cuda", dtype=torch.bfloat16):
    predictor.set_image(<your_image>)
    masks, _, _ = predictor.predict(<input_prompts>)`,n=`# Use SAM2 with videos
import torch
from sam2.sam2_video_predictor import SAM2VideoPredictor

predictor = SAM2VideoPredictor.from_pretrained(${e.id})

with torch.inference_mode(), torch.autocast("cuda", dtype=torch.bfloat16):
    state = predictor.init_state(<your_video>)

    # add new prompts and instantly get the output on the same frame
    frame_idx, object_ids, masks = predictor.add_new_points(state, <your_prompts>):

    # propagate the prompts to get masklets throughout the video
    for frame_idx, object_ids, masks in predictor.propagate_in_video(state):
        ...`;return[t,n]},zp=e=>[`from inference import Inference, load_image, load_single_mask
from huggingface_hub import hf_hub_download

path = hf_hub_download("${e.id}", "pipeline.yaml")
inference = Inference(path, compile=False)

image = load_image("path_to_image.png")
mask = load_single_mask("path_to_mask.png", index=14)

output = inference(image, mask)`],Kp=e=>[`from notebook.utils import setup_sam_3d_body

estimator = setup_sam_3d_body(${e.id})
outputs = estimator.process_one_image(image)
rend_img = visualize_sample_together(image, outputs, estimator.faces)`],Wp=e=>[`python -m sample_factory.huggingface.load_from_hub -r ${e.id} -d ./train_dir`];function Xp(e){var n,a;const t=(n=e.widgetData)==null?void 0:n[0];if(t!=null&&t.source_sentence&&((a=t==null?void 0:t.sentences)!=null&&a.length))return[t.source_sentence,...t.sentences]}const Qp=e=>{const t=e.tags.includes(Ha)?", trust_remote_code=True":"";if(e.tags.includes("PyLate"))return[`from pylate import models

queries = [
    "Which planet is known as the Red Planet?",
    "What is the largest planet in our solar system?",
]

documents = [
    ["Mars is the Red Planet.", "Venus is Earth's twin."],
    ["Jupiter is the largest planet.", "Saturn has rings."],
]

model = models.ColBERT(model_name_or_path="${e.id}")

queries_emb = model.encode(queries, is_query=True)
docs_emb = model.encode(documents, is_query=False)`];if(e.tags.includes("cross-encoder")||e.pipeline_tag=="text-ranking")return[`from sentence_transformers import CrossEncoder

model = CrossEncoder("${e.id}"${t})

query = "Which planet is known as the Red Planet?"
passages = [
	"Venus is often called Earth's twin because of its similar size and proximity.",
	"Mars, known for its reddish appearance, is often referred to as the Red Planet.",
	"Jupiter, the largest planet in our solar system, has a prominent red spot.",
	"Saturn, famous for its rings, is sometimes mistaken for the Red Planet."
]

scores = model.predict([(query, passage) for passage in passages])
print(scores)`];const n=Xp(e)??["The weather is lovely today.","It's so sunny outside!","He drove to the stadium."];return[`from sentence_transformers import SentenceTransformer

model = SentenceTransformer("${e.id}"${t})

sentences = ${JSON.stringify(n,null,4)}
embeddings = model.encode(sentences)

similarities = model.similarity(embeddings, embeddings)
print(similarities.shape)
# [${n.length}, ${n.length}]`]},Jp=e=>[`from setfit import SetFitModel

model = SetFitModel.from_pretrained("${e.id}")`],Yp=e=>[`!pip install https://huggingface.co/${e.id}/resolve/main/${qe(e.id)}-any-py3-none-any.whl

# Using spacy.load().
import spacy
nlp = spacy.load("${qe(e.id)}")

# Importing as module.
import ${qe(e.id)}
nlp = ${qe(e.id)}.load()`],Zp=e=>[`from span_marker import SpanMarkerModel

model = SpanMarkerModel.from_pretrained("${e.id}")`],Gp=e=>[`import stanza

stanza.download("${qe(e.id).replace("stanza-","")}")
nlp = stanza.Pipeline("${qe(e.id).replace("stanza-","")}")`],eu=e=>{switch(e){case"EncoderClassifier":return"classify_file";case"EncoderDecoderASR":case"EncoderASR":return"transcribe_file";case"SpectralMaskEnhancement":return"enhance_file";case"SepformerSeparation":return"separate_file";default:return}},tu=e=>{var a,o;const t=(o=(a=e.config)==null?void 0:a.speechbrain)==null?void 0:o.speechbrain_interface;if(t===void 0)return["# interface not specified in config.json"];const n=eu(t);return n===void 0?["# interface in config.json invalid"]:[`from speechbrain.pretrained import ${t}
model = ${t}.from_hparams(
  "${e.id}"
)
model.${n}("file.wav")`]},nu=e=>[`from terratorch.registry import BACKBONE_REGISTRY

model = BACKBONE_REGISTRY.build("${e.id}")`],au=e=>{var t,n,a,o,i;return((n=(t=e.config)==null?void 0:t.tokenizer_config)==null?void 0:n.chat_template)!==void 0||((o=(a=e.config)==null?void 0:a.processor_config)==null?void 0:o.chat_template)!==void 0||((i=e.config)==null?void 0:i.chat_template_jinja)!==void 0},Wa=e=>{var o;const t=e.transformersInfo;if(!t)return["# ⚠️ Type of model unknown"];const n=e.tags.includes(Ha)?", trust_remote_code=True":"",a=[];if(t.processor){const i=t.processor==="AutoTokenizer"?"tokenizer":t.processor==="AutoFeatureExtractor"?"extractor":"processor";a.push("# Load model directly",`from transformers import ${t.processor}, ${t.auto_model}`,"",`${i} = ${t.processor}.from_pretrained("${e.id}"`+n+")",`model = ${t.auto_model}.from_pretrained("${e.id}"`+n+")"),e.tags.includes("conversational")&&au(e)&&(e.tags.includes("image-text-to-text")?a.push("messages = [",["    {",'        "role": "user",','        "content": [','            {"type": "image", "url": "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/p-blog/candy.JPG"},','            {"type": "text", "text": "What animal is on the candy?"}',"        ]","    },"].join(`
`),"]"):a.push("messages = [",'    {"role": "user", "content": "Who are you?"},',"]"),a.push(`inputs = ${i}.apply_chat_template(`,"	messages,","	add_generation_prompt=True,","	tokenize=True,","	return_dict=True,",'	return_tensors="pt",',").to(model.device)","","outputs = model.generate(**inputs, max_new_tokens=40)",`print(${i}.decode(outputs[0][inputs["input_ids"].shape[-1]:]))`))}else a.push("# Load model directly",`from transformers import ${t.auto_model}`,`model = ${t.auto_model}.from_pretrained("${e.id}"`+n+', dtype="auto")');if(e.pipeline_tag&&((o=$l.transformers)!=null&&o.includes(e.pipeline_tag))){const i=["# Use a pipeline as a high-level helper"];return Cl.includes(e.pipeline_tag)&&i.push(`# Warning: Pipeline type "${e.pipeline_tag}" is no longer supported in transformers v5.`,"# You must load the model directly (see below) or downgrade to v4.x with:",`# 'pip install "transformers<5.0.0'`),i.push("from transformers import pipeline","",`pipe = pipeline("${e.pipeline_tag}", model="${e.id}"`+n+")"),e.tags.includes("conversational")?e.tags.includes("image-text-to-text")?(i.push("messages = [",["    {",'        "role": "user",','        "content": [','            {"type": "image", "url": "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/p-blog/candy.JPG"},','            {"type": "text", "text": "What animal is on the candy?"}',"        ]","    },"].join(`
`),"]"),i.push("pipe(text=messages)")):(i.push("messages = [",'    {"role": "user", "content": "Who are you?"},',"]"),i.push("pipe(messages)")):e.pipeline_tag==="zero-shot-image-classification"?i.push("pipe(",'    "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/hub/parrots.png",','    candidate_labels=["animals", "humans", "landscape"],',")"):e.pipeline_tag==="image-classification"&&i.push('pipe("https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/hub/parrots.png")'),[i.join(`
`),a.join(`
`)]}return[a.join(`
`)]},ou=e=>{if(!e.pipeline_tag)return["// ⚠️ Unknown pipeline tag"];const t="@huggingface/transformers";return[`// npm i ${t}
import { pipeline } from '${t}';

// Allocate pipeline
const pipe = await pipeline('${e.pipeline_tag}', '${e.id}');`]},iu=e=>{switch(e){case"CAUSAL_LM":return"CausalLM";case"SEQ_2_SEQ_LM":return"Seq2SeqLM";case"TOKEN_CLS":return"TokenClassification";case"SEQ_CLS":return"SequenceClassification";default:return}},su=e=>{var o;const{base_model_name_or_path:t,task_type:n}=((o=e.config)==null?void 0:o.peft)??{},a=iu(n);return a?t?[`from peft import PeftModel
from transformers import AutoModelFor${a}

base_model = AutoModelFor${a}.from_pretrained("${t}")
model = PeftModel.from_pretrained(base_model, "${e.id}")`]:["Base model is not found."]:["Task type is invalid."]},ru=e=>[`from huggingface_hub import hf_hub_download
import fasttext

model = fasttext.load_model(hf_hub_download("${e.id}", "model.bin"))`],lu=e=>[`from huggingface_sb3 import load_from_hub
checkpoint = load_from_hub(
	repo_id="${e.id}",
	filename="{MODEL FILENAME}.zip",
)`],cu=(e,t)=>{switch(e){case"ASR":return[`import nemo.collections.asr as nemo_asr
asr_model = nemo_asr.models.ASRModel.from_pretrained("${t.id}")

transcriptions = asr_model.transcribe(["file.wav"])`];default:return}},du=e=>[`mlagents-load-from-hf --repo-id="${e.id}" --local-dir="./download: string[]s"`],pu=()=>[`string modelName = "[Your model name here].sentis";
Model model = ModelLoader.Load(Application.streamingAssetsPath + "/" + modelName);
IWorker engine = WorkerFactory.CreateWorker(BackendType.GPUCompute, model);
// Please see provided C# file for more details
`],uu=e=>[`
# Load the model and infer image from text
import torch
from app.sana_pipeline import SanaPipeline
from torchvision.utils import save_image

sana = SanaPipeline("configs/sana_config/1024ms/Sana_1600M_img1024.yaml")
sana.from_pretrained("hf://${e.id}")

image = sana(
    prompt='a cyberpunk cat with a neon sign that says "Sana"',
    height=1024,
    width=1024,
    guidance_scale=5.0,
    pag_guidance_scale=2.0,
    num_inference_steps=18,
) `],mu=e=>[`import torch, soundfile as sf, librosa, numpy as np
from vibevoice.processor.vibevoice_processor import VibeVoiceProcessor
from vibevoice.modular.modeling_vibevoice_inference import VibeVoiceForConditionalGenerationInference

# Load voice sample (should be 24kHz mono)
voice, sr = sf.read("path/to/voice_sample.wav")
if voice.ndim > 1: voice = voice.mean(axis=1)
if sr != 24000: voice = librosa.resample(voice, sr, 24000)

processor = VibeVoiceProcessor.from_pretrained("${e.id}")
model = VibeVoiceForConditionalGenerationInference.from_pretrained(
    "${e.id}", torch_dtype=torch.bfloat16
).to("cuda").eval()
model.set_ddpm_inference_steps(5)

inputs = processor(text=["Speaker 0: Hello!\\nSpeaker 1: Hi there!"],
                   voice_samples=[[voice]], return_tensors="pt")
audio = model.generate(**inputs, cfg_scale=1.3,
                       tokenizer=processor.tokenizer).speech_outputs[0]
sf.write("output.wav", audio.cpu().numpy().squeeze(), 24000)`],fu=e=>[`# Install from https://github.com/google-deepmind/videoprism
import jax
from videoprism import models as vp

flax_model = vp.get_model("${e.id}")
loaded_state = vp.load_pretrained_weights("${e.id}")

@jax.jit
def forward_fn(inputs, train=False):
  return flax_model.apply(loaded_state, inputs, train=train)`],hu=e=>[`from Trainer_finetune import Model

model = Model.from_pretrained("${e.id}")`],gu=e=>[`from huggingface_hub import hf_hub_download
	 from inference_onnx import LVFaceONNXInferencer

model_path = hf_hub_download("${e.id}", "LVFace-L_Glint360K/LVFace-L_Glint360K.onnx")
inferencer = LVFaceONNXInferencer(model_path, use_gpu=True, timeout=300)
img_path = 'path/to/image1.jpg'
embedding = inferencer.infer_from_image(img_path)`],yu=e=>[`from voicecraft import VoiceCraft

model = VoiceCraft.from_pretrained("${e.id}")`],bu=e=>[`import soundfile as sf
from voxcpm import VoxCPM

model = VoxCPM.from_pretrained("${e.id}")

wav = model.generate(
    text="VoxCPM is an innovative end-to-end TTS model from ModelBest, designed to generate highly expressive speech.",
    prompt_wav_path=None,      # optional: path to a prompt speech for voice cloning
    prompt_text=None,          # optional: reference text
    cfg_value=2.0,             # LM guidance on LocDiT, higher for better adherence to the prompt, but maybe worse
    inference_timesteps=10,   # LocDiT inference timesteps, higher for better result, lower for fast speed
    normalize=True,           # enable external TN tool
    denoise=True,             # enable external Denoise tool
    retry_badcase=True,        # enable retrying mode for some bad cases (unstoppable)
    retry_badcase_max_times=3,  # maximum retrying times
    retry_badcase_ratio_threshold=6.0, # maximum length restriction for bad case detection (simple but effective), it could be adjusted for slow pace speech
)

sf.write("output.wav", wav, 16000)
print("saved: output.wav")`],vu=()=>[`# !pip install git+https://github.com/fluxions-ai/vui

import torchaudio

from vui.inference import render
from vui.model import Vui,

model = Vui.from_pretrained().cuda()
waveform = render(
    model,
    "Hey, here is some random stuff, usually something quite long as the shorter the text the less likely the model can cope!",
)
print(waveform.shape)
torchaudio.save("out.opus", waveform[0], 22050)
`],wu=()=>[`import ChatTTS
import torchaudio

chat = ChatTTS.Chat()
chat.load_models(compile=False) # Set to True for better performance

texts = ["PUT YOUR TEXT HERE",]

wavs = chat.infer(texts, )

torchaudio.save("output1.wav", torch.from_numpy(wavs[0]), 24000)`],ra=e=>{const t=e.tags.find(o=>o.match(/^yolov\d+$/)),n=t?`YOLOv${t.slice(4)}`:"YOLOvXX";return[(t?"":`# Couldn't find a valid YOLO version tag.
# Replace XX with the correct version.
`)+`from ultralytics import ${n}

model = ${n}.from_pretrained("${e.id}")
source = 'http://images.cocodataset.org/val2017/000000039769.jpg'
model.predict(source=source, save=True)`]},xu=e=>[`# Option 1: use with transformers

from transformers import AutoModelForImageSegmentation
birefnet = AutoModelForImageSegmentation.from_pretrained("${e.id}", trust_remote_code=True)
`,`# Option 2: use with BiRefNet

# Install from https://github.com/ZhengPeng7/BiRefNet

from models.birefnet import BiRefNet
model = BiRefNet.from_pretrained("${e.id}")`],_u=()=>[`from supertonic import TTS

tts = TTS(auto_download=True)

style = tts.get_voice_style(voice_name="M1")

text = "The train delay was announced at 4:45 PM on Wed, Apr 3, 2024 due to track maintenance."
wav, duration = tts.synthesize(text, voice_style=style)

tts.save_audio(wav, "output.wav")`],ku=e=>[`from swarmformer import SwarmFormerModel

model = SwarmFormerModel.from_pretrained("${e.id}")
`],Au=e=>[`# Follow installation instructions at https://github.com/PKU-YuanGroup/UniWorld-V1

from univa.models.qwen2p5vl.modeling_univa_qwen2p5vl import UnivaQwen2p5VLForConditionalGeneration
	model = UnivaQwen2p5VLForConditionalGeneration.from_pretrained(
        "${e.id}",
        torch_dtype=torch.bfloat16,
        attn_implementation="flash_attention_2",
    ).to("cuda")
	processor = AutoProcessor.from_pretrained("${e.id}")
`],Su=e=>[`# Download the model from the Hub
pip install huggingface_hub[hf_xet]

huggingface-cli download --local-dir ${qe(e.id)} ${e.id}`],Tu=e=>[`# Make sure mlx-lm is installed
# pip install --upgrade mlx-lm
# if on a CUDA device, also pip install mlx[cuda]

# Generate text with mlx-lm
from mlx_lm import load, generate

model, tokenizer = load("${e.id}")

prompt = "Once upon a time in"
text = generate(model, tokenizer, prompt=prompt, verbose=True)`],Iu=e=>[`# Make sure mlx-lm is installed
# pip install --upgrade mlx-lm

# Generate text with mlx-lm
from mlx_lm import load, generate

model, tokenizer = load("${e.id}")

prompt = "Write a story about Einstein"
messages = [{"role": "user", "content": prompt}]
prompt = tokenizer.apply_chat_template(
    messages, add_generation_prompt=True
)

text = generate(model, tokenizer, prompt=prompt, verbose=True)`],Eu=e=>[`# Make sure mlx-vlm is installed
# pip install --upgrade mlx-vlm

from mlx_vlm import load, generate
from mlx_vlm.prompt_utils import apply_chat_template
from mlx_vlm.utils import load_config

# Load the model
model, processor = load("${e.id}")
config = load_config("${e.id}")

# Prepare input
image = ["http://images.cocodataset.org/val2017/000000039769.jpg"]
prompt = "Describe this image."

# Apply chat template
formatted_prompt = apply_chat_template(
    processor, config, prompt, num_images=1
)

# Generate output
output = generate(model, processor, formatted_prompt, image)
print(output)`],Lu=e=>[`from mlxim.model import create_model

model = create_model(${e.id})`],Pu=e=>e.pipeline_tag==="image-text-to-text"?Eu(e):e.pipeline_tag==="text-generation"?e.tags.includes("conversational")?Iu(e):Tu(e):Su(e),$u=e=>[`from model2vec import StaticModel

model = StaticModel.from_pretrained("${e.id}")`],Cu=e=>{let t;e.tags.includes("diffusers")?t=Ru(e):e.tags.includes("transformers")?t=Uu(e):t=Mu(e);const n=a=>/^from pruna import PrunaModel/m.test(a)?a:`from pruna import PrunaModel
${a}`;return t=t.map(n),e.tags.includes("pruna_pro-ai")?t.map(a=>a.replace(/\bpruna\b/g,"pruna_pro").replace(/\bPrunaModel\b/g,"PrunaProModel")):t},Ru=e=>Ka(e).map(n=>n.replace(/\b\w*Pipeline\w*\b/g,"PrunaModel").replace(/from diffusers import ([^,\n]*PrunaModel[^,\n]*)/g,"").replace(/from diffusers import ([^,\n]+),?\s*([^,\n]*PrunaModel[^,\n]*)/g,"from diffusers import $1").replace(/from diffusers import\s*(\n|$)/g,"").replace(/from diffusers import PrunaModel/g,"from pruna import PrunaModel").replace(/from diffusers import ([^,\n]+), PrunaModel/g,"from diffusers import $1").replace(/from diffusers import PrunaModel, ([^,\n]+)/g,"from diffusers import $1").replace(/\n\n+/g,`
`).trim()),Uu=e=>{const t=e.transformersInfo;let a=Wa(e).map(o=>o.replace(/from transformers import pipeline/g,"from pruna import PrunaModel").replace(/pipeline\([^)]*\)/g,`PrunaModel.from_pretrained("${e.id}")`));return t!=null&&t.auto_model&&(a=a.map(o=>o.replace(new RegExp(`from transformers import ${t.auto_model}
?`,"g"),"").replace(new RegExp(`${t.auto_model}.from_pretrained`,"g"),"PrunaModel.from_pretrained").replace(new RegExp(`^.*from.*import.*(, *${t.auto_model})+.*$`,"gm"),i=>i.replace(new RegExp(`, *${t.auto_model}`,"g"),"")))),a},Mu=e=>[`from pruna import PrunaModel
model = PrunaModel.from_pretrained("${e.id}")
`],Nu=e=>{let t;return e.tags.includes("automatic-speech-recognition")&&(t=cu("ASR",e)),t??["# tag did not correspond to a valid NeMo domain."]},Du=e=>{const t=e.tags??[];return t.includes("gguf")||t.includes("onnx")?[]:[`
  import outetts

  enum = outetts.Models("${e.id}".split("/", 1)[1])       # VERSION_1_0_SIZE_1B
  cfg  = outetts.ModelConfig.auto_config(enum, outetts.Backend.HF)
  tts  = outetts.Interface(cfg)

  speaker = tts.load_default_speaker("EN-FEMALE-1-NEUTRAL")
  tts.generate(
	  outetts.GenerationConfig(
		  text="Hello there, how are you doing?",
		  speaker=speaker,
	  )
  ).save("output.wav")
  `]},ju=e=>[`from pxia import AutoModel

model = AutoModel.from_pretrained("${e.id}")`],Ou=e=>[`from pythae.models import AutoModel

model = AutoModel.load_from_hf_hub("${e.id}")`],Bu=e=>[`# pip install qwen-tts
import torch
import soundfile as sf
from qwen_tts import Qwen3TTSModel

model = Qwen3TTSModel.from_pretrained(
    "${e.id}",
    device_map="cuda:0",
    dtype=torch.bfloat16,
    attn_implementation="flash_attention_2",
)

wavs, sr = model.generate_custom_voice(
    text="Your text here.",
    language="English",
    speaker="Ryan",
    instruct="Speak in a natural tone.",
)

sf.write("output.wav", wavs[0], sr)`],qu=e=>[`from audiocraft.models import MusicGen

model = MusicGen.get_pretrained("${e.id}")

descriptions = ['happy rock', 'energetic EDM', 'sad jazz']
wav = model.generate(descriptions)  # generates 3 samples.`],Fu=e=>[`from audiocraft.models import MAGNeT

model = MAGNeT.get_pretrained("${e.id}")

descriptions = ['disco beat', 'energetic EDM', 'funky groove']
wav = model.generate(descriptions)  # generates 3 samples.`],Hu=e=>[`from audiocraft.models import AudioGen

model = AudioGen.get_pretrained("${e.id}")
model.set_generation_params(duration=5)  # generate 5 seconds.
descriptions = ['dog barking', 'sirene of an emergency vehicle', 'footsteps in a corridor']
wav = model.generate(descriptions)  # generates 3 samples.`],Vu=e=>[`from anemoi.inference.runners.default import DefaultRunner
from anemoi.inference.config.run import RunConfiguration
# Create Configuration
config = RunConfiguration(checkpoint = {"huggingface":"${e.id}"})
# Load Runner
runner = DefaultRunner(config)`],zu=e=>e.tags.includes("musicgen")?qu(e):e.tags.includes("audiogen")?Hu(e):e.tags.includes("magnet")?Fu(e):["# Type of model unknown."],Ku=()=>[`# Install CLI with Homebrew on macOS device
brew install whisperkit-cli

# View all available inference options
whisperkit-cli transcribe --help

# Download and run inference using whisper base model
whisperkit-cli transcribe --audio-path /path/to/audio.mp3

# Or use your preferred model variant
whisperkit-cli transcribe --model "large-v3" --model-prefix "distil" --audio-path /path/to/audio.mp3 --verbose`],Wu=e=>[`from threedtopia_xl.models import threedtopia_xl

model = threedtopia_xl.from_pretrained("${e.id}")
model.generate(cond="path/to/image.png")`],Xu=e=>[`# pip install git+https://github.com/Zyphra/Zonos.git
import torchaudio
from zonos.model import Zonos
from zonos.conditioning import make_cond_dict

model = Zonos.from_pretrained("${e.id}", device="cuda")

wav, sr = torchaudio.load("speaker.wav")           # 5-10s reference clip
speaker = model.make_speaker_embedding(wav, sr)

cond  = make_cond_dict(text="Hello, world!", speaker=speaker, language="en-us")
codes = model.generate(model.prepare_conditioning(cond))

audio = model.autoencoder.decode(codes)[0].cpu()
torchaudio.save("sample.wav", audio, model.autoencoder.sampling_rate)
`],Qu=e=>{if(e.id.includes("-mlx")){const t=e.id.includes("-q4")?" -q 4":e.id.includes("-q8")?" -q 8":"";return[`# pip install moshi_mlx
# Run local inference (macOS Apple Silicon)
python -m moshi_mlx.local${t} --hf-repo "${e.id}"

# Or run with web UI
python -m moshi_mlx.local_web${t} --hf-repo "${e.id}"`]}return e.id.includes("-candle")?[`# pip install rustymimi
# Candle backend - see https://github.com/kyutai-labs/moshi
# for Rust installation instructions`]:[`# pip install moshi
# Run the interactive web server
python -m moshi.server --hf-repo "${e.id}"
# Then open https://localhost:8998 in your browser`,`# pip install moshi
import torch
from moshi.models import loaders

# Load checkpoint info from HuggingFace
checkpoint = loaders.CheckpointInfo.from_hf_repo("${e.id}")

# Load the Mimi audio codec
mimi = checkpoint.get_mimi(device="cuda")
mimi.set_num_codebooks(8)

# Encode audio (24kHz, mono)
wav = torch.randn(1, 1, 24000 * 10)  # [batch, channels, samples]
with torch.no_grad():
    codes = mimi.encode(wav.cuda())
    decoded = mimi.decode(codes)`]},Ju={acestep:{prettyLabel:"ACE-Step",repoName:"ACE-Step",repoUrl:"https://github.com/ace-step/ACE-Step",filter:!1,countDownloads:'path:"ace_step_transformer/config.json"'},"adapter-transformers":{prettyLabel:"Adapters",repoName:"adapters",repoUrl:"https://github.com/Adapter-Hub/adapters",docsUrl:"https://huggingface.co/docs/hub/adapters",snippets:sd,filter:!0,countDownloads:'path:"adapter_config.json"'},allennlp:{prettyLabel:"AllenNLP",repoName:"AllenNLP",repoUrl:"https://github.com/allenai/allennlp",docsUrl:"https://huggingface.co/docs/hub/allennlp",snippets:cd,filter:!0},anemoi:{prettyLabel:"AnemoI",repoName:"AnemoI",repoUrl:"https://github.com/ecmwf/anemoi-inference",docsUrl:"https://anemoi.readthedocs.io/en/latest/",filter:!1,countDownloads:'path_extension:"ckpt"',snippets:Vu},araclip:{prettyLabel:"AraClip",repoName:"AraClip",repoUrl:"https://huggingface.co/Arabic-Clip/araclip",filter:!1,snippets:dd},"aviation-ner":{prettyLabel:"Aviation NER",repoName:"Aviation NER",repoUrl:"https://github.com/Boeing/aviation_ner_sdr",docsUrl:"https://github.com/Boeing/aviation_ner_sdr",countDownloads:'path:"gliner_config.json"',filter:!1},asteroid:{prettyLabel:"Asteroid",repoName:"Asteroid",repoUrl:"https://github.com/asteroid-team/asteroid",docsUrl:"https://huggingface.co/docs/hub/asteroid",snippets:pd,filter:!0,countDownloads:'path:"pytorch_model.bin"'},audiocraft:{prettyLabel:"Audiocraft",repoName:"audiocraft",repoUrl:"https://github.com/facebookresearch/audiocraft",snippets:zu,filter:!1,countDownloads:'path:"state_dict.bin"'},audioseal:{prettyLabel:"AudioSeal",repoName:"audioseal",repoUrl:"https://github.com/facebookresearch/audioseal",filter:!1,countDownloads:'path_extension:"pth"',snippets:ud},"bagel-mot":{prettyLabel:"Bagel",repoName:"Bagel",repoUrl:"https://github.com/ByteDance-Seed/Bagel/",filter:!1,countDownloads:'path:"llm_config.json"'},bboxmaskpose:{prettyLabel:"BBoxMaskPose",repoName:"BBoxMaskPose",repoUrl:"https://github.com/MiraPurkrabek/BBoxMaskPose",filter:!1,countDownloads:'path_extension:"pth"'},ben2:{prettyLabel:"BEN2",repoName:"BEN2",repoUrl:"https://github.com/PramaLLC/BEN2",snippets:md,filter:!1},bertopic:{prettyLabel:"BERTopic",repoName:"BERTopic",repoUrl:"https://github.com/MaartenGr/BERTopic",snippets:fd,filter:!0},big_vision:{prettyLabel:"Big Vision",repoName:"big_vision",repoUrl:"https://github.com/google-research/big_vision",filter:!1,countDownloads:'path_extension:"npz"'},bionemo:{prettyLabel:"BioNeMo",repoName:"BioNeMo",filter:!1,repoUrl:"https://github.com/nvidia/BioNeMo",countDownloads:'path_extension:"ckpt" OR path:"config.json"'},birder:{prettyLabel:"Birder",repoName:"Birder",repoUrl:"https://gitlab.com/birder/birder",filter:!1,countDownloads:'path_extension:"pt"'},birefnet:{prettyLabel:"BiRefNet",repoName:"BiRefNet",repoUrl:"https://github.com/ZhengPeng7/BiRefNet",snippets:xu,filter:!1},bm25s:{prettyLabel:"BM25S",repoName:"bm25s",repoUrl:"https://github.com/xhluca/bm25s",snippets:hd,filter:!1,countDownloads:'path:"params.index.json"'},boltzgen:{prettyLabel:"BoltzGen",repoName:"BoltzGen",repoUrl:"https://github.com/HannesStark/boltzgen",filter:!1,countDownloads:'path:"boltzgen1_diverse.ckpt"'},cancertathomev2:{prettyLabel:"Cancer@HomeV2",repoName:"Cancer@HomeV2",repoUrl:"https://huggingface.co/OpenPeerAI/CancerAtHomeV2",filter:!1,countDownloads:'path:"run.py"'},cartesia_pytorch:{prettyLabel:"Cartesia Pytorch",repoName:"Cartesia Pytorch",repoUrl:"https://github.com/cartesia-ai/cartesia_pytorch",snippets:qd},cartesia_mlx:{prettyLabel:"Cartesia MLX",repoName:"Cartesia MLX",repoUrl:"https://github.com/cartesia-ai/cartesia_mlx",snippets:Fd},champ:{prettyLabel:"Champ",repoName:"Champ",repoUrl:"https://github.com/fudan-generative-vision/champ",countDownloads:'path:"champ/motion_module.pth"'},chatterbox:{prettyLabel:"Chatterbox",repoName:"Chatterbox",repoUrl:"https://github.com/resemble-ai/chatterbox",snippets:gd,countDownloads:'path:"tokenizer.json"',filter:!1},chaossim:{prettyLabel:"ChaosSIM",repoName:"ChaosSIM",repoUrl:"https://huggingface.co/OpenPeerAI/ChaosSIM/",countDownloads:'path:"ChaosSim.nb"',filter:!1},chat_tts:{prettyLabel:"ChatTTS",repoName:"ChatTTS",repoUrl:"https://github.com/2noise/ChatTTS.git",snippets:wu,filter:!1,countDownloads:'path:"asset/GPT.pt"'},"chronos-forecasting":{prettyLabel:"Chronos",repoName:"Chronos",repoUrl:"https://github.com/amazon-science/chronos-forecasting",snippets:yd},clara:{prettyLabel:"Clara",repoName:"Clara",filter:!1,repoUrl:"https://github.com/nvidia/clara",countDownloads:'path_extension:"ckpt" OR path:"config.json"'},clipscope:{prettyLabel:"clipscope",repoName:"clipscope",repoUrl:"https://github.com/Lewington-pitsos/clipscope",filter:!1,countDownloads:'path_extension:"pt"'},"cloud-agents":{prettyLabel:"Cloud Agents",repoName:"Cloud Agents",repoUrl:"https://huggingface.co/OpenPeerAI/Cloud-Agents",filter:!1,countDownloads:'path:"setup.py"'},collectorvision:{prettyLabel:"CollectorVision",repoName:"CollectorVision",repoUrl:"https://github.com/HanClinto/CollectorVision",snippets:bd,filter:!1,countDownloads:'path_extension:"onnx"'},colipri:{prettyLabel:"COLIPRI",repoName:"COLIPRI",repoUrl:"https://huggingface.co/microsoft/colipri",snippets:vd,filter:!1,countDownloads:'path_extension:"safetensors"'},cosyvoice:{prettyLabel:"CosyVoice",repoName:"CosyVoice",repoUrl:"https://github.com/FunAudioLLM/CosyVoice",filter:!1,countDownloads:'path_extension:"onnx" OR path_extension:"pt"'},cotracker:{prettyLabel:"CoTracker",repoName:"CoTracker",repoUrl:"https://github.com/facebookresearch/co-tracker",filter:!1,countDownloads:'path_extension:"pth"'},colpali:{prettyLabel:"ColPali",repoName:"ColPali",repoUrl:"https://github.com/ManuelFay/colpali",filter:!1,countDownloads:'path:"adapter_config.json"'},comet:{prettyLabel:"COMET",repoName:"COMET",repoUrl:"https://github.com/Unbabel/COMET/",countDownloads:'path:"hparams.yaml"'},cosmos:{prettyLabel:"Cosmos",repoName:"Cosmos",repoUrl:"https://github.com/NVIDIA/Cosmos",countDownloads:'path:"config.json" OR path_extension:"pt"'},"cxr-foundation":{prettyLabel:"CXR Foundation",repoName:"cxr-foundation",repoUrl:"https://github.com/google-health/cxr-foundation",snippets:xd,filter:!1,countDownloads:'path:"precomputed_embeddings/embeddings.npz" OR path:"pax-elixr-b-text/saved_model.pb"'},deepforest:{prettyLabel:"DeepForest",repoName:"deepforest",docsUrl:"https://deepforest.readthedocs.io/en/latest/",repoUrl:"https://github.com/weecology/DeepForest"},"depth-anything-v2":{prettyLabel:"DepthAnythingV2",repoName:"Depth Anything V2",repoUrl:"https://github.com/DepthAnything/Depth-Anything-V2",snippets:_d,filter:!1,countDownloads:'path_extension:"pth"'},"depth-pro":{prettyLabel:"Depth Pro",repoName:"Depth Pro",repoUrl:"https://github.com/apple/ml-depth-pro",countDownloads:'path_extension:"pt"',snippets:kd,filter:!1},"derm-foundation":{prettyLabel:"Derm Foundation",repoName:"derm-foundation",repoUrl:"https://github.com/google-health/derm-foundation",snippets:Ad,filter:!1,countDownloads:'path:"scin_dataset_precomputed_embeddings.npz" OR path:"saved_model.pb"'},"describe-anything":{prettyLabel:"Describe Anything",repoName:"Describe Anything",repoUrl:"https://github.com/NVlabs/describe-anything",snippets:Id,filter:!1},"dia-tts":{prettyLabel:"Dia",repoName:"Dia",repoUrl:"https://github.com/nari-labs/dia",snippets:Sd,filter:!1},dia2:{prettyLabel:"Dia2",repoName:"Dia2",repoUrl:"https://github.com/nari-labs/dia2",snippets:Td,filter:!1},"diff-interpretation-tuning":{prettyLabel:"Diff Interpretation Tuning",repoName:"Diff Interpretation Tuning",repoUrl:"https://github.com/Aviously/diff-interpretation-tuning",filter:!1,countDownloads:'path_extension:"pt"'},diffree:{prettyLabel:"Diffree",repoName:"Diffree",repoUrl:"https://github.com/OpenGVLab/Diffree",filter:!1,countDownloads:'path:"diffree-step=000010999.ckpt"'},diffusers:{prettyLabel:"Diffusers",repoName:"🤗/diffusers",repoUrl:"https://github.com/huggingface/diffusers",docsUrl:"https://huggingface.co/docs/hub/diffusers",snippets:Ka,filter:!0},diffusionkit:{prettyLabel:"DiffusionKit",repoName:"DiffusionKit",repoUrl:"https://github.com/argmaxinc/DiffusionKit",snippets:Bd},"docking-at-home":{prettyLabel:"Docking@Home",repoName:"Docking@Home",repoUrl:"https://huggingface.co/OpenPeerAI/DockingAtHOME",filter:!1,countDownloads:'path:"setup.py"'},doctr:{prettyLabel:"docTR",repoName:"doctr",repoUrl:"https://github.com/mindee/doctr"},edsnlp:{prettyLabel:"EDS-NLP",repoName:"edsnlp",repoUrl:"https://github.com/aphp/edsnlp",docsUrl:"https://aphp.github.io/edsnlp/latest/",filter:!1,snippets:Hd,countDownloads:'path_filename:"config" AND path_extension:"cfg"'},elm:{prettyLabel:"ELM",repoName:"elm",repoUrl:"https://github.com/slicex-ai/elm",filter:!1,countDownloads:'path_filename:"slicex_elm_config" AND path_extension:"json"'},encoderfile:{prettyLabel:"encoderfile",repoName:"encoderfile",repoUrl:"https://github.com/mozilla-ai/encoderfile",filter:!1,countDownloads:'path_extension:"encoderfile"'},espnet:{prettyLabel:"ESPnet",repoName:"ESPnet",repoUrl:"https://github.com/espnet/espnet",docsUrl:"https://huggingface.co/docs/hub/espnet",snippets:Wd,filter:!0},eupe:{prettyLabel:"EUPE",repoName:"EUPE",repoUrl:"https://github.com/facebookresearch/EUPE",filter:!1,countDownloads:'path_extension:"pt"'},fairseq:{prettyLabel:"Fairseq",repoName:"fairseq",repoUrl:"https://github.com/pytorch/fairseq",snippets:Xd,filter:!0},fastai:{prettyLabel:"fastai",repoName:"fastai",repoUrl:"https://github.com/fastai/fastai",docsUrl:"https://huggingface.co/docs/hub/fastai",snippets:Hp,filter:!0},fastprint:{prettyLabel:"Fast Print",repoName:"Fast Print",repoUrl:"https://huggingface.co/OpenPeerAI/FastPrint",countDownloads:'path_extension:"cs"'},fasttext:{prettyLabel:"fastText",repoName:"fastText",repoUrl:"https://fasttext.cc/",snippets:ru,filter:!0,countDownloads:'path_extension:"bin"'},fixer:{prettyLabel:"Fixer",repoName:"Fixer",repoUrl:"https://github.com/nv-tlabs/Fixer",filter:!1,countDownloads:'path:"pretrained/pretrained_fixer.pkl"'},flair:{prettyLabel:"Flair",repoName:"Flair",repoUrl:"https://github.com/flairNLP/flair",docsUrl:"https://huggingface.co/docs/hub/flair",snippets:Qd,filter:!0,countDownloads:'path:"pytorch_model.bin"'},fme:{prettyLabel:"Full Model Emulation",repoName:"Full Model Emulation",repoUrl:"https://github.com/ai2cm/ace",docsUrl:"https://ai2-climate-emulator.readthedocs.io/en/latest/",filter:!1,countDownloads:'path_extension:"tar"'},"gemma.cpp":{prettyLabel:"gemma.cpp",repoName:"gemma.cpp",repoUrl:"https://github.com/google/gemma.cpp",filter:!1,countDownloads:'path_extension:"sbs"'},"geometry-crafter":{prettyLabel:"GeometryCrafter",repoName:"GeometryCrafter",repoUrl:"https://github.com/TencentARC/GeometryCrafter",countDownloads:'path:"point_map_vae/diffusion_pytorch_model.safetensors"'},gliner:{prettyLabel:"GLiNER",repoName:"GLiNER",repoUrl:"https://github.com/urchade/GLiNER",snippets:Jd,filter:!1,countDownloads:'path:"gliner_config.json"'},gliner2:{prettyLabel:"GLiNER2",repoName:"GLiNER2",repoUrl:"https://github.com/fastino-ai/GLiNER2",snippets:Yd,filter:!1},"glm-tts":{prettyLabel:"GLM-TTS",repoName:"GLM-TTS",repoUrl:"https://github.com/zai-org/GLM-TTS",filter:!1,countDownloads:'path:"flow/flow.pt"'},"glyph-byt5":{prettyLabel:"Glyph-ByT5",repoName:"Glyph-ByT5",repoUrl:"https://github.com/AIGText/Glyph-ByT5",filter:!1,countDownloads:'path:"checkpoints/byt5_model.pt"'},"granite-library":{prettyLabel:"Granite Library",repoName:"mellea",repoUrl:"https://github.com/generative-computing/mellea",filter:!1,countDownloads:'path_filename:"adapter_config" AND path_extension:"json"'},grok:{prettyLabel:"Grok",repoName:"Grok",repoUrl:"https://github.com/xai-org/grok-1",filter:!1,countDownloads:'path:"ckpt/tensor00000_000" OR path:"ckpt-0/tensor00000_000"'},"habibi-tts":{prettyLabel:"Habibi-TTS",repoName:"Habibi-TTS",repoUrl:"https://github.com/SWivid/Habibi-TTS",filter:!1,countDownloads:'path_extension:"safetensors"'},hallo:{prettyLabel:"Hallo",repoName:"Hallo",repoUrl:"https://github.com/fudan-generative-vision/hallo",countDownloads:'path:"hallo/net.pth"'},hermes:{prettyLabel:"HERMES",repoName:"HERMES",repoUrl:"https://github.com/LMD0311/HERMES",filter:!1,countDownloads:'path:"ckpt/hermes_final.pth"'},holomotion:{prettyLabel:"HoloMotion",repoName:"HoloMotion",repoUrl:"https://github.com/HorizonRobotics/HoloMotion",filter:!1,countDownloads:'path_extension:"onnx"'},hezar:{prettyLabel:"Hezar",repoName:"Hezar",repoUrl:"https://github.com/hezarai/hezar",docsUrl:"https://hezarai.github.io/hezar",countDownloads:'path:"model_config.yaml" OR path:"embedding/embedding_config.yaml"'},htrflow:{prettyLabel:"HTRflow",repoName:"HTRflow",repoUrl:"https://github.com/AI-Riksarkivet/htrflow",docsUrl:"https://ai-riksarkivet.github.io/htrflow",snippets:Gd},"hunyuan-dit":{prettyLabel:"HunyuanDiT",repoName:"HunyuanDiT",repoUrl:"https://github.com/Tencent/HunyuanDiT",countDownloads:'path:"pytorch_model_ema.pt" OR path:"pytorch_model_distill.pt"'},"hunyuan3d-2":{prettyLabel:"Hunyuan3D-2",repoName:"Hunyuan3D-2",repoUrl:"https://github.com/Tencent/Hunyuan3D-2",countDownloads:'path_filename:"model_index" OR path_filename:"config"'},"hunyuanworld-voyager":{prettyLabel:"HunyuanWorld-voyager",repoName:"HunyuanWorld-voyager",repoUrl:"https://github.com/Tencent-Hunyuan/HunyuanWorld-Voyager"},"hy-worldplay":{prettyLabel:"HY-WorldPlay",repoName:"HY-WorldPlay",repoUrl:"https://github.com/Tencent-Hunyuan/HY-WorldPlay",filter:!1,countDownloads:'path_extension:"json"'},"hy-world-2":{prettyLabel:"HY-World-2.0",repoName:"HY-World-2.0",repoUrl:"https://github.com/Tencent-Hunyuan/HY-World-2.0",filter:!1,countDownloads:'path_extension:"json"'},"image-matching-models":{prettyLabel:"Image Matching Models",repoName:"Image Matching Models",repoUrl:"https://github.com/alexstoken/image-matching-models",filter:!1,countDownloads:'path_extension:"safetensors"'},imstoucan:{prettyLabel:"IMS Toucan",repoName:"IMS-Toucan",repoUrl:"https://github.com/DigitalPhonetics/IMS-Toucan",countDownloads:'path:"embedding_gan.pt" OR path:"Vocoder.pt" OR path:"ToucanTTS.pt"'},"index-tts":{prettyLabel:"IndexTTS",repoName:"IndexTTS",repoUrl:"https://github.com/index-tts/index-tts",snippets:Zd,filter:!1},infinitetalk:{prettyLabel:"InfiniteTalk",repoName:"InfiniteTalk",repoUrl:"https://github.com/MeiGen-AI/InfiniteTalk",filter:!1,countDownloads:'path_extension:"safetensors"'},"infinite-you":{prettyLabel:"InfiniteYou",repoName:"InfiniteYou",repoUrl:"https://github.com/bytedance/InfiniteYou",filter:!1,countDownloads:'path:"infu_flux_v1.0/sim_stage1/image_proj_model.bin" OR path:"infu_flux_v1.0/aes_stage2/image_proj_model.bin"'},intellifold:{prettyLabel:"IntelliFold",repoName:"IntelliFold",repoUrl:"https://github.com/IntelliGen-AI/IntelliFold",filter:!1,countDownloads:'path_extension:"pt"'},"ising-decoding":{prettyLabel:"Ising Decoding",repoName:"Ising-Decoding",repoUrl:"https://github.com/NVIDIA/Ising-Decoding",filter:!1,countDownloads:'path_extension:"safetensors"'},keras:{prettyLabel:"Keras",repoName:"Keras",repoUrl:"https://github.com/keras-team/keras",docsUrl:"https://huggingface.co/docs/hub/keras",snippets:ep,filter:!0,countDownloads:'path:"config.json" OR path_extension:"keras"'},"tf-keras":{prettyLabel:"TF-Keras",repoName:"TF-Keras",repoUrl:"https://github.com/keras-team/tf-keras",docsUrl:"https://huggingface.co/docs/hub/tf-keras",snippets:fp,countDownloads:'path:"saved_model.pb"'},"keras-hub":{prettyLabel:"KerasHub",repoName:"KerasHub",repoUrl:"https://github.com/keras-team/keras-hub",docsUrl:"https://keras.io/keras_hub/",snippets:rp,filter:!0},kernels:{prettyLabel:"Kernels",repoName:"Kernels",repoUrl:"https://github.com/huggingface/kernels",docsUrl:"https://huggingface.co/docs/kernels",snippets:lp,countDownloads:'path_filename:"_ops" AND path_extension:"py"'},"kimi-audio":{prettyLabel:"KimiAudio",repoName:"KimiAudio",repoUrl:"https://github.com/MoonshotAI/Kimi-Audio",snippets:cp,filter:!1},kittentts:{prettyLabel:"KittenTTS",repoName:"KittenTTS",repoUrl:"https://github.com/KittenML/KittenTTS",snippets:dp},kronos:{prettyLabel:"KRONOS",repoName:"KRONOS",repoUrl:"https://github.com/mahmoodlab/KRONOS",filter:!1,countDownloads:'path_extension:"pt"'},k2:{prettyLabel:"K2",repoName:"k2",repoUrl:"https://github.com/k2-fsa/k2"},"lyra-2.0":{prettyLabel:"Lyra-2.0",repoName:"Lyra-2.0",repoUrl:"https://github.com/nv-tlabs/lyra",filter:!1,countDownloads:'path:"checkpoints/image_encoder/model.pth"'},lagernvs:{prettyLabel:"LagerNVS",repoName:"LagerNVS",repoUrl:"https://github.com/facebookresearch/lagernvs",filter:!1,countDownloads:'path_extension:"pt"'},"lightning-ir":{prettyLabel:"Lightning IR",repoName:"Lightning IR",repoUrl:"https://github.com/webis-de/lightning-ir",snippets:pp},litert:{prettyLabel:"LiteRT",repoName:"LiteRT",repoUrl:"https://github.com/google-ai-edge/LiteRT",filter:!1,countDownloads:'path_extension:"tflite"'},"litert-lm":{prettyLabel:"LiteRT-LM",repoName:"LiteRT-LM",repoUrl:"https://github.com/google-ai-edge/LiteRT-LM",filter:!1,countDownloads:'path_extension:"litertlm" OR path_extension:"task"'},lerobot:{prettyLabel:"LeRobot",repoName:"LeRobot",repoUrl:"https://github.com/huggingface/lerobot",docsUrl:"https://huggingface.co/docs/lerobot",filter:!1,snippets:mp},lightglue:{prettyLabel:"LightGlue",repoName:"LightGlue",repoUrl:"https://github.com/cvg/LightGlue",filter:!1,countDownloads:'path_extension:"pth" OR path:"config.json"'},liveportrait:{prettyLabel:"LivePortrait",repoName:"LivePortrait",repoUrl:"https://github.com/KwaiVGI/LivePortrait",filter:!1,countDownloads:'path:"liveportrait/landmark.onnx"'},"llama-cpp-python":{prettyLabel:"llama-cpp-python",repoName:"llama-cpp-python",repoUrl:"https://github.com/abetlen/llama-cpp-python",snippets:up},"mini-omni2":{prettyLabel:"Mini-Omni2",repoName:"Mini-Omni2",repoUrl:"https://github.com/gpt-omni/mini-omni2",countDownloads:'path:"model_config.yaml"'},mindspore:{prettyLabel:"MindSpore",repoName:"mindspore",repoUrl:"https://github.com/mindspore-ai/mindspore"},"magi-1":{prettyLabel:"MAGI-1",repoName:"MAGI-1",repoUrl:"https://github.com/SandAI-org/MAGI-1",countDownloads:'path:"ckpt/vae/config.json"'},"magenta-realtime":{prettyLabel:"Magenta RT",repoName:"Magenta RT",repoUrl:"https://github.com/magenta/magenta-realtime",countDownloads:'path:"checkpoints/llm_base_x4286_c1860k.tar" OR path:"checkpoints/llm_large_x3047_c1860k.tar" OR path:"checkpoints/llm_large_x3047_c1860k/checkpoint"'},"mamba-ssm":{prettyLabel:"MambaSSM",repoName:"MambaSSM",repoUrl:"https://github.com/state-spaces/mamba",filter:!1,snippets:hp},"manas-1":{prettyLabel:"MANAS-1",repoName:"MANAS-1",repoUrl:"https://github.com/NeurodxAI/manas-1",countDownloads:'path_extension:"pt"'},"mars5-tts":{prettyLabel:"MARS5-TTS",repoName:"MARS5-TTS",repoUrl:"https://github.com/Camb-ai/MARS5-TTS",filter:!1,countDownloads:'path:"mars5_ar.safetensors"',snippets:gp},matanyone:{prettyLabel:"MatAnyone",repoName:"MatAnyone",repoUrl:"https://github.com/pq-yang/MatAnyone",snippets:yp,filter:!1},"mesh-anything":{prettyLabel:"MeshAnything",repoName:"MeshAnything",repoUrl:"https://github.com/buaacyw/MeshAnything",filter:!1,countDownloads:'path:"MeshAnything_350m.pth"',snippets:bp},merlin:{prettyLabel:"Merlin",repoName:"Merlin",repoUrl:"https://github.com/StanfordMIMI/Merlin",filter:!1,countDownloads:'path_extension:"pt"'},medvae:{prettyLabel:"MedVAE",repoName:"MedVAE",repoUrl:"https://github.com/StanfordMIMI/MedVAE",filter:!1,countDownloads:'path_extension:"ckpt"'},mitie:{prettyLabel:"MITIE",repoName:"MITIE",repoUrl:"https://github.com/mit-nlp/MITIE",countDownloads:'path_filename:"total_word_feature_extractor"'},"ml-agents":{prettyLabel:"ml-agents",repoName:"ml-agents",repoUrl:"https://github.com/Unity-Technologies/ml-agents",docsUrl:"https://huggingface.co/docs/hub/ml-agents",snippets:du,filter:!0,countDownloads:'path_extension:"onnx"'},"ml-sharp":{prettyLabel:"Sharp",repoName:"Sharp",repoUrl:"https://github.com/apple/ml-sharp",filter:!1,countDownloads:'path_extension:"pt"'},mlx:{prettyLabel:"MLX",repoName:"MLX",repoUrl:"https://github.com/ml-explore/mlx-examples/tree/main",snippets:Pu,filter:!0},"mlx-image":{prettyLabel:"mlx-image",repoName:"mlx-image",repoUrl:"https://github.com/riccardomusmeci/mlx-image",docsUrl:"https://huggingface.co/docs/hub/mlx-image",snippets:Lu,filter:!1,countDownloads:'path:"model.safetensors"'},"mlc-llm":{prettyLabel:"MLC-LLM",repoName:"MLC-LLM",repoUrl:"https://github.com/mlc-ai/mlc-llm",docsUrl:"https://llm.mlc.ai/docs/",filter:!1,countDownloads:'path:"mlc-chat-config.json"'},model2vec:{prettyLabel:"Model2Vec",repoName:"model2vec",repoUrl:"https://github.com/MinishLab/model2vec",snippets:$u,filter:!1},moshi:{prettyLabel:"Moshi",repoName:"Moshi",repoUrl:"https://github.com/kyutai-labs/moshi",snippets:Qu,filter:!1,countDownloads:'path:"tokenizer-e351c8d8-checkpoint125.safetensors"'},mtvcraft:{prettyLabel:"MTVCraft",repoName:"MTVCraft",repoUrl:"https://github.com/baaivision/MTVCraft",filter:!1,countDownloads:'path:"vae/3d-vae.pt"'},multimolecule:{prettyLabel:"MultiMolecule",repoName:"MultiMolecule",repoUrl:"https://github.com/MultiMolecule/multimolecule",docsUrl:"https://multimolecule.danling.org",snippets:vp,filter:!1},nemo:{prettyLabel:"NeMo",repoName:"NeMo",repoUrl:"https://github.com/NVIDIA/NeMo",snippets:Nu,filter:!0,countDownloads:'path_extension:"nemo" OR path:"model_config.yaml" OR path_extension:"json"'},"nv-medtech":{prettyLabel:"NV-MedTech",repoName:"NV-MedTech",filter:!1,repoUrl:"https://github.com/nvidia-medtech",countDownloads:'path_extension:"pt" OR path_extension:"safetensors" OR path:"config.json"'},"open-oasis":{prettyLabel:"open-oasis",repoName:"open-oasis",repoUrl:"https://github.com/etched-ai/open-oasis",countDownloads:'path:"oasis500m.safetensors"'},open_clip:{prettyLabel:"OpenCLIP",repoName:"OpenCLIP",repoUrl:"https://github.com/mlfoundations/open_clip",snippets:wp,filter:!0,countDownloads:`path:"open_clip_model.safetensors"
			OR path:"model.safetensors"
			OR path:"open_clip_pytorch_model.bin"
			OR path:"pytorch_model.bin"`},openpeerllm:{prettyLabel:"OpenPeerLLM",repoName:"OpenPeerLLM",repoUrl:"https://huggingface.co/openpeerai/openpeerllm",docsUrl:"https://huggingface.co/OpenPeerAI/OpenPeerLLM/blob/main/README.md",countDownloads:'path:".meta-huggingface.json"',filter:!1},"open-sora":{prettyLabel:"Open-Sora",repoName:"Open-Sora",repoUrl:"https://github.com/hpcaitech/Open-Sora",filter:!1,countDownloads:'path:"Open_Sora_v2.safetensors"'},outetts:{prettyLabel:"OuteTTS",repoName:"OuteTTS",repoUrl:"https://github.com/edwko/OuteTTS",snippets:Du,filter:!1},paddlenlp:{prettyLabel:"paddlenlp",repoName:"PaddleNLP",repoUrl:"https://github.com/PaddlePaddle/PaddleNLP",docsUrl:"https://huggingface.co/docs/hub/paddlenlp",snippets:xp,filter:!0,countDownloads:'path:"model_config.json"'},PaddleOCR:{prettyLabel:"PaddleOCR",repoName:"PaddleOCR",repoUrl:"https://github.com/PaddlePaddle/PaddleOCR",docsUrl:"https://www.paddleocr.ai/",snippets:_p,filter:!0,countDownloads:'path_extension:"safetensors" OR path:"inference.pdiparams"'},peft:{prettyLabel:"PEFT",repoName:"PEFT",repoUrl:"https://github.com/huggingface/peft",snippets:su,filter:!0,countDownloads:'path:"adapter_config.json"'},"perception-encoder":{prettyLabel:"PerceptionEncoder",repoName:"PerceptionModels",repoUrl:"https://github.com/facebookresearch/perception_models",filter:!1,snippets:kp,countDownloads:'path_extension:"pt"'},"phantom-wan":{prettyLabel:"Phantom",repoName:"Phantom",repoUrl:"https://github.com/Phantom-video/Phantom",snippets:Ap,filter:!1,countDownloads:'path_extension:"pth"'},"pocket-tts":{prettyLabel:"Pocket-TTS",repoName:"PocketTTS",repoUrl:"https://github.com/kyutai-labs/pocket-tts",snippets:Sp,filter:!1,countDownloads:'path:"tts_b6369a24.safetensors"'},"pruna-ai":{prettyLabel:"Pruna AI",repoName:"Pruna AI",repoUrl:"https://github.com/PrunaAI/pruna",snippets:Cu,docsUrl:"https://docs.pruna.ai"},pxia:{prettyLabel:"pxia",repoName:"pxia",repoUrl:"https://github.com/not-lain/pxia",snippets:ju,filter:!1},"pyannote-audio":{prettyLabel:"pyannote.audio",repoName:"pyannote-audio",repoUrl:"https://github.com/pyannote/pyannote-audio",snippets:Ep,filter:!0},"py-feat":{prettyLabel:"Py-Feat",repoName:"Py-Feat",repoUrl:"https://github.com/cosanlab/py-feat",docsUrl:"https://py-feat.org/",filter:!1},pythae:{prettyLabel:"pythae",repoName:"pythae",repoUrl:"https://github.com/clementchadebec/benchmark_VAE",snippets:Ou,filter:!1},quantumpeer:{prettyLabel:"QuantumPeer",repoName:"QuantumPeer",repoUrl:"https://github.com/OpenPeer-AI/QuantumPeer",filter:!1,countDownloads:'path_extension:"setup.py"'},qwen3_tts:{prettyLabel:"Qwen3-TTS",repoName:"Qwen3-TTS",repoUrl:"https://github.com/QwenLM/Qwen3-TTS",snippets:Bu,filter:!1},recurrentgemma:{prettyLabel:"RecurrentGemma",repoName:"recurrentgemma",repoUrl:"https://github.com/google-deepmind/recurrentgemma",filter:!1,countDownloads:'path:"tokenizer.model"'},relik:{prettyLabel:"Relik",repoName:"Relik",repoUrl:"https://github.com/SapienzaNLP/relik",snippets:Lp,filter:!1},refiners:{prettyLabel:"Refiners",repoName:"Refiners",repoUrl:"https://github.com/finegrain-ai/refiners",docsUrl:"https://refine.rs/",filter:!1,countDownloads:'path:"model.safetensors"'},renderformer:{prettyLabel:"RenderFormer",repoName:"RenderFormer",repoUrl:"https://github.com/microsoft/renderformer",snippets:Pp,filter:!1},reverb:{prettyLabel:"Reverb",repoName:"Reverb",repoUrl:"https://github.com/revdotcom/reverb",filter:!1},rkllm:{prettyLabel:"RKLLM",repoName:"RKLLM",repoUrl:"https://github.com/airockchip/rknn-llm",countDownloads:'path_extension:"rkllm"'},"robo-orchard-lab":{prettyLabel:"RoboOrchardLab",repoName:"RoboOrchardLab",repoUrl:"https://github.com/HorizonRobotics/RoboOrchardLab",filter:!1,countDownloads:'path_extension:"safetensors"'},saelens:{prettyLabel:"SAELens",repoName:"SAELens",repoUrl:"https://github.com/jbloomAus/SAELens",snippets:Np,filter:!1},sam2:{prettyLabel:"sam2",repoName:"sam2",repoUrl:"https://github.com/facebookresearch/segment-anything-2",filter:!1,snippets:Vp,countDownloads:'path_extension:"pt"'},"sam-3d-body":{prettyLabel:"SAM 3D Body",repoName:"SAM 3D Body",repoUrl:"https://github.com/facebookresearch/sam-3d-body",filter:!1,snippets:Kp,countDownloads:'path:"model_config.yaml"'},"sam-3d-objects":{prettyLabel:"SAM 3D Objects",repoName:"SAM 3D Objects",repoUrl:"https://github.com/facebookresearch/sam-3d-objects",filter:!1,snippets:zp,countDownloads:'path:"checkpoints/pipeline.yaml"'},same:{prettyLabel:"SAME",repoName:"SAME",repoUrl:"https://github.com/GengzeZhou/SAME",filter:!1,countDownloads:'path:"ckpt/SAME.pt" OR path:"pretrain/Attnq_pretrained_ckpt.pt"'},"sample-factory":{prettyLabel:"sample-factory",repoName:"sample-factory",repoUrl:"https://github.com/alex-petrenko/sample-factory",docsUrl:"https://huggingface.co/docs/hub/sample-factory",snippets:Wp,filter:!0,countDownloads:'path:"cfg.json"'},"sap-rpt-1-oss":{prettyLabel:"sap-rpt-1-oss",repoName:"sap-rpt-1-oss",repoUrl:"https://github.com/SAP-samples/sap-rpt-1-oss",countDownloads:'path_extension:"pt"',snippets:wd},sapiens:{prettyLabel:"sapiens",repoName:"sapiens",repoUrl:"https://github.com/facebookresearch/sapiens",filter:!1,countDownloads:'path_extension:"pt2" OR path_extension:"pth" OR path_extension:"onnx"'},sapiens2:{prettyLabel:"sapiens2",repoName:"sapiens2",repoUrl:"https://github.com/facebookresearch/sapiens2",filter:!1,countDownloads:'path_extension:"safetensors"'},seedvr:{prettyLabel:"SeedVR",repoName:"SeedVR",repoUrl:"https://github.com/ByteDance-Seed/SeedVR",filter:!1,countDownloads:'path_extension:"pth"'},"self-forcing":{prettyLabel:"SelfForcing",repoName:"SelfForcing",repoUrl:"https://github.com/guandeh17/Self-Forcing",filter:!1,countDownloads:'path_extension:"pt"'},"sentence-transformers":{prettyLabel:"sentence-transformers",repoName:"sentence-transformers",repoUrl:"https://github.com/UKPLab/sentence-transformers",docsUrl:"https://huggingface.co/docs/hub/sentence-transformers",snippets:Qp,filter:!0},setfit:{prettyLabel:"setfit",repoName:"setfit",repoUrl:"https://github.com/huggingface/setfit",docsUrl:"https://huggingface.co/docs/hub/setfit",snippets:Jp,filter:!0},sklearn:{prettyLabel:"Scikit-learn",repoName:"Scikit-learn",repoUrl:"https://github.com/scikit-learn/scikit-learn",snippets:qp,filter:!0,countDownloads:'path:"sklearn_model.joblib"'},spacy:{prettyLabel:"spaCy",repoName:"spaCy",repoUrl:"https://github.com/explosion/spaCy",docsUrl:"https://huggingface.co/docs/hub/spacy",snippets:Yp,filter:!0,countDownloads:'path_extension:"whl"'},"span-marker":{prettyLabel:"SpanMarker",repoName:"SpanMarkerNER",repoUrl:"https://github.com/tomaarsen/SpanMarkerNER",docsUrl:"https://huggingface.co/docs/hub/span_marker",snippets:Zp,filter:!0},speechbrain:{prettyLabel:"speechbrain",repoName:"speechbrain",repoUrl:"https://github.com/speechbrain/speechbrain",docsUrl:"https://huggingface.co/docs/hub/speechbrain",snippets:tu,filter:!0,countDownloads:'path:"hyperparams.yaml"'},"ssr-speech":{prettyLabel:"SSR-Speech",repoName:"SSR-Speech",repoUrl:"https://github.com/WangHelin1997/SSR-Speech",filter:!1,countDownloads:'path_extension:".pth"'},"stable-audio-tools":{prettyLabel:"Stable Audio Tools",repoName:"stable-audio-tools",repoUrl:"https://github.com/Stability-AI/stable-audio-tools.git",filter:!1,countDownloads:'path:"model.safetensors"',snippets:Fp},monkeyocr:{prettyLabel:"MonkeyOCR",repoName:"monkeyocr",repoUrl:"https://github.com/Yuliang-Liu/MonkeyOCR",filter:!1,countDownloads:'path:"Recognition/config.json"'},"diffusion-single-file":{prettyLabel:"Diffusion Single File",repoName:"diffusion-single-file",repoUrl:"https://github.com/comfyanonymous/ComfyUI",filter:!1,countDownloads:'path_extension:"safetensors"'},"seed-story":{prettyLabel:"SEED-Story",repoName:"SEED-Story",repoUrl:"https://github.com/TencentARC/SEED-Story",filter:!1,countDownloads:'path:"cvlm_llama2_tokenizer/tokenizer.model"',snippets:Dp},skala:{prettyLabel:"Skala",repoName:"Skala",repoUrl:"https://github.com/microsoft/skala",filter:!1,countDownloads:'path_extension:"fun"'},soloaudio:{prettyLabel:"SoloAudio",repoName:"SoloAudio",repoUrl:"https://github.com/WangHelin1997/SoloAudio",filter:!1,countDownloads:'path:"soloaudio_v2.pt"'},songbloom:{prettyLabel:"SongBloom",repoName:"SongBloom",repoUrl:"https://github.com/Cypress-Yang/SongBloom",filter:!1,countDownloads:'path_extension:"pt"'},"stable-baselines3":{prettyLabel:"stable-baselines3",repoName:"stable-baselines3",repoUrl:"https://github.com/huggingface/huggingface_sb3",docsUrl:"https://huggingface.co/docs/hub/stable-baselines3",snippets:lu,filter:!0,countDownloads:'path_extension:"zip"'},stanza:{prettyLabel:"Stanza",repoName:"stanza",repoUrl:"https://github.com/stanfordnlp/stanza",docsUrl:"https://huggingface.co/docs/hub/stanza",snippets:Gp,filter:!0,countDownloads:'path:"models/default.zip"'},supertonic:{prettyLabel:"Supertonic",repoName:"Supertonic",repoUrl:"https://github.com/supertone-inc/supertonic",snippets:_u,filter:!1},swarmformer:{prettyLabel:"SwarmFormer",repoName:"SwarmFormer",repoUrl:"https://github.com/takara-ai/SwarmFormer",snippets:ku,filter:!1},"synthefy-migas":{prettyLabel:"Migas",repoName:"Migas",repoUrl:"https://github.com/Synthefy/synthefy-migas",filter:!1,countDownloads:'path:"model.pt"'},"f5-tts":{prettyLabel:"F5-TTS",repoName:"F5-TTS",repoUrl:"https://github.com/SWivid/F5-TTS",filter:!1,countDownloads:'path_extension:"safetensors" OR path_extension:"pt"'},genmo:{prettyLabel:"Genmo",repoName:"Genmo",repoUrl:"https://github.com/genmoai/models",filter:!1,countDownloads:'path:"vae_stats.json"'},"tencent-song-generation":{prettyLabel:"SongGeneration",repoName:"SongGeneration",repoUrl:"https://github.com/tencent-ailab/songgeneration",filter:!1,countDownloads:'path:"ckpt/songgeneration_base/model.pt"'},tensorflowtts:{prettyLabel:"TensorFlowTTS",repoName:"TensorFlowTTS",repoUrl:"https://github.com/TensorSpeech/TensorFlowTTS",snippets:Up},tensorrt:{prettyLabel:"TensorRT",repoName:"TensorRT",repoUrl:"https://github.com/NVIDIA/TensorRT",countDownloads:'path_extension:"onnx"'},tabpfn:{prettyLabel:"TabPFN",repoName:"TabPFN",repoUrl:"https://github.com/PriorLabs/TabPFN"},terratorch:{prettyLabel:"TerraTorch",repoName:"TerraTorch",repoUrl:"https://github.com/IBM/terratorch",docsUrl:"https://ibm.github.io/terratorch/",filter:!1,countDownloads:'path_extension:"pt" OR path_extension:"ckpt"',snippets:nu},"tic-clip":{prettyLabel:"TiC-CLIP",repoName:"TiC-CLIP",repoUrl:"https://github.com/apple/ml-tic-clip",filter:!1,countDownloads:'path_extension:"pt" AND path_prefix:"checkpoints/"'},timesfm:{prettyLabel:"TimesFM",repoName:"timesfm",repoUrl:"https://github.com/google-research/timesfm",filter:!1,countDownloads:'path:"checkpoints/checkpoint_1100000/state/checkpoint" OR path:"checkpoints/checkpoint_2150000/state/checkpoint" OR path_extension:"ckpt"'},timm:{prettyLabel:"timm",repoName:"pytorch-image-models",repoUrl:"https://github.com/rwightman/pytorch-image-models",docsUrl:"https://huggingface.co/docs/hub/timm",snippets:Mp,filter:!0,countDownloads:'path:"pytorch_model.bin" OR path:"model.safetensors"'},tirex:{prettyLabel:"TiRex",repoName:"TiRex",repoUrl:"https://github.com/NX-AI/tirex",countDownloads:'path_extension:"ckpt"'},torchgeo:{prettyLabel:"TorchGeo",repoName:"TorchGeo",repoUrl:"https://github.com/microsoft/torchgeo",docsUrl:"https://torchgeo.readthedocs.io/",filter:!1,countDownloads:'path_extension:"pt" OR path_extension:"pth"'},transformers:{prettyLabel:"Transformers",repoName:"🤗/transformers",repoUrl:"https://github.com/huggingface/transformers",docsUrl:"https://huggingface.co/docs/hub/transformers",snippets:Wa,filter:!0},"transformers.js":{prettyLabel:"Transformers.js",repoName:"transformers.js",repoUrl:"https://github.com/huggingface/transformers.js",docsUrl:"https://huggingface.co/docs/hub/transformers-js",snippets:ou,filter:!0},trellis:{prettyLabel:"Trellis",repoName:"Trellis",repoUrl:"https://github.com/microsoft/TRELLIS",countDownloads:'path_extension:"safetensors"'},trellis2:{prettyLabel:"TRELLIS.2",repoName:"TRELLIS.2",repoUrl:"https://github.com/microsoft/TRELLIS.2",countDownloads:'path_extension:"safetensors"'},ultralytics:{prettyLabel:"ultralytics",repoName:"ultralytics",repoUrl:"https://github.com/ultralytics/ultralytics",docsUrl:"https://github.com/ultralytics/ultralytics",filter:!1,countDownloads:'path_extension:"pt"',snippets:ra},univa:{prettyLabel:"univa",repoName:"univa",repoUrl:"https://github.com/PKU-YuanGroup/UniWorld-V1",snippets:Au,filter:!0,countDownloads:'path:"config.json"'},"uni-3dar":{prettyLabel:"Uni-3DAR",repoName:"Uni-3DAR",repoUrl:"https://github.com/dptech-corp/Uni-3DAR",docsUrl:"https://github.com/dptech-corp/Uni-3DAR",countDownloads:'path_extension:"pt"'},"unity-sentis":{prettyLabel:"unity-sentis",repoName:"unity-sentis",repoUrl:"https://github.com/Unity-Technologies/sentis-samples",snippets:pu,filter:!0,countDownloads:'path_extension:"sentis"'},sana:{prettyLabel:"Sana",repoName:"Sana",repoUrl:"https://github.com/NVlabs/Sana",countDownloads:'path_extension:"pth"',snippets:uu},videoprism:{prettyLabel:"VideoPrism",repoName:"VideoPrism",repoUrl:"https://github.com/google-deepmind/videoprism",countDownloads:'path_extension:"npz"',snippets:fu},"vfi-mamba":{prettyLabel:"VFIMamba",repoName:"VFIMamba",repoUrl:"https://github.com/MCG-NJU/VFIMamba",countDownloads:'path_extension:"pkl"',snippets:hu},vismatch:{prettyLabel:"VisMatch",repoName:"VisMatch",repoUrl:"https://github.com/gmberton/vismatch",filter:!1,countDownloads:'path:"vismatch.yaml"'},lvface:{prettyLabel:"LVFace",repoName:"LVFace",repoUrl:"https://github.com/bytedance/LVFace",countDownloads:'path_extension:"pt" OR path_extension:"onnx"',snippets:gu},voicecraft:{prettyLabel:"VoiceCraft",repoName:"VoiceCraft",repoUrl:"https://github.com/jasonppy/VoiceCraft",docsUrl:"https://github.com/jasonppy/VoiceCraft",snippets:yu},voxcpm:{prettyLabel:"VoxCPM",repoName:"VoxCPM",repoUrl:"https://github.com/OpenBMB/VoxCPM",snippets:bu,filter:!1},vui:{prettyLabel:"Vui",repoName:"Vui",repoUrl:"https://github.com/vui-ai/vui",countDownloads:'path_extension:"pt"',snippets:vu},vibevoice:{prettyLabel:"VibeVoice",repoName:"VibeVoice",repoUrl:"https://github.com/microsoft/VibeVoice",snippets:mu,filter:!1},videox_fun:{prettyLabel:"VideoX Fun",repoName:"VideoX Fun",repoUrl:"https://github.com/aigc-apps/VideoX-Fun",filter:!1,countDownloads:'path_extension:"safetensors"'},"wan2.2":{prettyLabel:"Wan2.2",repoName:"Wan2.2",repoUrl:"https://github.com/Wan-Video/Wan2.2",countDownloads:'path_filename:"config" AND path_extension:"json"'},wham:{prettyLabel:"WHAM",repoName:"wham",repoUrl:"https://huggingface.co/microsoft/wham",docsUrl:"https://huggingface.co/microsoft/wham/blob/main/README.md",countDownloads:'path_extension:"ckpt"'},whisperkit:{prettyLabel:"WhisperKit",repoName:"WhisperKit",repoUrl:"https://github.com/argmaxinc/WhisperKit",docsUrl:"https://github.com/argmaxinc/WhisperKit?tab=readme-ov-file#homebrew",snippets:Ku,countDownloads:'path_filename:"model" AND path_extension:"mil" AND _exists_:"path_prefix"'},yolov10:{prettyLabel:"YOLOv10",repoName:"YOLOv10",repoUrl:"https://github.com/THU-MIG/yolov10",docsUrl:"https://github.com/THU-MIG/yolov10",countDownloads:'path_extension:"pt" OR path_extension:"safetensors"',snippets:ra},yolov26:{prettyLabel:"YOLOv26",repoName:"YOLOv26",repoUrl:"https://github.com/ultralytics/ultralytics",docsUrl:"https://docs.ultralytics.com/models/yolo26/",countDownloads:'path_extension:"pt" OR path_extension:"safetensors"'},zonos:{prettyLabel:"Zonos",repoName:"Zonos",repoUrl:"https://github.com/Zyphra/Zonos",docsUrl:"https://github.com/Zyphra/Zonos",snippets:Xu,filter:!1},"3dtopia-xl":{prettyLabel:"3DTopia-XL",repoName:"3DTopia-XL",repoUrl:"https://github.com/3DTopia/3DTopia-XL",filter:!1,countDownloads:'path:"model_vae_fp16.pt"',snippets:Wu}};Object.entries(Ju).filter(([e,t])=>t.filter).map(([e])=>e);var D;(function(e){e[e.F32=0]="F32",e[e.F16=1]="F16",e[e.Q4_0=2]="Q4_0",e[e.Q4_1=3]="Q4_1",e[e.Q4_1_SOME_F16=4]="Q4_1_SOME_F16",e[e.Q4_2=5]="Q4_2",e[e.Q4_3=6]="Q4_3",e[e.Q8_0=7]="Q8_0",e[e.Q5_0=8]="Q5_0",e[e.Q5_1=9]="Q5_1",e[e.Q2_K=10]="Q2_K",e[e.Q3_K_S=11]="Q3_K_S",e[e.Q3_K_M=12]="Q3_K_M",e[e.Q3_K_L=13]="Q3_K_L",e[e.Q4_K_S=14]="Q4_K_S",e[e.Q4_K_M=15]="Q4_K_M",e[e.Q5_K_S=16]="Q5_K_S",e[e.Q5_K_M=17]="Q5_K_M",e[e.Q6_K=18]="Q6_K",e[e.IQ2_XXS=19]="IQ2_XXS",e[e.IQ2_XS=20]="IQ2_XS",e[e.Q2_K_S=21]="Q2_K_S",e[e.IQ3_XS=22]="IQ3_XS",e[e.IQ3_XXS=23]="IQ3_XXS",e[e.IQ1_S=24]="IQ1_S",e[e.IQ4_NL=25]="IQ4_NL",e[e.IQ3_S=26]="IQ3_S",e[e.IQ3_M=27]="IQ3_M",e[e.IQ2_S=28]="IQ2_S",e[e.IQ2_M=29]="IQ2_M",e[e.IQ4_XS=30]="IQ4_XS",e[e.IQ1_M=31]="IQ1_M",e[e.BF16=32]="BF16",e[e.Q4_0_4_4=33]="Q4_0_4_4",e[e.Q4_0_4_8=34]="Q4_0_4_8",e[e.Q4_0_8_8=35]="Q4_0_8_8",e[e.TQ1_0=36]="TQ1_0",e[e.TQ2_0=37]="TQ2_0",e[e.MXFP4_MOE=38]="MXFP4_MOE",e[e.NVFP4=39]="NVFP4",e[e.Q1_0=40]="Q1_0",e[e.Q2_K_XL=1e3]="Q2_K_XL",e[e.Q3_K_XL=1001]="Q3_K_XL",e[e.Q4_K_XL=1002]="Q4_K_XL",e[e.Q5_K_XL=1003]="Q5_K_XL",e[e.Q6_K_XL=1004]="Q6_K_XL",e[e.Q8_K_XL=1005]="Q8_K_XL"})(D||(D={}));const Yu=Object.values(D).filter(e=>typeof e=="string");new RegExp(`(?<prefix>UD-)?(?<quant>${Yu.join("|")})(_(?<sizeVariation>[A-Z]+))?`);D.F32,D.BF16,D.F16,D.Q8_K_XL,D.Q8_0,D.Q6_K_XL,D.Q6_K,D.Q5_K_XL,D.Q5_K_M,D.Q5_K_S,D.Q5_0,D.Q5_1,D.Q4_K_XL,D.Q4_K_M,D.Q4_K_S,D.IQ4_NL,D.IQ4_XS,D.Q4_0_4_4,D.Q4_0_4_8,D.Q4_0_8_8,D.Q4_1_SOME_F16,D.Q4_0,D.Q4_1,D.Q4_2,D.Q4_3,D.MXFP4_MOE,D.NVFP4,D.Q3_K_XL,D.Q3_K_L,D.Q3_K_M,D.Q3_K_S,D.IQ3_M,D.IQ3_S,D.IQ3_XS,D.IQ3_XXS,D.Q2_K_XL,D.Q2_K,D.Q2_K_S,D.IQ2_M,D.IQ2_S,D.IQ2_XS,D.IQ2_XXS,D.IQ1_S,D.IQ1_M,D.TQ1_0,D.TQ2_0,D.Q1_0;var la;(function(e){e[e.F32=0]="F32",e[e.F16=1]="F16",e[e.Q4_0=2]="Q4_0",e[e.Q4_1=3]="Q4_1",e[e.Q5_0=6]="Q5_0",e[e.Q5_1=7]="Q5_1",e[e.Q8_0=8]="Q8_0",e[e.Q8_1=9]="Q8_1",e[e.Q2_K=10]="Q2_K",e[e.Q3_K=11]="Q3_K",e[e.Q4_K=12]="Q4_K",e[e.Q5_K=13]="Q5_K",e[e.Q6_K=14]="Q6_K",e[e.Q8_K=15]="Q8_K",e[e.IQ2_XXS=16]="IQ2_XXS",e[e.IQ2_XS=17]="IQ2_XS",e[e.IQ3_XXS=18]="IQ3_XXS",e[e.IQ1_S=19]="IQ1_S",e[e.IQ4_NL=20]="IQ4_NL",e[e.IQ3_S=21]="IQ3_S",e[e.IQ2_S=22]="IQ2_S",e[e.IQ4_XS=23]="IQ4_XS",e[e.I8=24]="I8",e[e.I16=25]="I16",e[e.I32=26]="I32",e[e.I64=27]="I64",e[e.F64=28]="F64",e[e.IQ1_M=29]="IQ1_M",e[e.BF16=30]="BF16",e[e.TQ1_0=34]="TQ1_0",e[e.TQ2_0=35]="TQ2_0",e[e.MXFP4=39]="MXFP4",e[e.NVFP4=40]="NVFP4",e[e.Q1_0=41]="Q1_0"})(la||(la={}));var ca;(function(e){e[e.BLACKWELL_ULTRA=12.1]="BLACKWELL_ULTRA",e[e.BLACKWELL_RTX=12]="BLACKWELL_RTX",e[e.BLACKWELL=10]="BLACKWELL",e[e.HOPPER=9]="HOPPER",e[e.ADA_LOVELACE=8.9]="ADA_LOVELACE",e[e.ORIN=8.7]="ORIN",e[e.AMPERE_RTX=8.6]="AMPERE_RTX",e[e.AMPERE=8]="AMPERE",e[e.TURING=7.5]="TURING",e[e.XAVIER=7.2]="XAVIER",e[e.VOLTA=7]="VOLTA",e[e.PASCAL_TEGRA=6.2]="PASCAL_TEGRA",e[e.PASCAL=6.1]="PASCAL",e[e.PASCAL_DATACENTER=6]="PASCAL_DATACENTER",e[e.MAXWELL=5.3]="MAXWELL"})(ca||(ca={}));const Zu={js:{fetch:{basic:`async function query(data) {
	const response = await fetch(
		"{{ fullUrl }}",
		{
			headers: {
				Authorization: "{{ authorizationHeader }}",
				"Content-Type": "application/json",
{% if billTo %}
				"X-HF-Bill-To": "{{ billTo }}",
{% endif %}			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}

query({ inputs: {{ providerInputs.asObj.inputs }} }).then((response) => {
    console.log(JSON.stringify(response));
});`,basicAudio:`async function query(data) {
	const response = await fetch(
		"{{ fullUrl }}",
		{
			headers: {
				Authorization: "{{ authorizationHeader }}",
				"Content-Type": "audio/flac",
{% if billTo %}
				"X-HF-Bill-To": "{{ billTo }}",
{% endif %}			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}

query({ inputs: {{ providerInputs.asObj.inputs }} }).then((response) => {
    console.log(JSON.stringify(response));
});`,basicImage:`async function query(data) {
	const response = await fetch(
		"{{ fullUrl }}",
		{
			headers: {
				Authorization: "{{ authorizationHeader }}",
				"Content-Type": "image/jpeg",
{% if billTo %}
				"X-HF-Bill-To": "{{ billTo }}",
{% endif %}			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}

query({ inputs: {{ providerInputs.asObj.inputs }} }).then((response) => {
    console.log(JSON.stringify(response));
});`,conversational:`async function query(data) {
	const response = await fetch(
		"{{ fullUrl }}",
		{
			headers: {
				Authorization: "{{ authorizationHeader }}",
				"Content-Type": "application/json",
{% if billTo %}
				"X-HF-Bill-To": "{{ billTo }}",
{% endif %}			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}

query({ 
{{ autoInputs.asTsString }}
}).then((response) => {
    console.log(JSON.stringify(response));
});`,imageToImage:`const image = fs.readFileSync("{{inputs.asObj.inputs}}");

async function query(data) {
	const response = await fetch(
		"{{ fullUrl }}",
		{
			headers: {
				Authorization: "{{ authorizationHeader }}",
				"Content-Type": "image/jpeg",
{% if billTo %}
				"X-HF-Bill-To": "{{ billTo }}",
{% endif %}			},
			method: "POST",
			body: {
				"inputs": \`data:image/png;base64,\${data.inputs.encode("base64")}\`,
				"parameters": data.parameters,
			}
		}
	);
	const result = await response.json();
	return result;
}

query({ 
	inputs: image,
	parameters: {
		prompt: "{{ inputs.asObj.parameters.prompt }}",
	}
}).then((response) => {
    console.log(JSON.stringify(response));
});`,imageToVideo:`const image = fs.readFileSync("{{inputs.asObj.inputs}}");

async function query(data) {
	const response = await fetch(
		"{{ fullUrl }}",
		{
			headers: {
				Authorization: "{{ authorizationHeader }}",
				"Content-Type": "image/jpeg",
{% if billTo %}
				"X-HF-Bill-To": "{{ billTo }}",
{% endif %}			},
			method: "POST",
			body: {
				"image_url": \`data:image/png;base64,\${data.image.encode("base64")}\`,
				"prompt": data.prompt,
			}
		}
	);
	const result = await response.json();
	return result;
}

query({
	"image": image,
	"prompt": "{{inputs.asObj.parameters.prompt}}",
}).then((response) => {
    // Use video
});`,textToAudio:`{% if model.library_name == "transformers" %}
async function query(data) {
	const response = await fetch(
		"{{ fullUrl }}",
		{
			headers: {
				Authorization: "{{ authorizationHeader }}",
				"Content-Type": "application/json",
{% if billTo %}
				"X-HF-Bill-To": "{{ billTo }}",
{% endif %}			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.blob();
    return result;
}

query({ inputs: {{ providerInputs.asObj.inputs }} }).then((response) => {
    // Returns a byte object of the Audio wavform. Use it directly!
});
{% else %}
async function query(data) {
	const response = await fetch(
		"{{ fullUrl }}",
		{
			headers: {
				Authorization: "{{ authorizationHeader }}",
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
    const result = await response.json();
    return result;
}

query({ inputs: {{ providerInputs.asObj.inputs }} }).then((response) => {
    console.log(JSON.stringify(response));
});
{% endif %} `,textToImage:`async function query(data) {
	const response = await fetch(
		"{{ fullUrl }}",
		{
			headers: {
				Authorization: "{{ authorizationHeader }}",
				"Content-Type": "application/json",
{% if billTo %}
				"X-HF-Bill-To": "{{ billTo }}",
{% endif %}			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.blob();
	return result;
}


query({ {{ providerInputs.asTsString }} }).then((response) => {
    // Use image
});`,textToSpeech:`{% if model.library_name == "transformers" %}
async function query(data) {
	const response = await fetch(
		"{{ fullUrl }}",
		{
			headers: {
				Authorization: "{{ authorizationHeader }}",
				"Content-Type": "application/json",
{% if billTo %}
				"X-HF-Bill-To": "{{ billTo }}",
{% endif %}			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.blob();
    return result;
}

query({ text: {{ inputs.asObj.inputs }} }).then((response) => {
    // Returns a byte object of the Audio wavform. Use it directly!
});
{% else %}
async function query(data) {
	const response = await fetch(
		"{{ fullUrl }}",
		{
			headers: {
				Authorization: "{{ authorizationHeader }}",
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
    const result = await response.json();
    return result;
}

query({ text: {{ inputs.asObj.inputs }} }).then((response) => {
    console.log(JSON.stringify(response));
});
{% endif %} `,zeroShotClassification:`async function query(data) {
    const response = await fetch(
		"{{ fullUrl }}",
        {
            headers: {
				Authorization: "{{ authorizationHeader }}",
                "Content-Type": "application/json",
{% if billTo %}
                "X-HF-Bill-To": "{{ billTo }}",
{% endif %}         },
            method: "POST",
            body: JSON.stringify(data),
        }
    );
    const result = await response.json();
    return result;
}

query({
    inputs: {{ providerInputs.asObj.inputs }},
    parameters: { candidate_labels: ["refund", "legal", "faq"] }
}).then((response) => {
    console.log(JSON.stringify(response));
});`},"huggingface.js":{basic:`import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient("{{ accessToken }}");

const output = await client.{{ methodName }}({
{% if endpointUrl %}
    endpointUrl: "{{ endpointUrl }}",
{% endif %}
	model: "{{ model.id }}",
	inputs: {{ inputs.asObj.inputs }},
	provider: "{{ provider }}",
}{% if billTo %}, {
	billTo: "{{ billTo }}",
}{% endif %});

console.log(output);`,basicAudio:`import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient("{{ accessToken }}");

const data = fs.readFileSync({{inputs.asObj.inputs}});

const output = await client.{{ methodName }}({
{% if endpointUrl %}
    endpointUrl: "{{ endpointUrl }}",
{% endif %}
	data,
	model: "{{ model.id }}",
	provider: "{{ provider }}",
}{% if billTo %}, {
	billTo: "{{ billTo }}",
}{% endif %});

console.log(output);`,basicImage:`import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient("{{ accessToken }}");

const data = fs.readFileSync({{inputs.asObj.inputs}});

const output = await client.{{ methodName }}({
{% if endpointUrl %}
    endpointUrl: "{{ endpointUrl }}",
{% endif %}
	data,
	model: "{{ model.id }}",
	provider: "{{ provider }}",
}{% if billTo %}, {
	billTo: "{{ billTo }}",
}{% endif %});

console.log(output);`,conversational:`import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient("{{ accessToken }}");

const chatCompletion = await client.chatCompletion({
{% if endpointUrl %}
    endpointUrl: "{{ endpointUrl }}",
{% endif %}
{% if directRequest %}
    provider: "{{ provider }}",
    model: "{{ model.id }}",
{% else %}
    model: "{{ providerModelId }}",
{% endif %}
{{ inputs.asTsString }}
}{% if billTo %}, {
    billTo: "{{ billTo }}",
}{% endif %});

console.log(chatCompletion.choices[0].message);`,conversationalStream:`import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient("{{ accessToken }}");

let out = "";

const stream = client.chatCompletionStream({
{% if endpointUrl %}
    endpointUrl: "{{ endpointUrl }}",
{% endif %}
    model: "{{ providerModelId }}",
{{ inputs.asTsString }}
}{% if billTo %}, {
    billTo: "{{ billTo }}",
}{% endif %});

for await (const chunk of stream) {
	if (chunk.choices && chunk.choices.length > 0) {
		const newContent = chunk.choices[0].delta.content;
		out += newContent;
		console.log(newContent);
	}
}`,imageToImage:`import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient("{{ accessToken }}");

const data = fs.readFileSync("{{inputs.asObj.inputs}}");

const image = await client.imageToImage({
{% if endpointUrl %}
	endpointUrl: "{{ endpointUrl }}",
{% endif %}
	provider: "{{provider}}",
	model: "{{model.id}}",
	inputs: data,
	parameters: { prompt: "{{inputs.asObj.parameters.prompt}}", },
}{% if billTo %}, {
	billTo: "{{ billTo }}",
}{% endif %});
/// Use the generated image (it's a Blob)
// For example, you can save it to a file or display it in an image element
`,imageToVideo:`import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient("{{ accessToken }}");

const data = fs.readFileSync("{{inputs.asObj.inputs}}");

const video = await client.imageToVideo({
{% if endpointUrl %}
	endpointUrl: "{{ endpointUrl }}",
{% endif %}
	provider: "{{provider}}",
	model: "{{model.id}}",
	inputs: data,
	parameters: { prompt: "{{inputs.asObj.parameters.prompt}}", },
}{% if billTo %}, {
	billTo: "{{ billTo }}",
}{% endif %});

/// Use the generated video (it's a Blob)
// For example, you can save it to a file or display it in a video element
`,textToImage:`import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient("{{ accessToken }}");

const image = await client.textToImage({
{% if endpointUrl %}
    endpointUrl: "{{ endpointUrl }}",
{% endif %}
    provider: "{{ provider }}",
    model: "{{ model.id }}",
	inputs: {{ inputs.asObj.inputs }},
	parameters: { num_inference_steps: 5 },
}{% if billTo %}, {
    billTo: "{{ billTo }}",
}{% endif %});
/// Use the generated image (it's a Blob)`,textToSpeech:`import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient("{{ accessToken }}");

const audio = await client.textToSpeech({
{% if endpointUrl %}
    endpointUrl: "{{ endpointUrl }}",
{% endif %}
    provider: "{{ provider }}",
    model: "{{ model.id }}",
	inputs: {{ inputs.asObj.inputs }},
}{% if billTo %}, {
    billTo: "{{ billTo }}",
}{% endif %});
// Use the generated audio (it's a Blob)`,textToVideo:`import { InferenceClient } from "@huggingface/inference";

const client = new InferenceClient("{{ accessToken }}");

const video = await client.textToVideo({
{% if endpointUrl %}
    endpointUrl: "{{ endpointUrl }}",
{% endif %}
    provider: "{{ provider }}",
    model: "{{ model.id }}",
	inputs: {{ inputs.asObj.inputs }},
}{% if billTo %}, {
    billTo: "{{ billTo }}",
}{% endif %});
// Use the generated video (it's a Blob)`},openai:{conversational:`import { OpenAI } from "openai";

const client = new OpenAI({
	baseURL: "{{ baseUrl }}",
	apiKey: "{{ accessToken }}",
{% if billTo %}
	defaultHeaders: {
		"X-HF-Bill-To": "{{ billTo }}" 
	}
{% endif %}
});

const chatCompletion = await client.chat.completions.create({
	model: "{{ providerModelId }}",
{{ inputs.asTsString }}
});

console.log(chatCompletion.choices[0].message);`,conversationalStream:`import { OpenAI } from "openai";

const client = new OpenAI({
	baseURL: "{{ baseUrl }}",
	apiKey: "{{ accessToken }}",
{% if billTo %}
    defaultHeaders: {
		"X-HF-Bill-To": "{{ billTo }}" 
	}
{% endif %}
});

const stream = await client.chat.completions.create({
    model: "{{ providerModelId }}",
{{ inputs.asTsString }}
    stream: true,
});

for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
}`}},python:{fal_client:{imageToImage:`{%if provider == "fal-ai" %}
import fal_client
import base64

def on_queue_update(update):
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
           print(log["message"])

with open("{{inputs.asObj.inputs}}", "rb") as image_file:
    image_base_64 = base64.b64encode(image_file.read()).decode('utf-8')

result = fal_client.subscribe(
    "fal-ai/flux-kontext/dev",
    arguments={
        "prompt": f"data:image/png;base64,{image_base_64}",
        "image_url": "{{ providerInputs.asObj.inputs }}",
    },
    with_logs=True,
    on_queue_update=on_queue_update,
)
print(result)
{%endif%}
`,imageToVideo:`{%if provider == "fal-ai" %}
import fal_client
import base64

def on_queue_update(update):
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
           print(log["message"])

with open("{{inputs.asObj.inputs}}", "rb") as image_file:
    image_base_64 = base64.b64encode(image_file.read()).decode('utf-8')

result = fal_client.subscribe(
    "{{model.id}}",
    arguments={
        "image_url": f"data:image/png;base64,{image_base_64}",
        "prompt": "{{inputs.asObj.parameters.prompt}}",
    },
    with_logs=True,
    on_queue_update=on_queue_update,
)
print(result)
{%endif%}
`,textToImage:`{% if provider == "fal-ai" %}
import fal_client

{% if providerInputs.asObj.loras is defined and providerInputs.asObj.loras != none %}
result = fal_client.subscribe(
    "{{ providerModelId }}",
    arguments={
        "prompt": {{ inputs.asObj.inputs }},
        "loras":{{ providerInputs.asObj.loras | tojson }},
    },
)
{% else %}
result = fal_client.subscribe(
    "{{ providerModelId }}",
    arguments={
        "prompt": {{ inputs.asObj.inputs }},
    },
)
{% endif %} 
print(result)
{% endif %} `},huggingface_hub:{basic:`result = client.{{ methodName }}(
    {{ inputs.asObj.inputs }},
    model="{{ model.id }}",
)`,basicAudio:'output = client.{{ methodName }}({{ inputs.asObj.inputs }}, model="{{ model.id }}")',basicImage:'output = client.{{ methodName }}({{ inputs.asObj.inputs }}, model="{{ model.id }}")',conversational:`completion = client.chat.completions.create(
{% if directRequest %}
    model="{{ model.id }}",
{% else %}
    model="{{ providerModelId }}",
{% endif %}
{{ inputs.asPythonString }}
)

print(completion.choices[0].message) `,conversationalStream:`stream = client.chat.completions.create(
    model="{{ providerModelId }}",
{{ inputs.asPythonString }}
    stream=True,
)

for chunk in stream:
    print(chunk.choices[0].delta.content, end="") `,documentQuestionAnswering:`output = client.document_question_answering(
    "{{ inputs.asObj.image }}",
    question="{{ inputs.asObj.question }}",
    model="{{ model.id }}",
) `,imageToImage:`with open("{{ inputs.asObj.inputs }}", "rb") as image_file:
   input_image = image_file.read()

# output is a PIL.Image object
image = client.image_to_image(
    input_image,
    prompt="{{ inputs.asObj.parameters.prompt }}",
    model="{{ model.id }}",
)
`,imageToVideo:`with open("{{ inputs.asObj.inputs }}", "rb") as image_file:
   input_image = image_file.read()

video = client.image_to_video(
    input_image,
    prompt="{{ inputs.asObj.parameters.prompt }}",
    model="{{ model.id }}",
) 
`,importInferenceClient:`from huggingface_hub import InferenceClient

client = InferenceClient(
{% if endpointUrl %}
    base_url="{{ baseUrl }}",
{% endif %}
{% if task != "conversational" or directRequest %}
    provider="{{ provider }}",
{% endif %}
    api_key="{{ accessToken }}",
{% if billTo %}
    bill_to="{{ billTo }}",
{% endif %}
)`,questionAnswering:`answer = client.question_answering(
    question="{{ inputs.asObj.question }}",
    context="{{ inputs.asObj.context }}",
    model="{{ model.id }}",
) `,tableQuestionAnswering:`answer = client.table_question_answering(
    query="{{ inputs.asObj.query }}",
    table={{ inputs.asObj.table }},
    model="{{ model.id }}",
) `,textToImage:`# output is a PIL.Image object
image = client.text_to_image(
    {{ inputs.asObj.inputs }},
    model="{{ model.id }}",
) `,textToSpeech:`# audio is returned as bytes
audio = client.text_to_speech(
    {{ inputs.asObj.inputs }},
    model="{{ model.id }}",
) 
`,textToVideo:`video = client.text_to_video(
    {{ inputs.asObj.inputs }},
    model="{{ model.id }}",
) `},openai:{conversational:`from openai import OpenAI

client = OpenAI(
    base_url="{{ baseUrl }}",
    api_key="{{ accessToken }}",
{% if billTo %}
    default_headers={
        "X-HF-Bill-To": "{{ billTo }}"
    }
{% endif %}
)

completion = client.chat.completions.create(
    model="{{ providerModelId }}",
{{ inputs.asPythonString }}
)

print(completion.choices[0].message) `,conversationalStream:`from openai import OpenAI

client = OpenAI(
    base_url="{{ baseUrl }}",
    api_key="{{ accessToken }}",
{% if billTo %}
    default_headers={
        "X-HF-Bill-To": "{{ billTo }}"
    }
{% endif %}
)

stream = client.chat.completions.create(
    model="{{ providerModelId }}",
{{ inputs.asPythonString }}
    stream=True,
)

for chunk in stream:
    print(chunk.choices[0].delta.content, end="")`},requests:{basic:`def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.json()

output = query({
    "inputs": {{ providerInputs.asObj.inputs }},
}) `,basicAudio:`def query(filename):
    with open(filename, "rb") as f:
        data = f.read()
    response = requests.post(API_URL, headers={"Content-Type": "audio/flac", **headers}, data=data)
    return response.json()

output = query({{ providerInputs.asObj.inputs }})`,basicImage:`def query(filename):
    with open(filename, "rb") as f:
        data = f.read()
    response = requests.post(API_URL, headers={"Content-Type": "image/jpeg", **headers}, data=data)
    return response.json()

output = query({{ providerInputs.asObj.inputs }})`,conversational:`def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.json()

response = query({
{{ autoInputs.asJsonString }}
})

print(response["choices"][0]["message"])`,conversationalStream:`def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload, stream=True)
    for line in response.iter_lines():
        if not line.startswith(b"data:"):
            continue
        if line.strip() == b"data: [DONE]":
            return
        yield json.loads(line.decode("utf-8").lstrip("data:").rstrip("/n"))

chunks = query({
{{ autoInputs.asJsonString }},
    "stream": True,
})

for chunk in chunks:
    print(chunk["choices"][0]["delta"]["content"], end="")`,documentQuestionAnswering:`def query(payload):
    with open(payload["image"], "rb") as f:
        img = f.read()
        payload["image"] = base64.b64encode(img).decode("utf-8")
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.json()

output = query({
    "inputs": {
        "image": "{{ inputs.asObj.image }}",
        "question": "{{ inputs.asObj.question }}",
    },
}) `,imageToImage:`
def query(payload):
    with open(payload["inputs"], "rb") as f:
        img = f.read()
        payload["inputs"] = base64.b64encode(img).decode("utf-8")
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.content

image_bytes = query({
{{ providerInputs.asJsonString }}
})

# You can access the image with PIL.Image for example
import io
from PIL import Image
image = Image.open(io.BytesIO(image_bytes)) `,imageToVideo:`
def query(payload):
    with open(payload["inputs"], "rb") as f:
        img = f.read()
        payload["inputs"] = base64.b64encode(img).decode("utf-8")
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.content

video_bytes = query({
{{ inputs.asJsonString }}
})
`,importRequests:`{% if importBase64 %}
import base64
{% endif %}
{% if importJson %}
import json
{% endif %}
import requests

API_URL = "{{ fullUrl }}"
headers = {
    "Authorization": "{{ authorizationHeader }}",
{% if billTo %}
    "X-HF-Bill-To": "{{ billTo }}"
{% endif %}
}`,tabular:`def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.content

response = query({
    "inputs": {
        "data": {{ providerInputs.asObj.inputs }}
    },
}) `,textToAudio:`{% if model.library_name == "transformers" %}
def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.content

audio_bytes = query({
    "inputs": {{ inputs.asObj.inputs }},
})
# You can access the audio with IPython.display for example
from IPython.display import Audio
Audio(audio_bytes)
{% else %}
def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.json()

audio, sampling_rate = query({
    "inputs": {{ inputs.asObj.inputs }},
})
# You can access the audio with IPython.display for example
from IPython.display import Audio
Audio(audio, rate=sampling_rate)
{% endif %} `,textToImage:`{% if provider == "hf-inference" %}
def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.content

image_bytes = query({
    "inputs": {{ providerInputs.asObj.inputs }},
})

# You can access the image with PIL.Image for example
import io
from PIL import Image
image = Image.open(io.BytesIO(image_bytes))
{% endif %}`,textToSpeech:`{% if model.library_name == "transformers" %}
def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.content

audio_bytes = query({
    "text": {{ inputs.asObj.inputs }},
})
# You can access the audio with IPython.display for example
from IPython.display import Audio
Audio(audio_bytes)
{% else %}
def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.json()

audio, sampling_rate = query({
    "text": {{ inputs.asObj.inputs }},
})
# You can access the audio with IPython.display for example
from IPython.display import Audio
Audio(audio, rate=sampling_rate)
{% endif %} `,zeroShotClassification:`def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.json()

output = query({
    "inputs": {{ providerInputs.asObj.inputs }},
    "parameters": {"candidate_labels": ["refund", "legal", "faq"]},
}) `,zeroShotImageClassification:`def query(data):
    with open(data["image_path"], "rb") as f:
        img = f.read()
    payload={
        "parameters": data["parameters"],
        "inputs": base64.b64encode(img).decode("utf-8")
    }
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.json()

output = query({
    "image_path": {{ providerInputs.asObj.inputs }},
    "parameters": {"candidate_labels": ["cat", "dog", "llama"]},
}) `}},sh:{curl:{basic:`curl {{ fullUrl }} \\
    -X POST \\
    -H 'Authorization: {{ authorizationHeader }}' \\
    -H 'Content-Type: application/json' \\
{% if billTo %}
    -H 'X-HF-Bill-To: {{ billTo }}' \\
{% endif %}
    -d '{
{{ providerInputs.asCurlString }}
    }'`,basicAudio:`curl {{ fullUrl }} \\
    -X POST \\
    -H 'Authorization: {{ authorizationHeader }}' \\
    -H 'Content-Type: audio/flac' \\
{% if billTo %}
    -H 'X-HF-Bill-To: {{ billTo }}' \\
{% endif %}
    --data-binary @{{ providerInputs.asObj.inputs }}`,basicImage:`curl {{ fullUrl }} \\
    -X POST \\
    -H 'Authorization: {{ authorizationHeader }}' \\
    -H 'Content-Type: image/jpeg' \\
{% if billTo %}
    -H 'X-HF-Bill-To: {{ billTo }}' \\
{% endif %}
    --data-binary @{{ providerInputs.asObj.inputs }}`,conversational:`curl {{ fullUrl }} \\
    -H 'Authorization: {{ authorizationHeader }}' \\
    -H 'Content-Type: application/json' \\
{% if billTo %}
    -H 'X-HF-Bill-To: {{ billTo }}' \\
{% endif %}
    -d '{
{{ autoInputs.asCurlString }},
        "stream": false
    }'`,conversationalStream:`curl {{ fullUrl }} \\
    -H 'Authorization: {{ authorizationHeader }}' \\
    -H 'Content-Type: application/json' \\
{% if billTo %}
    -H 'X-HF-Bill-To: {{ billTo }}' \\
{% endif %}
    -d '{
{{ autoInputs.asCurlString }},
        "stream": true
    }'`,zeroShotClassification:`curl {{ fullUrl }} \\
    -X POST \\
    -d '{"inputs": {{ providerInputs.asObj.inputs }}, "parameters": {"candidate_labels": ["refund", "legal", "faq"]}}' \\
    -H 'Content-Type: application/json' \\
    -H 'Authorization: {{ authorizationHeader }}'
{% if billTo %} \\
    -H 'X-HF-Bill-To: {{ billTo }}'
{% endif %}`}}},Xa=(e,t,n)=>{var o,i;const a=(i=(o=Zu[e])==null?void 0:o[t])==null?void 0:i[n];if(!a)throw new Error(`Template not found: ${e}/${t}/${n}`);return s=>new Pl(a).render({...s})};Xa("python","huggingface_hub","importInferenceClient");Xa("python","requests","importRequests");let Qa=null;async function Ja(){try{const e=await fetch("/bud-lite/qdrant-config.json");e.ok&&(Qa=await e.json())}catch{}}function An(){return Qa||{}}const Gu="https://proxy-hw1qvwkvqjc4.auggie-lahey.deno.net";function qt(){const e=ke(),t=An();return{url:typeof window<"u"?Gu:(e.qdrantUrl||t.url||"").replace(/\/$/,""),apiKey:"",collection:e.qdrantCollection||"nostr_rag"}}function em(){const e=ke();return{apiKey:e.llmApiKey||"",baseUrl:(e.llmBaseUrl||"https://api.z.ai/api/coding/paas/v4").replace(/\/$/,""),model:e.llmModel||"GLM-5.1"}}function tm(){const e=ke(),t=An();return{apiKey:e.hfApiKey||(t._h?t._h.split("").reverse().join(""):""),model:"mixedbread-ai/mxbai-embed-large-v1"}}async function Ft(e){return(await Ya([e]))[0]}async function Ya(e){const{apiKey:t,model:n}=tm();if(!t)throw new Error("HuggingFace API key required for search.");return await new $r(t).featureExtraction({model:n,inputs:e})}async function nm(e){var i;const{url:t,collection:n}=qt();if(!t)return{};const a=Sn(),o={};for(const s of e)try{const r=await fetch(`${t}/collections/${n}/points/count`,{method:"POST",headers:a,body:JSON.stringify({filter:{must:[{key:"pubkey",match:{value:s}}]},exact:!1})});if(r.ok){const c=await r.json();o[s]=((i=c.result)==null?void 0:i.count)||0}}catch{}return o}function Sn(){return qt(),{"Content-Type":"application/json"}}async function Ht(e,{limit:t=15,pubkeys:n=[]}={}){const{url:a,collection:o}=qt();if(!a)throw new Error("Qdrant URL not configured");const i={vector:e,limit:t,with_payload:!0};n.length&&(i.filter={must:[{key:"pubkey",match:{any:n}}]});const s=await fetch(`${a}/collections/${o}/points/search`,{method:"POST",headers:Sn(),body:JSON.stringify(i)});if(!s.ok){const c=await s.text().catch(()=>"");throw new Error(`Qdrant search failed (${s.status}): ${c}`)}return((await s.json()).result||[]).map(c=>({score:c.score,author:(c.payload||{}).author_label||((c.payload||{}).pubkey||"").slice(0,8),pubkey:(c.payload||{}).pubkey||"",content:(c.payload||{}).content||"",created_at:(c.payload||{}).created_at||0,hashtags:(c.payload||{}).hashtags||[],event_id:(c.payload||{}).event_id||"",kind:(c.payload||{}).kind,source_type:(c.payload||{}).source_type||""}))}async function am(){const{url:e,collection:t}=qt();if(!e)return null;try{const n=await fetch(`${e}/collections/${t}`,{headers:Sn()});return n.ok?(await n.json()).result:null}catch{return null}}async function Za(e,t){const{apiKey:n,baseUrl:a,model:o}=em();if(!n)throw new Error("LLM API key not configured");const i=a.includes("anthropic.com");if(a.includes("z.ai"),i){const l=await fetch(`${a}/v1/messages`,{method:"POST",headers:{"Content-Type":"application/json","x-api-key":n,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:o,max_tokens:1024,system:e,messages:[{role:"user",content:t}]})});if(!l.ok){const p=await l.text().catch(()=>"");throw new Error(`LLM call failed (${l.status}): ${p}`)}return(await l.json()).content[0].text}const s=a.endsWith("/v4")||a.endsWith("/v4/")?`${a}/chat/completions`:`${a}/v1/chat/completions`,r=await fetch(s,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${n}`},body:JSON.stringify({model:o,max_tokens:1024,messages:[{role:"system",content:e},{role:"user",content:t}]})});if(!r.ok){const l=await r.text().catch(()=>"");throw new Error(`LLM call failed (${r.status}): ${l}`)}return(await r.json()).choices[0].message.content}const Tn=`The notes below were retrieved via semantic search (vector similarity) against a database of Nostr posts. They are ranked by relevance to the user's query.

SYNTHESIZE and AGGREGATE information from the provided notes to answer the user's question. Do NOT just list or repeat the notes.

Rules:
- Read ALL the notes carefully and identify patterns, consensus, disagreements, and key insights.
- Form a direct, well-reasoned answer that draws from multiple notes when relevant.
- Cite which notes support your points by number (e.g. [3], [7]).
- If there are different opinions across notes, present the range of views.
- If the notes don't contain enough information, say so clearly rather than speculating.
- Never add information not present in the notes.
- Be concise but thorough.

If the retrieved notes are poorly matched to the question, end your response with:
"\\n\\n---\\n**Suggested search terms:** term1, term2, term3"
Suggest 3-5 alternative search queries that might yield better results from the same database.`;function Ga(e){return e.map((t,n)=>{const a=t.created_at?new Date(t.created_at*1e3).toISOString().split("T")[0]:"?",o=t.hashtags.length?` [#${t.hashtags.slice(0,3).join(", #")}]`:"",i=`${(t.score*100).toFixed(0)}%`,s=t.kind?` kind:${t.kind}`:"",r=t.event_id?` id:${t.event_id}`:"";return`[${n+1}] ${t.author} (${a})${o} relevance: ${i}${s}${r}
${t.content}`}).join(`

---

`)}async function eo(e){try{const t=await fetch("/bud-lite/soul-hints.json");if(!t.ok)return"";const n=await t.json(),a=n.hints||{},o=n.micros||{},i=n.labels||{},s=["=== Group Members (compact profiles) ==="],r=Object.keys(a).length?Object.keys(a):Object.keys(o);for(const c of r)if(!(e.length&&!e.includes(c)))if(a[c]){const l=a[c].split(`
`)[0].replace(/\*\*/g,"").trim()||c.slice(0,8);s.push(`**${l}**: ${a[c]}`)}else{const l=i[c]||c.slice(0,8),d=o[c]||"";s.push(`**${l}**: ${d}`)}return s.length>1?s.join(`
`):""}catch{return""}}function to(e,t,n){const a=new Set(t||[]),o=e.filter(p=>p.score>=.3),i=new Set(o.map(p=>p.pubkey)),s=[],r=a.size>0?a:new Set(e.map(p=>p.pubkey));for(const p of r)if(!i.has(p)){let f=null;for(const g of e)g.pubkey===p&&(!f||g.score>f.score)&&(f=g);f&&s.push(f)}const c=new Set,l=[];for(const p of[...o,...s]){const f=`${p.pubkey}:${p.content.slice(0,50)}`;c.has(f)||(c.add(f),l.push(p))}const d=o.length<e.length/2;return[l.slice(0,n),d]}async function no(e,{limit:t=10,pubkeys:n=[]}={}){const a=await Ft(e),o=await Ht(a,{limit:t,pubkeys:n});return{query:e,count:o.length,results:o}}async function ao(e,{limit:t=10,pubkeys:n=[]}={}){const a=await Ft(e),o=await Ht(a,{limit:t*3,pubkeys:n}),[i,s]=to(o,n,t);if(!i.length)return{question:e,answer:"No relevant notes found for your question.",sources:[]};const r=await eo(n),c=Ga(i);let l=Tn;s&&(l+=`

IMPORTANT: The retrieved notes have low relevance scores. Use the soul profiles and any tangentially relevant information to provide the best answer you can.`);const d=[];r&&d.push(r),d.push(`Here are the most relevant notes from the group:

${c}`),d.push(`Based on the above context, answer this question: ${e}`);const p=d.join(`

---

`),f=Math.floor((l.length+p.length)/4),g=p+`

---
[Token estimate: ~${f}]`,v=await Za(l,g);return{question:e,answer:v,sources:i.map(h=>({author:h.author,content:h.content,date:h.created_at,score:h.score,hashtags:h.hashtags,event_id:h.event_id,kind:h.kind})),system_prompt:l,user_prompt:g}}async function oo(e,{limit:t=10,pubkeys:n=[]}={}){const a=await Ft(e),o=await Ht(a,{limit:t*2,pubkeys:n}),[i,s]=to(o,n,t),r=await eo(n),c=i.length?Ga(i):"No notes retrieved.";let l=Tn;s&&(l+=`

IMPORTANT: The retrieved notes have low relevance scores.`);const d=[];r&&d.push(r),d.push(`Here are the most relevant notes from the group:

${c}`),d.push(`Based on the above context, answer this question: ${e}`);const p=d.join(`

---

`);return{system_prompt:l,user_prompt:p,notes_count:i.length,low_confidence:s,scores:i.map(f=>Math.round(f.score*1e3)/1e3)}}async function io(){return Tn}async function so(){try{const e=await fetch("/bud-lite/soul-hints.json");if(!e.ok)return[];const t=await e.json(),n=t.hints||{},a=t.micros||{},o=t.labels||{},i=t.pictures||{},s=Object.keys(n).length?Object.keys(n):Object.keys(a).length?Object.keys(a):Object.keys(o);return s.length?s.map(r=>({pubkey:r,name:o[r]||r.slice(0,8),label:o[r]||"",picture:i[r]||"",npub:om(r),micro:n[r]||a[r]||""})):[]}catch{return[]}}function om(e){const t="qpzry9x8gf2tvdw0s3jn54khce6mua7l",n=[];for(let d=0;d<e.length;d+=2)n.push(parseInt(e.substr(d,2),16));const a=[];let o=0,i=0;for(const d of n)for(o=o<<8|d,i+=8;i>=5;)i-=5,a.push(o>>>i&31);i>0&&a.push(o<<5-i&31);const s=[0,0,0,0,...a],r=sm(im("npub").concat(s).concat([0,0,0,0,0,0]))^1,c=[];for(let d=0;d<6;d++)c.push(r>>5*(5-d)&31);let l="npub1";for(const d of[...a,...c])l+=t[d];return l}function im(e){const t=[];for(let n=0;n<e.length;n++)t.push(e.charCodeAt(n)>>5);t.push(0);for(let n=0;n<e.length;n++)t.push(e.charCodeAt(n)&31);return t}function sm(e){const t=[996825010,642813549,513874426,1027748829,705979059];let n=1;for(const a of e){const o=n>>25;n=(n&33554431)<<5^a;for(let i=0;i<5;i++)o>>i&1&&(n^=t[i])}return n}function Ct(){const e=ke(),t=An();return{hf:!!(e.hfApiKey||(t._h?t._h.split("").reverse().join(""):"")),llm:!!e.llmApiKey,groq:!!e.groqApiKey,gemini:!!e.geminiApiKey,qdrant:!!(e.qdrantUrl||t.url)}}const rm=Object.freeze(Object.defineProperty({__proto__:null,askLLM:Za,countNotesPerPubkey:nm,embedText:Ft,embedTexts:Ya,getKeyStatus:Ct,getQdrantInfo:am,loadDeployedConfig:Ja,ragAsk:ao,ragGetPubkeys:so,ragGetSystemPrompt:io,ragPreview:oo,ragSearch:no,searchQdrant:Ht},Symbol.toStringTag,{value:"Module"}));function te(e){return(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function vt(e){return!e&&e!==0?"":e<1024?e+" B":e<1048576?(e/1024).toFixed(1)+" KB":e<1073741824?(e/1048576).toFixed(1)+" MB":(e/1073741824).toFixed(1)+" GB"}const Ye={video:"🎬",audio:"🎵",images:"🖼",software:"📦",web:"🌐",texts:"📄"};function Fe(e){const t=(e||"").toLowerCase();return t.startsWith("video/")?"video":t.startsWith("audio/")?"audio":t.startsWith("image/")?"images":t==="text/html"?"web":/zip|tar|gz|xz|7z|rar/.test(t)?"software":"texts"}function $e(e){const t=document.createElement("div");t.className="ia-toast",t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.remove(),1600)}function lm(e){const t=[],n=document.getElementById("ia-settings-fab"),a=document.getElementById("ia-settings-overlay"),o=document.getElementById("ia-settings-close"),i=document.getElementById("ia-settings-form");if(!n||!a||!i)return console.warn("[settings-modal] Required DOM elements not found"),()=>{};function s(){const d=ke();document.getElementById("set-archiver-npub").value=d.archiverNpub||"",document.getElementById("set-blossom-url").value=d.blossomUrl||"",document.getElementById("set-blossom-mirror").value=d.blossomMirror||"",document.getElementById("set-relays").value=d.relays||"",document.getElementById("set-manifest-dtag").value=d.manifestDtag||"archive",document.getElementById("set-rag-url").value=d.ragBackendUrl||"",document.getElementById("set-qdrant-url").value=d.qdrantUrl||"",document.getElementById("set-qdrant-key").value=d.qdrantApiKey||"",document.getElementById("set-qdrant-collection").value=d.qdrantCollection||"nostr_rag",document.getElementById("set-hf-key").value=d.hfApiKey||"",document.getElementById("set-llm-key").value=d.llmApiKey||"",document.getElementById("set-llm-base-url").value=d.llmBaseUrl||"https://api.z.ai/api/coding/paas/v4",document.getElementById("set-llm-model").value=d.llmModel||"GLM-5.1",document.getElementById("set-groq-key").value=d.groqApiKey||"",document.getElementById("set-gemini-key").value=d.geminiApiKey||"",a.classList.remove("hidden")}function r(){a.classList.add("hidden")}function c(d){d.target===a&&a.classList.add("hidden")}function l(d){d.preventDefault(),mn({archiverNpub:document.getElementById("set-archiver-npub").value.trim(),blossomUrl:document.getElementById("set-blossom-url").value.trim(),blossomMirror:document.getElementById("set-blossom-mirror").value.trim(),relays:document.getElementById("set-relays").value.trim(),manifestDtag:document.getElementById("set-manifest-dtag").value.trim()||"archive",ragBackendUrl:document.getElementById("set-rag-url").value.trim(),qdrantUrl:document.getElementById("set-qdrant-url").value.trim(),qdrantApiKey:document.getElementById("set-qdrant-key").value.trim(),qdrantCollection:document.getElementById("set-qdrant-collection").value.trim()||"nostr_rag",hfApiKey:document.getElementById("set-hf-key").value.trim(),llmApiKey:document.getElementById("set-llm-key").value.trim(),llmBaseUrl:document.getElementById("set-llm-base-url").value.trim()||"https://api.z.ai/api/coding/paas/v4",llmModel:document.getElementById("set-llm-model").value.trim()||"GLM-5.1",groqApiKey:document.getElementById("set-groq-key").value.trim(),geminiApiKey:document.getElementById("set-gemini-key").value.trim()}),a.classList.add("hidden"),$e("Settings saved")}return n.addEventListener("click",s),o.addEventListener("click",r),a.addEventListener("click",c),i.addEventListener("submit",l),t.push(()=>{n.removeEventListener("click",s),o.removeEventListener("click",r),a.removeEventListener("click",c),i.removeEventListener("submit",l)}),()=>t.forEach(d=>{try{d()}catch{}})}const cm="ia-sync-handles",wt="handles";function ro(){return new Promise((e,t)=>{const n=indexedDB.open(cm,1);n.onupgradeneeded=()=>n.result.createObjectStore(wt),n.onsuccess=()=>e(n.result),n.onerror=()=>t(n.error)})}async function dm(e){const t=await ro();return new Promise((n,a)=>{const i=t.transaction(wt,"readonly").objectStore(wt).get(e);i.onsuccess=()=>n(i.result),i.onerror=()=>a(i.error)})}async function pm(e,t){const n=await ro();return new Promise((a,o)=>{const i=n.transaction(wt,"readwrite");i.objectStore(wt).put(t,e),i.oncomplete=()=>a(),i.onerror=()=>o(i.error)})}async function mt(e,t,n,a){const o=await Ut(t),i={kind:24242,content:"nostr-archive: upload",created_at:Math.floor(Date.now()/1e3),tags:[["t","upload"],["x",o],["expiration",String(Math.floor(Date.now()/1e3)+600)]]};if(!window.nostr)throw new Error("No NIP-07 signer found. Install nos2x or Alby.");const s=await window.nostr.signEvent(i),r=JSON.stringify(s),c="Nostr "+btoa(r),l=await fetch(e.replace(/\/$/,"")+"/upload",{method:"PUT",headers:{Authorization:c,"Content-Type":a||"application/octet-stream"},body:t});if(!l.ok)throw new Error(`Blossom upload failed: ${l.status} ${await l.text()}`);const d=await l.json();return{sha256:o,size:t.byteLength,...d}}const um=[["application/pdf","texts"],["text/","texts"],["image/","images"],["audio/","audio"],["video/","video"],["application/zip","software"],["application/x-tar","software"],["application/gzip","software"]];function mm(e){for(const[t,n]of um)if(e.startsWith(t))return n;return"other"}function ft(){return ke().manifestDtag||"archive"}function fm(e){const t=[],n=document.getElementById("ingest-overlay"),a=document.getElementById("ingest-close"),o=document.getElementById("ingest-fab"),i=document.getElementById("ingest-form");if(!n||!i)return console.warn("[ingest-panel] Required DOM elements not found"),()=>{};let s="url",r=null,c=null,l=null,d=null;const p=document.getElementById("ingest-file-drop"),f=document.getElementById("ingest-file-input"),g=document.getElementById("ingest-file-name"),v=document.getElementById("ingest-sync-drop"),h=document.getElementById("ingest-folder-input"),x=document.getElementById("ingest-sync-info"),S=document.getElementById("ingest-sync-stored"),$=document.getElementById("ingest-sync-diff"),C=document.getElementById("ingest-sync-btn"),A=document.getElementById("ingest-sync-force"),L=document.getElementById("ingest-sync-force-label"),R=typeof window.showDirectoryPicker=="function";function j(){n.classList.remove("hidden")}function W(){n.classList.add("hidden")}function w(u){u.target===n&&n.classList.add("hidden")}o&&o.addEventListener("click",j),a.addEventListener("click",W),n.addEventListener("click",w),t.push(()=>{o&&o.removeEventListener("click",j),a.removeEventListener("click",W),n.removeEventListener("click",w)});function P(u){s=u,document.querySelectorAll(".ingest-tab").forEach(k=>k.classList.toggle("active",k.dataset.tab===u)),document.querySelectorAll(".ingest-panel").forEach(k=>k.classList.toggle("active",k.id===`ingest-panel-${u}`));const m=u==="sync";document.querySelectorAll("#ingest-form > .ingest-row").forEach(k=>k.style.display=m?"none":""),document.querySelectorAll("#ingest-form > .checkbox-label").forEach(k=>k.style.display=m?"none":"");const y=document.getElementById("ingest-btn");y&&(y.style.display=m?"none":"")}document.querySelectorAll(".ingest-tab").forEach(u=>{const m=()=>P(u.dataset.tab);u.addEventListener("click",m),t.push(()=>u.removeEventListener("click",m))});function U(u){P(u.detail.tab)}document.addEventListener("ia-switch-tab",U),t.push(()=>document.removeEventListener("ia-switch-tab",U));function N(u){r=u,g.textContent=`${u.name} (${(u.size/1048576).toFixed(1)} MB)`}if(p){const u=()=>f.click(),m=I=>{I.preventDefault(),p.classList.add("dragover")},y=()=>p.classList.remove("dragover"),k=I=>{I.preventDefault(),p.classList.remove("dragover"),I.dataTransfer.files.length&&N(I.dataTransfer.files[0])};p.addEventListener("click",u),p.addEventListener("dragover",m),p.addEventListener("dragleave",y),p.addEventListener("drop",k),t.push(()=>{p.removeEventListener("click",u),p.removeEventListener("dragover",m),p.removeEventListener("dragleave",y),p.removeEventListener("drop",k)})}if(f){const u=()=>{f.files.length&&N(f.files[0])};f.addEventListener("change",u),t.push(()=>f.removeEventListener("change",u))}async function H(u){const m=[];async function y(k,I){for await(const X of k.values())if(X.kind==="file"){const re=await X.getFile(),Ie=new File([re],re.name,{type:re.type,lastModified:re.lastModified});Object.defineProperty(Ie,"webkitRelativePath",{value:I+re.name,writable:!1}),Object.defineProperty(Ie,"size",{value:re.size}),m.push(Ie)}else X.kind==="directory"&&await y(X,I+X.name+"/")}return await y(u,u.name+"/"),m}async function ee(u){var k;if(!u.length)return;if(!window.nostr){$e("NIP-07 extension required");return}d=u;const m=((k=u[0].webkitRelativePath)==null?void 0:k.split("/")[0])||"folder",y=u.reduce((I,X)=>I+X.size,0);x.textContent=`${m} — ${u.length} files — ${vt(y)}`,$.textContent="Computing diff...",C.style.display="none",L.style.display="inline-flex";try{const I=[];for(const F of u){const oe=await F.arrayBuffer(),Ee=await Ut(oe),Le="/"+F.webkitRelativePath.split("/").slice(1).join("/");I.push({file:F,sha256:Ee,relativePath:Le,mime:F.type||"application/octet-stream",size:F.size})}const X=await window.nostr.getPublicKey(),Ie=ke().relays.split(",").map(F=>F.trim()).filter(Boolean),Oe=await bt(X,ft(),Ie),tt=Oe?it(Oe.content):{},pe=A&&A.checked,he=[],le=[],de=[];for(const F of I)if(pe)tt[F.relativePath]?le.push(F):he.push(F);else{const oe=tt[F.relativePath];oe?oe.sha256!==F.sha256?le.push(F):de.push(F):he.push(F)}c={toUpload:[...he,...le],unchanged:de};let J="";if(pe&&le.length>0&&(J+=`<div style="color:#fbbf24;margin-bottom:0.3em">Force re-sync: ${le.length} files will be re-uploaded</div>`),he.length>0){J+=`<div style="color:#6ee7b7;margin-bottom:0.3em">+ ${he.length} new</div>`;for(const F of he.slice(0,8))J+=`<div style="color:#6ee7b7;padding-left:1em">${te(F.relativePath)} <span style="color:#555">${vt(F.size)}</span></div>`;he.length>8&&(J+=`<div style="color:#555;padding-left:1em">+${he.length-8} more</div>`)}if(le.length>0&&!pe){J+=`<div style="color:#fbbf24;margin:0.5em 0 0.3em">~ ${le.length} changed</div>`;for(const F of le.slice(0,5))J+=`<div style="color:#fbbf24;padding-left:1em">${te(F.relativePath)}</div>`}de.length>0&&(J+=`<div style="color:#555;margin-top:0.5em">= ${de.length} unchanged (skipped)</div>`),c.toUpload.length===0?(J='<div style="color:#6ee7b7">All files up to date. Nothing to sync.</div>',$.innerHTML=J,L.style.display="inline-flex"):($.innerHTML=J,C.style.display="inline-block",L.style.display="inline-flex",C.textContent=`Sync ${c.toUpload.length} files`),localStorage.setItem("ia-sync-folder",m)}catch(I){$.innerHTML=`<div style="color:#f87171">Error: ${I.message}</div>`}}if((async()=>{if(R)try{const u=await dm("sync-dir-handle");u&&await u.queryPermission({mode:"read"})==="granted"&&(l=u,S.style.display="block",S.textContent=`Remembered folder: ${u.name} (click to re-sync)`,v.querySelector("div:last-child").textContent=u.name)}catch{}})(),v){const u=async()=>{if(R){if(l)try{if(await l.requestPermission({mode:"read"})==="granted"){$.textContent="Reading folder...";const y=await H(l);await ee(y);return}}catch{}try{const m=await window.showDirectoryPicker({mode:"read"});l=m,await pm("sync-dir-handle",m),S.style.display="block",S.textContent=`Folder saved: ${m.name} (remembered for next visit)`,v.querySelector("div:last-child").textContent=m.name;const y=await H(m);await ee(y)}catch(m){m.name!=="AbortError"&&console.warn("Directory picker error:",m)}}else h.click()};v.addEventListener("click",u),t.push(()=>v.removeEventListener("click",u))}if(S){const u=async()=>{if(l)try{if(await l.requestPermission({mode:"read"})!=="granted"){$e("Permission denied for folder access");return}$.textContent="Reading folder...";const y=await H(l);await ee(y)}catch(m){$.innerHTML=`<div style="color:#f87171">Error: ${m.message}</div>`}};S.addEventListener("click",u),S.style.cursor="pointer",t.push(()=>S.removeEventListener("click",u))}if(h){const u=()=>{h.files.length>0&&ee(Array.from(h.files))};h.addEventListener("change",u),t.push(()=>h.removeEventListener("change",u))}if(A){const u=()=>{d&&ee(d)};A.addEventListener("change",u),t.push(()=>A.removeEventListener("change",u))}if(C){const u=async()=>{if(!(!c||!window.nostr)){C.disabled=!0,C.textContent="Syncing...";try{const m=ke(),y=m.relays.split(",").map(le=>le.trim()).filter(Boolean),k=await window.nostr.getPublicKey(),I=await bt(k,ft(),y),X=I?it(I.content):{};for(let le=0;le<c.toUpload.length;le++){const de=c.toUpload[le],J=de.relativePath.split("/").pop();$.innerHTML+=`<div style="color:#fbbf24">${le+1}/${c.toUpload.length} ${te(J)}...</div>`,$.scrollTop=$.scrollHeight;const F=await de.file.arrayBuffer();if(await mt(m.blossomUrl,new Uint8Array(F),J,de.mime),m.blossomMirror)try{await mt(m.blossomMirror,new Uint8Array(F),J,de.mime)}catch{}console.log(`[sync] uploaded ${le+1}/${c.toUpload.length}: ${de.relativePath} sha=${de.sha256.slice(0,12)}`),X[de.relativePath]={title:J,sha256:de.sha256,mime:de.mime,size:de.size,added:Math.floor(Date.now()/1e3)}}const re=rn(X),Ie=await on(re),Oe=[...re,["d",ft()],["x",Ie,"aggregate"],["title","Personal Archive"],["server",m.blossomUrl]];m.blossomMirror&&Oe.push(["server",m.blossomMirror]);const tt=await window.nostr.signEvent({kind:35128,content:sn(X),created_at:Math.floor(Date.now()/1e3),tags:Oe});console.log("[sync] Signed manifest event:",tt.id,"entries:",Object.keys(X).length);const pe=await ot(tt,y),he=pe.filter(le=>le.ok).length;$.innerHTML+=`<div style="color:#6ee7b7;margin-top:0.5em">Done! ${c.toUpload.length} files synced. Manifest published to ${he}/${pe.length} relays.</div>`,C.textContent="Synced!",c=null,A&&(A.checked=!1)}catch(m){$.innerHTML+=`<div style="color:#f87171">Error: ${m.message}</div>`,C.disabled=!1,C.textContent="Retry Sync"}}};C.addEventListener("click",u),t.push(()=>C.removeEventListener("click",u))}const be=localStorage.getItem("ia-last-folder");if(be){const u=document.getElementById("ingest-folder");u&&(u.value=be)}function ae(u,m,y){const k=document.getElementById("ingest-steps"),I=m?"✓":"✗",X=m?"#6ee7b7":"#f87171";k.innerHTML+=`<div class="ingest-step" style="color:${X}">${I} ${y}</div>`}const ne=async u=>{u.preventDefault();const m=document.getElementById("ingest-btn"),y=document.getElementById("ingest-progress"),k=document.getElementById("ingest-steps"),I=document.getElementById("ingest-current"),X=document.getElementById("ingest-title").value.trim(),re=document.getElementById("ingest-folder").value.trim(),Ie=(document.getElementById("ingest-topics").value.trim()||"").split(",").map(pe=>pe.trim()).filter(Boolean),Oe=document.getElementById("ingest-source-kind").value;if(re&&localStorage.setItem("ia-last-folder",re),s==="url"){const pe=document.getElementById("ingest-url").value.trim();if(!pe)return;if(!window.nostr||!window.nostr.signEvent){$e("Install a Nostr signer extension (nos2x, Alby, etc) to flag URLs");return}const he=ke();m.disabled=!0,m.textContent="Flagging...",I.textContent="",y.style.display="block",k.innerHTML="";try{const le=[`**URL:** ${pe}`,X?`**Title:** ${X}`:"",re?`**Folder:** ${re}`:"",Oe?`**Source kind:** ${Oe}`:"",Ie.length?`**Topics:** ${Ie.join(", ")}`:""].filter(Boolean).join(`
`),de=X||`[archive] ${pe}`,J=Math.floor(Date.now()/1e3),F=[["subject",de],["t","archive"],["r",pe],...Ie.map(Ce=>["t",Ce]),["alt",`Archive flag: ${de}`]];if(he.archiverNpub){const Ce=No(he.archiverNpub);Ce&&F.push(["p",Ce])}const oe={kind:1621,content:le,tags:F,created_at:J},Ee=await window.nostr.signEvent(oe);ae("sign",!0,"Signed issue event");const Ae=he.relays.split(",").map(Ce=>Ce.trim()).filter(Boolean),Le=await ot(Ee,Ae),dt=Le.filter(Ce=>Ce.ok).length;if(dt>0){const Ce=Le.filter(Be=>Be.ok).map(Be=>{try{return new URL(Be.url).hostname}catch{return Be.url}}).join(", ");ae("publish",!0,`Published to ${dt}/${Le.length} relays (${Ce})`),ae("event",!0,`Event ID: ${Ee.id}`),I.innerHTML=`Flagged for archiving! Event ID: <code style="color:#6ee7b7">${Ee.id.slice(0,12)}...</code>`}else{const Ce=Le.map(Be=>{try{return`${new URL(Be.url).hostname}: ${Be.message}`}catch{return`${Be.url}: ${Be.message}`}}).join("; ");ae("publish",!1,`Failed: ${Ce}`),ae("event",!0,`Event ID: ${Ee.id}`),I.textContent="Failed to publish to any relay"}m.disabled=!1,m.textContent="Flag this URL"}catch(le){I.textContent=`Error: ${le.message}`,m.disabled=!1,m.textContent="Flag this URL"}}else{let J=function(F,oe,Ee){const Ae=de[F];if(!Ae)return;const Le=Ae.querySelector(".ingest-step-icon"),dt=Ae.querySelector(".ingest-step-detail");oe==="running"?(Ae.className="ingest-step ingest-step-running",Le.textContent="●"):oe==="done"?(Ae.className="ingest-step ingest-step-done",Le.textContent="✓"):oe==="error"&&(Ae.className="ingest-step ingest-step-error",Le.textContent="✗"),Ee&&(dt.textContent=Ee),I.textContent=`${F}: ${oe}`};var tt=J;if(!r){$e("Select a file first");return}const pe=ke(),he=pe.relays.split(",").map(F=>F.trim()).filter(Boolean);m.disabled=!0,m.textContent="Uploading...",y.style.display="block",k.innerHTML="",I.textContent="";const le=[{key:"hash",label:"Compute hash"},{key:"upload",label:"Upload to Blossom"},{key:"manifest",label:"Build manifest"},{key:"sign",label:"Sign events"},{key:"publish",label:"Publish to relays"},{key:"nsite",label:"Update archive manifest"}],de={};for(const F of le){const oe=document.createElement("div");oe.className="ingest-step ingest-step-pending",oe.innerHTML=`<span class="ingest-step-icon">○</span> <span class="ingest-step-label">${F.label}</span> <span class="ingest-step-detail"></span>`,k.appendChild(oe),de[F.key]=oe}try{J("hash","running");const F=await r.arrayBuffer(),oe=await Ut(F),Ee=r.type||"application/octet-stream",Ae=r.name,Le=r.size;J("hash","done",oe),J("upload","running");const dt=await mt(pe.blossomUrl,new Uint8Array(F),Ae,Ee);if(J("upload","done",vt(Le)),pe.blossomMirror)try{await mt(pe.blossomMirror,new Uint8Array(F),Ae,Ee)}catch{}J("manifest","running");const yo={version:"1.0",type:"archive-bundle",title:X||Ae,source:{kind:Oe||"webpage",url:""},blobs:[{x:oe,role:"source",filename:Ae,m:Ee,size:Le}]},bo=new TextEncoder().encode(JSON.stringify(yo,null,2)+`
`),Et=await mt(pe.blossomUrl,bo,"manifest.json","application/json");J("manifest","done",Et.sha256),J("sign","running");const vo={kind:1115,content:"",created_at:Math.floor(Date.now()/1e3),tags:[["x",oe],["x",Et.sha256],["primary",Et.sha256,String(Et.size)]]},Lt=await window.nostr.signEvent(vo);J("sign","done",`Bridge: ${Lt.id}`);const Xt=[["e",Lt.id],["title",X||Ae]],Qt=re||mm(Ee);Qt&&Xt.push(["t",Qt]);const Rn=document.getElementById("ingest-topics");if(Rn&&Rn.value.trim())for(const Pe of Ie)Xt.push(["t",Pe]);const wo={kind:1116,content:"",created_at:Math.floor(Date.now()/1e3),tags:Xt},Jt=await window.nostr.signEvent(wo);J("publish","running");const xo=await ot(Lt,he),_o=await ot(Jt,he),Un=[...xo,..._o],ko=Un.filter(Pe=>Pe.ok).length,Ao=Un.filter(Pe=>Pe.ok).map(Pe=>{try{return new URL(Pe.url).hostname}catch{return Pe.url}}),So=[...new Set(Ao)];J("publish","done",`${ko}/${he.length*2} ok (${So.join(", ")})`),ae("event",!0,`Index: ${Jt.id}`),J("nsite","running");try{const Pe=await window.nostr.getPublicKey(),Mn=await bt(Pe,ft(),he),Yt=Mn?it(Mn.content):{},To=`/${Qt}/${Ae}`;Yt[To]={title:X||Ae,added:Math.floor(Date.now()/1e3),source:{kind:Oe||"webpage",url:""},topics:Ie,bridge_event_id:Lt.id,index_event_id:Jt.id,sha256:oe,mime:Ee,size:Le};const Nn=rn(Yt),Io=await on(Nn),Dn=[...Nn,["d",ft()],["x",Io,"aggregate"],["title","Personal Archive"],["server",pe.blossomUrl]];pe.blossomMirror&&Dn.push(["server",pe.blossomMirror]);const Eo={kind:35128,content:sn(Yt),created_at:Math.floor(Date.now()/1e3),tags:Dn},Lo=await window.nostr.signEvent(Eo),jn=await ot(Lo,he),Po=jn.filter($o=>$o.ok).length;J("nsite","done",`Manifest published to ${Po}/${jn.length} relays`)}catch(Pe){console.warn("Nsite manifest publish failed:",Pe),J("nsite","error",Pe.message)}I.textContent="Upload complete! Close this panel and refresh to see the new item.",m.disabled=!1,m.textContent="Archive this URL"}catch(F){I.textContent=`Error: ${F.message}`,m.disabled=!1,m.textContent="Archive this URL";for(const oe of Object.keys(de))de[oe].classList.contains("ingest-step-running")&&J(oe,"error",F.message)}}};return i.addEventListener("submit",ne),t.push(()=>i.removeEventListener("submit",ne)),()=>t.forEach(u=>{try{u()}catch{}})}function hm(e){const t={name:"/",children:{},items:[]};for(const[n,a]of Object.entries(e)){const o=n.split("/").filter(Boolean);if(o.length<=1)t.items.push({path:n,name:o[0]||n,...a});else{let i=t;for(let s=0;s<o.length-1;s++)i.children[o[s]]||(i.children[o[s]]={name:o[s],children:{},items:[]}),i=i.children[o[s]];i.items.push({path:n,name:o[o.length-1],...a})}}return t}function lo(e){let t=e.items.length;for(const n of Object.values(e.children))t+=lo(n);return t}function gm(e){return e?e<1024?e+" B":e<1048576?(e/1024).toFixed(1)+" KB":(e/1048576).toFixed(1)+" MB":""}function co(e,t){let n="";for(const[a,o]of Object.entries(e.children).sort()){const i=lo(o);n+=`<div class="ia-tree-folder">
      <div class="ia-tree-folder-header" onclick="this.parentElement.classList.toggle('open')">${a} <span style="color:#555;font-weight:400;font-size:0.75rem">(${i})</span></div>
      <div class="ia-tree-folder-children">${co(o)}</div>
    </div>`}for(const a of e.items){const o=gm(a.size),i=a.added?new Date(a.added*1e3).toLocaleDateString():"";n+=`<div class="ia-tree-item" data-path="${a.path}" data-sha256="${a.sha256}" title="${a.path}">
      <span class="ia-tree-item-title">${a.title||a.name}</span>
      <span class="ia-tree-item-meta">${o}${i?" &middot; "+i:""}</span>
    </div>`}return n}function ym(e){const t=[],n=document.getElementById("ia-archive-fab"),a=document.getElementById("ia-archive-overlay"),o=document.getElementById("ia-archive-close"),i=document.getElementById("ia-archive-status"),s=document.getElementById("ia-archive-tree");if(!n||!a)return console.warn("[archive-browser] Required DOM elements not found"),()=>{};async function r(){if(i.textContent="Loading...",s.innerHTML="",!window.nostr||!window.nostr.getPublicKey){i.textContent="Login with NIP-07 extension to view your archive";return}try{const g=await window.nostr.getPublicKey(),v=ke(),h=v.relays.split(",").map(R=>R.trim()).filter(Boolean);i.textContent=`Fetching manifest for ${g.slice(0,8)}...`;const x=await bt(g,v.manifestDtag||"archive",h);if(console.log("[archive] pubkey:",g,"dtag:",v.manifestDtag,"relays:",h),console.log("[archive] manifest found:",x?x.id:"null"),x&&console.log("[archive] manifest content:",x.content),!x){i.textContent="No archive found. Upload files to create your personal archive.",s.innerHTML='<div class="ia-tree-empty">Your archive is empty</div>';return}let S={};try{S=JSON.parse(x.content||"{}").entries||{}}catch{for(const R of x.tags)R[0]==="path"&&R[1]&&R[2]&&(S[R[1]]={sha256:R[2],title:R[1].split("/").pop()})}const $=Object.keys(S).length,C=new Date(x.created_at*1e3).toLocaleString();if(i.textContent=`${$} items, updated ${C}`,$===0){s.innerHTML='<div class="ia-tree-empty">Archive is empty</div>';return}const A=hm(S);s.innerHTML=co(A,0);const L=s.querySelector(".ia-tree-folder");L&&L.classList.add("open"),s.querySelectorAll(".ia-tree-item").forEach(R=>{const j=()=>{const W=R.dataset.sha256,U=`${ke().blossomUrl||"https://blossom.primal.net"}/${W}`;window.open(U,"_blank")};R.addEventListener("click",j),t.push(()=>R.removeEventListener("click",j))})}catch(g){i.textContent=`Error: ${g.message}`}}function c(){a.classList.remove("hidden"),r()}function l(){a.classList.add("hidden")}function d(g){g.target===a&&a.classList.add("hidden")}function p(){a.classList.add("hidden");const g=document.getElementById("ingest-overlay");g&&g.classList.remove("hidden"),document.dispatchEvent(new CustomEvent("ia-switch-tab",{detail:{tab:"sync"}}))}n.addEventListener("click",c),o&&o.addEventListener("click",l),a.addEventListener("click",d);const f=document.getElementById("ia-archive-sync-btn");return f&&f.addEventListener("click",p),t.push(()=>{n.removeEventListener("click",c),o&&o.removeEventListener("click",l),a.removeEventListener("click",d),f&&f.removeEventListener("click",p)}),()=>t.forEach(g=>{try{g()}catch{}})}const bm="modulepreload",vm=function(e){return"/bud-lite/"+e},da={},wm=function(t,n,a){let o=Promise.resolve();if(n&&n.length>0){let s=function(l){return Promise.all(l.map(d=>Promise.resolve(d).then(p=>({status:"fulfilled",value:p}),p=>({status:"rejected",reason:p}))))};document.getElementsByTagName("link");const r=document.querySelector("meta[property=csp-nonce]"),c=(r==null?void 0:r.nonce)||(r==null?void 0:r.getAttribute("nonce"));o=s(n.map(l=>{if(l=vm(l),l in da)return;da[l]=!0;const d=l.endsWith(".css"),p=d?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${l}"]${p}`))return;const f=document.createElement("link");if(f.rel=d?"stylesheet":bm,d||(f.as="script"),f.crossOrigin="",f.href=l,c&&f.setAttribute("nonce",c),document.head.appendChild(f),d)return new Promise((g,v)=>{f.addEventListener("load",g),f.addEventListener("error",()=>v(new Error(`Unable to preload CSS for ${l}`)))})}))}function i(s){const r=new Event("vite:preloadError",{cancelable:!0});if(r.payload=s,window.dispatchEvent(r),!r.defaultPrevented)throw s}return o.then(s=>{for(const r of s||[])r.status==="rejected"&&i(r.reason);return t().catch(i)})};function xe(e){return(e||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function xm(e){let t=xe(e);return t=t.replace(/^### (.+)$/gm,"<h4>$1</h4>"),t=t.replace(/^## (.+)$/gm,"<h3>$1</h3>"),t=t.replace(/^# (.+)$/gm,"<h3>$1</h3>"),t=t.replace(/\*\*\*(.+?)\*\*\*/g,"<strong><em>$1</em></strong>"),t=t.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),t=t.replace(new RegExp("(?<!\\*)\\*(.+?)\\*(?!\\*)","g"),"<em>$1</em>"),t=t.replace(/`([^`]+)`/g,"<code>$1</code>"),t=t.replace(/^[\-•] (.+)$/gm,"<li>$1</li>"),t=t.replace(/(<li>.*<\/li>)/gs,"<ul>$1</ul>"),t=t.replace(/^\d+\. (.+)$/gm,"<li>$1</li>"),t=t.replace(/\n\n/g,"</p><p>"),t=t.replace(/\n/g,"<br>"),t.startsWith("<")||(t="<p>"+t+"</p>"),t}function _m(e,t){return e.replace(/\[(\d+)\]/g,(n,a)=>`<a class="ia-cite" href="javascript:void(0)" data-msg="${t}" data-idx="${parseInt(a)-1}" onclick="window.__scrollToSource(this)">[${a}]</a>`)}function pa(e,t){return e?"https://primal.net/e/"+e:""}function ua(e){return e.endsWith("?")||/^(what|who|how|why|when|where|which|can|does|is|are|do|tell|explain)/i.test(e)}function ma(e,t){if(!e&&!t)return"";let n='<div class="ia-prompt-section">';return n+=`<div class="ia-sources-header" onclick="this.nextElementSibling.classList.toggle('open')">Prompt ▾</div>`,n+='<div class="ia-prompt-body">',e&&(n+=`<div style="padding:0.5em;border-bottom:1px solid #222"><span class="ia-prompt-label">SYSTEM</span><pre>${xe(e)}</pre></div>`),t&&(n+=`<div style="padding:0.5em"><span class="ia-prompt-label">USER</span><pre>${xe(t)}</pre></div>`),n+="</div></div>",n}window.__scrollToSource=function(e){const t=e.getAttribute("data-msg"),n=e.getAttribute("data-idx"),a=document.getElementById("sources-body-"+t);a&&(a.style.display="block"),setTimeout(()=>{const o=document.getElementById("src-"+t+"-"+n);o&&(o.scrollIntoView({behavior:"smooth",block:"center"}),o.style.background="#2a3a5f")},50)};const po="rag-chat-sessions";function Qe(){try{return JSON.parse(localStorage.getItem(po)||"{}")}catch{return{}}}function Pt(e){localStorage.setItem(po,JSON.stringify(e))}function km(e){return Qe()[e]||{id:e,created:Date.now(),messages:[]}}function Am(e){const t=Ct();e.innerHTML=`
    <div class="ia-chat-page">
      <div class="ia-chat-user-bar" id="rag-user-bar">
        <span class="ub-label">Filter:</span>
      </div>
      <div class="ia-chat-history-bar" id="rag-history-bar">
        <span class="hb-label">Sessions:</span>
        <button class="ia-new-session-btn" id="rag-new-session">+ New</button>
      </div>
      <div class="ia-chat-messages" id="rag-chat"></div>
      <div class="ia-chat-input-bar">
        <textarea id="rag-input" placeholder="Search or ask a question..." rows="1"></textarea>
        <button id="rag-ask-btn" ${t.qdrant?"":'disabled title="Qdrant not configured"'}>Ask</button>
      </div>
    </div>
  `;const n=e.querySelector("#rag-chat"),a=e.querySelector("#rag-input"),o=e.querySelector("#rag-ask-btn"),i=e.querySelector("#rag-user-bar"),s=e.querySelector("#rag-history-bar");let r=[],c=new Set,l=null,d=0,p="";io().then(w=>{p=w}).catch(()=>{}),Ct().llm||j();async function g(){try{r=await so(),c=new Set(r.map(w=>w.pubkey)),x(),h()}catch(w){console.error("Failed to load pubkeys:",w)}}let v={};async function h(){if(r.length)try{const{countNotesPerPubkey:w}=await wm(async()=>{const{countNotesPerPubkey:P}=await Promise.resolve().then(()=>rm);return{countNotesPerPubkey:P}},void 0);v=await w(r.map(P=>P.pubkey)),x()}catch{}}function x(){i.querySelectorAll(".ia-user-chip").forEach(w=>w.remove());for(const w of r){const P=document.createElement("span");P.className="ia-user-chip "+(c.has(w.pubkey)?"active":"inactive");const U=w.label||w.name||w.pubkey.slice(0,8),N=xe(U[0].toUpperCase()),H=v[w.pubkey],ee=H!==void 0?`<span class="ia-chip-count">${H}</span>`:"",be=w.picture?`<img src="${xe(w.picture)}" class="pfp-img"><span class="no-pfp">${N}</span>`:`<span class="no-pfp">${N}</span>`,ae=`#/${w.npub||w.pubkey.slice(0,12)}`,ne=`https://primal.net/p/${w.pubkey}`,u=w.micro?xe(w.micro.slice(0,300))+(w.micro.length>300?"...":""):"",m=u?`<div class="ia-chip-tooltip">${u}<br><a href="${ae}" onclick="event.stopPropagation()" style="color:#6ee7b7">View distilled profile</a> · <a href="${ne}" target="_blank" onclick="event.stopPropagation()" style="color:#93c5fd">Nostr ↗</a></div>`:`<div class="ia-chip-tooltip"><a href="${ae}" onclick="event.stopPropagation()" style="color:#6ee7b7">View profile</a> · <a href="${ne}" target="_blank" onclick="event.stopPropagation()" style="color:#93c5fd">Nostr ↗</a></div>`;P.innerHTML=be+`<span>${xe(U)}</span>${ee}`+m,P.onclick=()=>{if(c.has(w.pubkey)){if(c.size<=1)return;c.delete(w.pubkey)}else c.add(w.pubkey);x()},i.appendChild(P)}}function S(){return c.size===r.length?[]:Array.from(c)}g();function $(){s.querySelectorAll(".ia-session-tab").forEach(U=>U.remove());const w=Qe(),P=Object.keys(w).sort((U,N)=>w[N].created-w[U].created);for(const U of P){const N=w[U],H=document.createElement("span");H.className="ia-session-tab"+(U===l?" active":"");const ee=N.messages.length?N.messages[0].text.slice(0,25):"Empty";H.innerHTML=xe(ee)+(U===l?"":` <span class="tab-close" onclick="event.stopPropagation();window.__deleteRagSession('${U}')">×</span>`),H.onclick=()=>R(U),s.insertBefore(H,s.querySelector("#rag-new-session"))}}window.__deleteRagSession=function(w){const P=Qe();delete P[w],Pt(P),w===l&&(l=null,L()),$()};function C(){if(!l)return;const w=[];n.querySelectorAll(".ia-chat-msg").forEach(U=>{const N=U.classList.contains("user");w.push({type:N?"user":"ai",text:N?U.textContent:"",html:N?"":U.innerHTML})});const P=Qe();P[l]||(P[l]={id:l,created:Date.now()}),P[l].messages=w,Pt(P)}function A(w,P,U){const N=document.createElement("div");if(N.className="ia-chat-msg "+w,N.innerHTML=P,w==="ai"){const H=document.createElement("button");H.className="ia-copy-btn",H.textContent="copy",H.onclick=function(){const ee=N.querySelector(".ia-answer-block")||N;navigator.clipboard.writeText(ee.textContent.trim()).then(()=>{H.textContent="copied",setTimeout(()=>{H.textContent="copy"},1500)})},N.appendChild(H)}if(n.appendChild(N),n.scrollTop=n.scrollHeight,U&&l){const H=Qe();H[l]||(H[l]={id:l,created:Date.now(),messages:[]}),H[l].messages.push({type:w,text:w==="user"?N.textContent:"",html:w==="user"?"":N.innerHTML}),Pt(H),$()}}function L(){l&&C(),l="s"+Date.now();const w=Qe();w[l]={id:l,created:Date.now(),messages:[]},Pt(w),n.innerHTML="",d=0,A("ai",'Search or ask questions about indexed Nostr notes. Try: <em>"what is the best hardware wallet?"</em> or <em>"lightning network"</em>',!1),$()}function R(w){l&&C(),l=w;const P=km(w);n.innerHTML="",d=0;for(const U of P.messages)d++,U.type==="user"?A("user",xe(U.text),!1):A("ai",U.html,!1);P.messages.length||(n.innerHTML="",A("ai",'Search or ask questions about indexed Nostr notes. Try: <em>"what is the best hardware wallet?"</em> or <em>"lightning network"</em>',!1)),$()}(function(){const w=Qe(),P=Object.keys(w).sort((U,N)=>w[N].created-w[U].created);P.length?R(P[0]):L(),$()})(),e.querySelector("#rag-new-session").onclick=L;function j(){const w=document.getElementById("ia-key-modal");w&&w.remove();const P=ke(),U=!!P.llmApiKey,N=document.createElement("div");N.id="ia-key-modal",N.style.cssText="position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6)",N.innerHTML=`
      <div style="background:#1a1a2e;border:1px solid #333;border-radius:12px;padding:1.5em;max-width:440px;width:90%">
        <h3 style="margin:0 0 0.5em;color:#6ee7b7;font-size:1rem">Setup Required</h3>
        <p style="color:#888;font-size:0.75rem;margin:0 0 1em">
          Enter your LLM API key to generate answers. Key stored in your browser only.
        </p>
        <label style="display:block;margin-bottom:0.6em">
          <span style="color:#aaa;font-size:0.75rem">LLM API Key ${U?"✓":'<span style="color:#f87171">required</span>'}</span>
          <input id="ia-key-input" type="password" placeholder="Your API key" ${U?'value="••••••••"':""}
            style="width:100%;padding:0.5em 0.7em;margin-top:0.2em;background:#0f1117;border:1px solid ${U?"#333":"#f87171"};border-radius:6px;color:#ddd;font-size:0.9rem;box-sizing:border-box">
        </label>
        <label style="display:block;margin-bottom:0.6em">
          <span style="color:#aaa;font-size:0.75rem">API Endpoint</span>
          <input id="ia-key-url" type="text" placeholder="https://api.z.ai/api/coding/paas/v4"
            style="width:100%;padding:0.5em 0.7em;margin-top:0.2em;background:#0f1117;border:1px solid #444;border-radius:6px;color:#ddd;font-size:0.9rem;box-sizing:border-box">
        </label>
        <label style="display:block;margin-bottom:0.6em">
          <span style="color:#aaa;font-size:0.75rem">Model</span>
          <input id="ia-key-model" type="text" placeholder="GLM-5.1"
            style="width:100%;padding:0.5em 0.7em;margin-top:0.2em;background:#0f1117;border:1px solid #444;border-radius:6px;color:#ddd;font-size:0.9rem;box-sizing:border-box">
        </label>
        <div style="display:flex;gap:0.5em;margin-top:0.5em;justify-content:flex-end">
          <button id="ia-key-cancel" style="padding:0.4em 1em;background:transparent;border:1px solid #444;border-radius:6px;color:#888;cursor:pointer">Cancel</button>
          <button id="ia-key-save" style="padding:0.4em 1em;background:#6ee7b7;border:none;border-radius:6px;color:#0f1117;cursor:pointer;font-weight:600">Save</button>
        </div>
      </div>`,document.body.appendChild(N);const H=N.querySelector("#ia-key-input"),ee=N.querySelector("#ia-key-url"),be=N.querySelector("#ia-key-model");U&&(ee.value=P.llmBaseUrl),U&&(be.value=P.llmModel),H.focus(),N.querySelector("#ia-key-cancel").onclick=()=>{N.remove()},N.querySelector("#ia-key-save").onclick=()=>{const ae=ke(),ne=H.value.trim();ne&&ne!=="••••••••"&&(ae.llmApiKey=ne),ee.value.trim()&&(ae.llmBaseUrl=ee.value.trim()),be.value.trim()&&(ae.llmModel=be.value.trim()),mn(ae),N.remove()},N.onclick=ae=>{ae.target===N&&N.remove()}}async function W(){const w=a.value.trim();if(!w)return;if(!Ct().llm&&ua(w)){j();return}a.value="",a.style.height="auto",o.disabled=!0;const U="m"+ ++d,N=S();if(A("user",xe(w)+'<div id="prompt-'+U+'">'+ma(p,"")+"</div>",!0),ua(w)){var H=null,ee=document.getElementById("prompt-"+U);try{if(H=await oo(w,{pubkeys:N}),ee){var be=ee.querySelector(".ia-prompt-body"),ae=be&&be.classList.contains("open");if(ee.innerHTML=ma(H.system_prompt,H.user_prompt),ae){var ne=ee.querySelector(".ia-prompt-body");ne&&ne.classList.add("open")}}}catch(u){console.error("Preview failed:",u)}A("ai",'<span class="ia-typing">Thinking</span>',!1);try{const u=await ao(w,{pubkeys:N});n.lastChild.remove();let m=xm(u.answer);m=_m(m,U);let y="";if(u.sources&&u.sources.length){y='<div class="ia-sources-section">',y+=`<div class="ia-sources-header" onclick="var n=this.nextElementSibling;n.style.display=n.style.display==='none'?'block':'none'">Sources (${u.sources.length}) ▾</div>`,y+=`<div class="ia-sources-body" id="sources-body-${U}" style="display:none">`;for(let k=0;k<u.sources.length;k++){const I=u.sources[k],X=I.date?new Date(I.date*1e3).toLocaleDateString():"",re=I.event_id?`<a class="ia-primal-link" href="${pa(I.event_id,I.kind)}" target="_blank">open ↗</a>`:"",Ie=I.pubkey?`<a class="ia-primal-link" href="https://primal.net/p/${I.pubkey}" target="_blank">${xe(I.author)}</a>`:xe(I.author);y+=`<div class="ia-src-note" id="src-${U}-${k}"><div class="ia-src-header"><span class="ia-src-num">[${k+1}]</span> <span style="color:#93c5fd">${Ie}</span> <span class="meta">${X} ${(I.score*100).toFixed(0)}%</span> `+re+`</div><div class="ia-src-text">${xe(I.content)}</div></div>`}y+="</div></div>"}A("ai",`<div class="ia-answer-block">${m}</div>${y}`,!0)}catch(u){n.lastChild.remove(),A("ai",`<div class="ia-error-msg"><strong>Request failed</strong><br>${xe(u.message)}</div>`,!0)}}else{A("ai",'<span class="ia-typing">Searching</span>',!1);try{const u=await no(w,{pubkeys:N});if(n.lastChild.remove(),u.error)A("ai",`<div class="ia-error-msg">${xe(u.error)}</div>`,!0);else if(!u.count)A("ai","No results found.",!0);else{let m=`<strong>${u.count} results</strong>`;for(const y of u.results){const k=y.created_at?new Date(y.created_at*1e3).toLocaleDateString():"",I=y.event_id?`<a class="ia-primal-link" href="${pa(y.event_id,y.kind)}" target="_blank">open ↗</a>`:"";m+=`<div class="ia-result-card"><span class="score">${(y.score*100).toFixed(1)}%</span> <span class="meta">${xe(y.author_label||"?")} · ${k}</span> `+I+`<br>${xe(y.content.slice(0,300))}${y.content.length>300?"...":""}</div>`}A("ai",m,!0)}}catch(u){n.lastChild.remove(),A("ai",`<div class="ia-error-msg"><strong>Search failed</strong><br>${xe(u.message)}</div>`,!0)}}o.disabled=!1,a.focus()}return a.addEventListener("keydown",w=>{w.key==="Enter"&&!w.shiftKey&&(w.preventDefault(),W())}),a.addEventListener("input",()=>{a.style.height="auto",a.style.height=Math.min(a.scrollHeight,128)+"px"}),o.addEventListener("click",W),function(){}}function Vt(e,t){const n=Fe(e.mime),a=Ye[n]||"📄",o=vt(e.size),i=e.added?new Date(e.added*1e3).toLocaleString(void 0,{year:"numeric",month:"short",day:"numeric"}):"",s=(e.mime||"").split("/").pop().split(";")[0].replace("application/","").replace("text/",""),r=(e.mime||"").toLowerCase(),c=`${t}/${e.sha256}`,l=r.startsWith("image/")?`<img src="${c}" alt="${te(e.title)}" class="h-full w-full object-cover" loading="lazy">`:`<span class="text-5xl">${a}</span>`,d=document.createElement("a");return d.href="#/details/"+e.sha256,d.className="relative flex flex-col rounded-sm border border-[var(--color-ia-border)] bg-white text-inherit hover:shadow hover:no-underline",d.innerHTML=`
    <div class="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 grid place-items-center text-zinc-400">
      ${l}
    </div>
    <div class="p-2">
      <h3 class="text-xs font-semibold leading-snug line-clamp-2">${te(e.title)}</h3>
      <div class="mt-1.5 flex items-center gap-1 text-[10px] ia-card-meta">
        ${s?`<span class="ia-card-type rounded-sm bg-zinc-200 px-1 py-0.5 font-mono uppercase text-zinc-600">${te(s)}</span>`:""}
        <span class="ia-card-size text-zinc-400">${o}</span>
        <span class="ia-card-date text-zinc-400">${i}</span>
      </div>
    </div>`,d.dataset.sha256=e.sha256,d.dataset.manifestId=e.manifestId||"",d.dataset.manifestPubkey=e.manifestPubkey||"",d.dataset.manifestItem="1",d.dataset.title=(e.title||"").toLowerCase(),d}function zt(e,t={}){const n=document.createElement("input");n.type="text",n.placeholder=t.placeholder||"Search files...",n.className="rounded-sm border border-[var(--color-ia-border)] bg-white px-3 py-1 text-sm text-[var(--color-ia-ink)] placeholder:text-zinc-400 outline-none focus:border-[var(--color-ia-link)]",n.style.width=t.width||"200px";function a(){const i=n.value.toLowerCase();e.querySelectorAll("a[data-manifest-item]").forEach(r=>{const c=r.dataset.title||"";r.style.display=c.includes(i)?"":"none"})}n.addEventListener("input",a);function o(){n.removeEventListener("input",a),n.remove()}return{el:n,cleanup:o}}let ge=null,Rt=null;function Sm(){if(ge)return;ge=document.createElement("div"),ge.id="ia-raw-modal",ge.className="hidden",ge.style.cssText=["position: fixed","inset: 0","z-index: 99998","background: rgba(0,0,0,0.7)","display: flex","align-items: center","justify-content: center","backdrop-filter: blur(4px)"].join("; ");const e=document.createElement("div");e.id="ia-raw-content",e.style.cssText=["width: 90%","max-width: 700px","max-height: 80vh","overflow: auto","background: #1a1a2e","border: 1px solid #333","border-radius: 8px","padding: 1.2em","color: #d8dadf","font-family: monospace","font-size: 12px","white-space: pre-wrap","word-break: break-all","position: relative"].join("; ");const t=document.createElement("button");t.id="ia-raw-close",t.innerHTML="&times;",t.style.cssText=["position: absolute","top: 8px","right: 12px","background: none","border: none","color: #888","font-size: 1.3rem","cursor: pointer"].join("; "),t.addEventListener("click",()=>{ge.classList.add("hidden"),ge.style.display="none"}),Rt=document.createElement("pre"),Rt.id="ia-raw-json",e.appendChild(t),e.appendChild(Rt),ge.appendChild(e),document.body.appendChild(ge),ge.addEventListener("click",n=>{n.target===ge&&(ge.classList.add("hidden"),ge.style.display="none")})}function Tm(e){Sm(),Rt.textContent=JSON.stringify(e,null,2),ge.classList.remove("hidden"),ge.style.display="flex";function t(a){a.key==="Escape"&&(ge.classList.add("hidden"),ge.style.display="none",document.removeEventListener("keydown",t))}document.addEventListener("keydown",t);function n(){document.removeEventListener("keydown",t),ge&&(ge.classList.add("hidden"),ge.style.display="none")}return{cleanup:n}}const Im=["wss://nos.lol","wss://relay.damus.io"];let He=null;const tn=new Map;async function nn(e){if(tn.has(e))return tn.get(e);for(const t of Im)try{const n=new WebSocket(t),a=await new Promise((o,i)=>{const s=setTimeout(()=>{n.close(),i("timeout")},5e3);n.onopen=()=>n.send(JSON.stringify(["REQ","kebab",{ids:[e],limit:1}])),n.onmessage=r=>{const c=JSON.parse(r.data);c[0]==="EVENT"&&c[2]&&(clearTimeout(s),n.close(),o(c[2]))},n.onerror=()=>{clearTimeout(s),i("ws error")}});return tn.set(e,a),a}catch{continue}return null}function xt(){He&&(He.btn.classList.remove("ia-kebab-open"),He.menu.remove(),He=null)}async function Em(e,t){xt();const n=document.createElement("div");n.className="ia-dropdown";const a=[{label:"Copy Event ID",action:async()=>{await navigator.clipboard.writeText(t),$e("Event ID copied")}},{label:"Copy Raw JSON",action:async()=>{const o=await nn(t);o?(await navigator.clipboard.writeText(JSON.stringify(o,null,2)),$e("JSON copied")):$e("Failed to fetch event")}},{label:"View Raw Data",action:async()=>{const o=await nn(t);o?Tm(o):$e("Failed to fetch event")}},{label:"Edit",action:async()=>{window.location.hash=`/details/${t}`}},{label:"Delete",danger:!0,action:async()=>{if(confirm("Delete this item? This removes it from your archive manifest.")){if(!window.nostr){$e("NIP-07 signer required");return}try{const o=await window.nostr.getPublicKey(),i=ke(),s=i.relays.split(",").map(h=>h.trim()).filter(Boolean),r=await bt(o,i.manifestDtag||"archive",s);if(!r){$e("No manifest found");return}const c=it(r.content);let l=!1;for(const[h,x]of Object.entries(c))if(x.index_event_id===t||x.bridge_event_id===t){delete c[h],l=!0;break}if(!l){$e("Item not found in manifest");return}const d=rn(c),p=await on(d),f=[...d,["d",i.manifestDtag||"archive"],["x",p,"aggregate"],["title","Personal Archive"],["server",i.blossomUrl]],g={kind:35128,content:sn(c),created_at:Math.floor(Date.now()/1e3),tags:f},v=await window.nostr.signEvent(g);await ot(v,s),$e("Deleted from manifest"),setTimeout(()=>location.reload(),1e3)}catch(o){$e("Delete failed: "+o.message)}}}}];for(const o of a){const i=document.createElement("button");i.className="ia-dropdown-item"+(o.danger?" ia-danger":""),i.textContent=o.label,i.addEventListener("click",async s=>{s.stopPropagation(),s.preventDefault(),xt(),await o.action()}),n.appendChild(i)}e.classList.add("ia-kebab-open"),e.parentElement.style.position="relative",e.parentElement.appendChild(n),He={btn:e,menu:n},nn(t)}function at(){document.querySelectorAll('a[href*="/details/"]').forEach(t=>{var o;if(t.querySelector(".ia-kebab"))return;const n=t.dataset.manifestId||((o=t.getAttribute("href"))==null?void 0:o.split("/details/")[1])||"";if(!n)return;const a=document.createElement("button");a.className="ia-kebab",a.textContent="⋮",a.title="Actions",a.addEventListener("click",i=>{i.preventDefault(),i.stopPropagation(),He&&He.btn===a?xt():Em(a,n)}),t.style.position="relative",t.appendChild(a)})}function Kt(e,t){const n=[];function a(l){He&&!He.menu.contains(l.target)&&l.target!==He.btn&&xt()}document.addEventListener("click",a),n.push(()=>document.removeEventListener("click",a));const o=[];o.push(setTimeout(at,2e3)),o.push(setTimeout(at,5e3)),o.push(setTimeout(at,1e4));const i=setInterval(at,8e3);function s(){setTimeout(at,500)}window.addEventListener("hashchange",s),n.push(()=>window.removeEventListener("hashchange",s));let r=null;e&&(r=new MutationObserver(()=>{at()}),r.observe(e,{childList:!0,subtree:!0}));function c(){n.forEach(l=>{try{l()}catch{}}),o.forEach(l=>clearTimeout(l)),clearInterval(i),r&&r.disconnect(),xt()}return c}const uo="ia-view-mode",mo="ia-list-sort";function dn(){return localStorage.getItem(uo)||"grid"}function pn(){return localStorage.getItem(mo)||"date-desc"}function fo(e){localStorage.setItem(uo,e),document.documentElement.setAttribute("data-view",e),document.querySelectorAll(".ia-view-toggle button").forEach(t=>t.classList.toggle("active",t.dataset.mode===e)),e==="list"?(En(),In()):(Rm(),document.querySelectorAll(".ia-items-grid a").forEach(t=>t.style.order=""))}function Lm(){const e=document.createElement("span");e.className="ia-view-toggle";const t=dn();return e.innerHTML=`<button data-mode="grid" class="${t==="grid"?"active":""}" title="Grid view">&#9638;</button><button data-mode="list" class="${t==="list"?"active":""}" title="List view">&#9776;</button>`,e.querySelectorAll("button").forEach(n=>n.addEventListener("click",()=>fo(n.dataset.mode))),e}function Pm(e){const n=e.textContent.match(/([\d.]+)\s*(B|KB|MB|GB)/i);if(!n)return 0;const a=parseFloat(n[1]),o=n[2].toUpperCase();return a*(o==="GB"?1e9:o==="MB"?1e6:o==="KB"?1e3:1)}function $m(e){var t,n;return((n=(t=e.querySelector("[class*='font-mono']"))==null?void 0:t.textContent)==null?void 0:n.toLowerCase())||""}function Cm(e){const t=e.textContent,n=t.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+,?\s+\d+,?\s+\d+:\d+\s*(AM|PM)/i);if(n){const o=new Date(n[0]);if(!isNaN(o))return o.getTime()}const a=t.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+,?\s+\d+/i);return a?new Date(a[0]).getTime():0}function In(){const e=pn(),[t,n]=e.split("-");document.querySelectorAll(".ia-items-grid").forEach(a=>{const i=Array.from(a.children).map(s=>{var c,l;let r;return t==="name"?r=((l=(c=s.querySelector("h3"))==null?void 0:c.textContent)==null?void 0:l.toLowerCase())||"":t==="size"?r=Pm(s):t==="type"?r=$m(s):r=Cm(s),{el:s,v:r}});i.sort((s,r)=>n==="asc"?s.v>r.v?1:-1:s.v<r.v?1:-1),i.forEach((s,r)=>s.el.style.order=r)})}function En(){document.querySelectorAll(".ia-list-header").forEach(e=>{const t=e.nextElementSibling;(!t||!t.classList.contains("ia-items-grid"))&&e.remove()}),document.querySelectorAll(".ia-items-grid").forEach(e=>{var a;if((a=e.previousElementSibling)!=null&&a.classList.contains("ia-list-header"))return;const t=pn(),n=document.createElement("div");n.className="ia-list-header",n.innerHTML=[{col:"name",label:"Name"},{col:"size",label:"Size"},{col:"type",label:"Type"},{col:"date",label:"Date"}].map(o=>{const i=t.startsWith(o.col)?t.endsWith("asc")?"sort-asc":"sort-desc":"";return`<span data-col="${o.col}" class="${i}">${o.label}</span>`}).join(""),n.querySelectorAll("span").forEach(o=>o.addEventListener("click",()=>{const i=o.dataset.col,r=pn()===i+"-asc"?i+"-desc":i+"-asc";localStorage.setItem(mo,r),En(),In()})),e.parentElement.insertBefore(n,e)})}function Rm(){document.querySelectorAll(".ia-list-header").forEach(e=>e.remove())}function Um(){document.querySelectorAll("h2").forEach(e=>{if(e.querySelector(".ia-view-toggle"))return;const t=e.closest("section")||e.closest("div");t&&t.querySelector(".ia-items-grid")&&e.appendChild(Lm())})}function Ln(e,t){const n=[];fo(dn());function a(){Um(),dn()==="list"&&(En(),In())}const o=[];o.push(setTimeout(a,1500)),o.push(setTimeout(a,4e3));const i=setInterval(a,5e3);function s(){setTimeout(a,300)}window.addEventListener("hashchange",s),n.push(()=>window.removeEventListener("hashchange",s));function r(){n.forEach(c=>{try{c()}catch{}}),o.forEach(c=>clearTimeout(c)),clearInterval(i)}return r}function Mm(e,t){const n=document.querySelector("main");n.innerHTML="";const a=[],o=document.createElement("section");o.className="py-6";const i=document.createElement("div");i.className="mx-auto max-w-[1280px] px-4 mb-4 flex items-center justify-between";const s=document.createElement("h2");s.className="text-sm font-semibold uppercase tracking-wider text-zinc-500",s.textContent="Latest additions",i.appendChild(s),a.push(Ln());const r=document.createElement("div");r.className="ia-items-grid",r.id="manifest-feed-grid";const c=document.createElement("div");c.className="mx-auto max-w-[1280px] px-4",c.appendChild(i),c.appendChild(r),o.appendChild(c);const{el:l,cleanup:d}=zt(r);i.appendChild(l),a.push(d),a.push(Kt(r));function p(f){const{user:g,blossomBase:v}=t.getState();for(;n.firstChild&&n.firstChild!==o;)n.removeChild(n.firstChild);if(!(g!=null&&g.pubkey)){o.style.display="none";const{exploreArchives:L}=t.getState(),R=document.createElement("section");R.className="bg-gradient-to-b from-[var(--color-ia-nav-hover)] to-[var(--color-ia-nav)] py-8 text-white",R.innerHTML=`
        <div class="mx-auto max-w-[1280px] px-4">
          <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Internet Archive</h1>
          <p class="mt-1 max-w-3xl text-sm text-white/75">Decentralized archival via Nostr + Blossom. Browse public archives below, or login to manage your own.</p>
        </div>`,n.insertBefore(R,o);const j=document.createElement("section");if(j.className="py-6",L.length===0)j.innerHTML=`
          <div class="mx-auto max-w-[1280px] px-4 text-center py-12">
            <div class="text-zinc-400 text-sm">Loading archives from relays...</div>
          </div>`;else{const W=t.getState().exploreHasMore;j.innerHTML=`
          <div class="mx-auto max-w-[1280px] px-4">
            <h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Public Archives (${L.length})</h2>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              ${L.map(P=>{const U=P.picture?`<img src="${P.picture}" class="h-10 w-10 rounded-full object-cover" onerror="this.outerHTML='<div class=\\'ia-archive-avatar-fallback\\'>&#9786;</div>'">`:'<div class="ia-archive-avatar-fallback">&#9786;</div>',N=P.recentFiles.length>0?`<ul class="mt-2 space-y-0.5">${P.recentFiles.map(H=>`<li class="text-xs text-zinc-400 truncate">&#8226; ${te(H)}</li>`).join("")}</ul>`:'<div class="text-xs text-zinc-400 mt-1">No files yet</div>';return`
                  <a href="#/archive/${P.pubkey}" class="block rounded-lg border border-[var(--color-ia-border)] bg-white p-4 hover:shadow-md transition-shadow no-underline">
                    <div class="flex items-center gap-3">
                      ${U}
                      <div class="min-w-0 flex-1">
                        <div class="font-medium text-sm text-zinc-800 truncate">${te(P.name)}</div>
                        <div class="text-xs text-zinc-500">${P.fileCount} files</div>
                      </div>
                    </div>
                    ${N}
                  </a>`}).join("")}
            </div>
            ${W?'<button class="ia-load-more-btn mt-6" id="ia-explore-load-more">Load More</button>':""}
          </div>`;const w=j.querySelector("#ia-explore-load-more");if(w){let P=!1;w.addEventListener("click",async()=>{if(!P){P=!0,w.textContent="Loading...";try{window.__loadExploreMore&&await window.__loadExploreMore()}catch(U){console.error("[explore] load more failed:",U)}P=!1}})}}n.insertBefore(j,o);return}o.style.display="";const h={};for(const L of f){const R=Fe(L.mime);h[R]=(h[R]||0)+1}const x=document.createElement("section");x.className="bg-gradient-to-b from-[var(--color-ia-nav-hover)] to-[var(--color-ia-nav)] py-8 text-white",x.innerHTML=`
      <div class="mx-auto max-w-[1280px] px-4">
        <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Internet Archive</h1>
        <p class="mt-1 max-w-3xl text-sm text-white/75">Decentralized archival via Nostr + Blossom. Upload, sync, and share files.</p>
        <div class="mt-3 text-xs text-white/55">${f.length} synced files</div>
      </div>`,n.insertBefore(x,o);const S=document.createElement("section");S.className="border-b border-[var(--color-ia-border)] bg-white py-4",S.innerHTML=`
      <div class="mx-auto max-w-[1280px] px-4 flex flex-wrap gap-3">
        ${Object.entries(h).map(([L,R])=>{const j=Ye[L]||"📄",W=L.charAt(0).toUpperCase()+L.slice(1);return`<a href="#/collection/${L}" class="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-ia-border)] bg-white px-4 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 no-underline">${j} ${W} <span class="font-semibold text-zinc-900">${R}</span></a>`}).join("")}
      </div>`,n.insertBefore(S,o);const $={};for(const L of f){const R=L.path.split("/").filter(Boolean);if(R.length>=2){const j=R[0];$[j]||($[j]={count:0,kind:Fe(L.mime)}),$[j].count++}}const C=Object.keys($).sort();if(C.length>0){const L=document.createElement("section");L.className="border-b border-[var(--color-ia-border)] bg-white py-4",L.innerHTML=`
        <div class="mx-auto max-w-[1280px] px-4">
          <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">Folders</h2>
          <div class="flex flex-wrap gap-3">
            ${C.map(R=>{const j=$[R],W=Ye[j.kind]||"📁";return`<a href="#/folder/${encodeURIComponent(R)}" class="flex items-center gap-2 rounded border border-[var(--color-ia-border)] bg-white px-4 py-2 text-sm text-zinc-700 hover:shadow no-underline">${W} <span class="font-medium">${te(R)}</span> <span class="text-xs text-zinc-400">${j.count} files</span></a>`}).join("")}
          </div>
        </div>`,n.insertBefore(L,o)}r.innerHTML="";const A=new Set;for(const L of f.slice(0,24))A.has(L.sha256)||(A.add(L.sha256),r.appendChild(Vt(L,v)))}return n.appendChild(o),p(t.getState().items),a.push(t.subscribe("items",f=>{p(f)})),a.push(t.subscribe("user",()=>{p(t.getState().items)})),a.push(t.subscribe("exploreArchives",()=>{var f;(f=t.getState().user)!=null&&f.pubkey||p(t.getState().items)})),function(){a.forEach(g=>{try{g()}catch{}})}}function Wt(e){const t=document.createElement("section");t.className="border-b border-[var(--color-ia-border)] bg-[var(--color-ia-bg-soft)] py-4";const n=document.createElement("nav");n.className="text-[11px] text-zinc-500 mx-auto max-w-[1280px] px-4";const a=e.map((o,i)=>i===e.length-1?`<span class="text-zinc-700">${te(o.label)}</span>`:`<a class="hover:underline" href="${te(o.href||"#/")}">${te(o.label)}</a>`);return n.innerHTML=a.join(" › "),t.appendChild(n),t}function Nm(e,t){const[n]=e,a=document.querySelector("main");a.innerHTML="";const{items:o,blossomBase:i}=t.getState(),s=[],r=o.filter(A=>Fe(A.mime)===n),c=n.charAt(0).toUpperCase()+n.slice(1),l=Ye[n]||"📄";a.appendChild(Wt([{label:"Home",href:"#/"},{label:c}]));const d=document.createElement("section");d.className="py-6";const p=document.createElement("div");p.className="mx-auto max-w-[1280px] px-4";const f=document.createElement("div");f.className="mb-4 flex items-center justify-between";const g=document.createElement("h2");g.className="text-sm font-semibold uppercase tracking-wider text-zinc-500",g.textContent=`${l} ${c} — ${r.length} files`,f.appendChild(g),s.push(Ln());const v={};for(const A of r){const L=A.path.split("/").filter(Boolean);if(L.length>=3){const R=L.slice(1,-1).join("/");v[R]=(v[R]||0)+1}}const h=Object.keys(v).sort();let x=null;h.length>0&&(x=document.createElement("div"),x.className="mb-4 flex flex-wrap gap-2",x.innerHTML=h.map(A=>`<span class="inline-flex items-center gap-1 rounded-full border border-[var(--color-ia-border)] bg-white px-3 py-1 text-xs text-zinc-600 cursor-pointer hover:bg-zinc-50" data-folder="${te(A)}">📁 ${te(A)} <span class="text-zinc-400">(${v[A]})</span></span>`).join(""));const S=document.createElement("div");S.className="ia-items-grid",S.id="manifest-collection-grid",p.appendChild(f),x&&p.appendChild(x),p.appendChild(S),d.appendChild(p),a.appendChild(d);const{el:$,cleanup:C}=zt(S);f.appendChild($),s.push(C);for(const A of r)S.appendChild(Vt(A,i));return s.push(Kt(S)),x&&x.querySelectorAll("[data-folder]").forEach(A=>{A.addEventListener("click",()=>{const L=A.dataset.folder;S.querySelectorAll("a[data-manifest-item]").forEach(R=>{var P;const j=r.find(U=>U.sha256===R.dataset.sha256),W=((P=j==null?void 0:j.path)==null?void 0:P.split("/").filter(Boolean))||[],w=W.length>=3?W.slice(1,-1).join("/"):"";R.style.display=w===L?"":"none"}),x.querySelectorAll("[data-folder]").forEach(R=>R.classList.remove("bg-[var(--color-ia-link)]","text-white")),A.classList.add("bg-[var(--color-ia-link)]","text-white")})}),function(){s.forEach(L=>{try{L()}catch{}})}}function Dm(e,t){const n=decodeURIComponent(e[0]),a=document.querySelector("main");a.innerHTML="";const{items:o,blossomBase:i}=t.getState(),s=[],r=o.filter(h=>{const x=h.path.split("/").filter(Boolean);return x.length>=2&&x[0]===n});a.appendChild(Wt([{label:"Home",href:"#/"},{label:n}]));const c=document.createElement("section");c.className="py-6";const l=document.createElement("div");l.className="mx-auto max-w-[1280px] px-4";const d=document.createElement("div");d.className="mb-4 flex items-center justify-between";const p=document.createElement("h2");p.className="text-sm font-semibold uppercase tracking-wider text-zinc-500",p.textContent=`📁 ${n} — ${r.length} files`,d.appendChild(p),s.push(Ln());const f=document.createElement("div");f.className="ia-items-grid",f.id="manifest-folder-grid",l.appendChild(d),l.appendChild(f),c.appendChild(l),a.appendChild(c);const{el:g,cleanup:v}=zt(f);d.appendChild(g),s.push(v);for(const h of r)f.appendChild(Vt(h,i));return s.push(Kt(f)),function(){s.forEach(x=>{try{x()}catch{}})}}function jm(e,t){var S,$;const[n]=e,a=document.querySelector("main");a.innerHTML="";const{items:o}=t.getState(),i=o.find(C=>C.sha256===n);if(!i){a.innerHTML='<div class="mx-auto max-w-[1280px] px-4 py-12 text-center text-zinc-500">Item not found.</div>';return}const r=`${kt()}/${n}`,c=i.added?new Date(i.added*1e3).toLocaleString():"Unknown",l=(i.mime||"").toLowerCase(),d=Fe(i.mime);a.appendChild(Wt([{label:"Home",href:"#/"},{label:d.charAt(0).toUpperCase()+d.slice(1),href:`#/collection/${d}`},{label:i.title}]));let p="",f="";const g="flex gap-2 p-2 bg-zinc-50 border-t border-[var(--color-ia-border)]",v="rounded-sm bg-[var(--color-ia-nav)] px-3 py-1.5 text-sm text-white hover:bg-[var(--color-ia-nav-hover)] no-underline",h="rounded-sm border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 no-underline";l.startsWith("image/")?p=`<img src="${r}" alt="${te(i.title)}" style="display:block;max-width:100%;max-height:80vh;object-fit:contain;margin:auto">`:l.startsWith("audio/")?p=`<audio controls src="${r}" style="width:100%;display:block"></audio>`:l.startsWith("video/")?p=`<video controls src="${r}" style="display:block;max-width:100%;max-height:80vh;margin:auto"></video>`:l==="text/html"?p='<iframe sandbox="allow-same-origin" srcdoc="" id="ia-html-preview" style="width:100%;min-height:400px;border:none"></iframe>':l.startsWith("text/")||l.includes("json")||l.includes("yaml")||l.includes("javascript")||l.includes("xml")?p='<pre id="ia-text-preview" style="max-height:70vh;overflow:auto;padding:1em;font-size:12px;background:#f9fafb;white-space:pre-wrap;word-break:break-word;margin:0"></pre>':l.includes("pdf")?p=`<iframe src="${r}" style="width:100%;min-height:600px;border:none"></iframe>`:p=`<div class="grid place-items-center py-12 text-zinc-400"><span class="text-6xl">${Ye[d]||"📄"}</span><p class="mt-3">No preview available</p></div>`,f=`<div class="${g}"><a href="${r}" download="${te(i.title)}" class="${v}">Download</a><a href="${r}" target="_blank" rel="noopener" class="${h}">Open on Blossom</a></div>`;const x=document.createElement("div");if(x.innerHTML=`
    <section class="mx-auto max-w-[1280px] px-4 py-6">
      <div class="flex flex-col gap-6 lg:flex-row">
        <div class="min-w-0 flex-1 rounded border border-[var(--color-ia-border)] bg-white">
          <div class="p-2">${p}</div>
          ${f}
        </div>
        <aside class="w-full space-y-4 lg:w-72">
          <div class="rounded border border-[var(--color-ia-border)] bg-white p-3">
            <h2 class="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Verification</h2>
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-medium bg-[var(--color-ia-good)]/15 text-[var(--color-ia-good)]"><span class="font-bold">✓</span> signature</span>
              <span class="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-medium bg-[var(--color-ia-good)]/15 text-[var(--color-ia-good)]"><span class="font-bold">✓</span> content hash</span>
              <span class="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-medium bg-[var(--color-ia-good)]/15 text-[var(--color-ia-good)]"><span class="font-bold">✓</span> stored on Blossom</span>
            </div>
            <p class="mt-2 text-[11px] text-zinc-500">SHA-256 content-addressed. Manifest signed via NIP-07.</p>
          </div>
          <div class="rounded border border-[var(--color-ia-border)] bg-white p-3">
            <h2 class="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Metadata</h2>
            <dl class="grid grid-cols-[100px_1fr] gap-y-1.5 text-xs">
              <dt class="text-zinc-500">Type</dt>
              <dd class="text-zinc-800"><code class="bg-zinc-100 px-1 rounded text-[11px]">${te(i.mime||"unknown")}</code></dd>
              <dt class="text-zinc-500">Size</dt>
              <dd class="text-zinc-800">${vt(i.size)}</dd>
              <dt class="text-zinc-500">SHA-256</dt>
              <dd class="text-zinc-800 font-mono text-[10px] break-all">${n}</dd>
              <dt class="text-zinc-500">Published</dt>
              <dd class="text-zinc-800">${c}</dd>
              <dt class="text-zinc-500">Source</dt>
              <dd class="text-zinc-800">kind:35128 manifest</dd>
              <dt class="text-zinc-500">Kind</dt>
              <dd class="text-zinc-800"><code class="bg-zinc-100 px-1 rounded text-[11px]">${te(((S=i.source)==null?void 0:S.kind)||Fe(i.mime))}</code></dd>
              ${($=i.topics)!=null&&$.length?'<dt class="text-zinc-500">Topics</dt><dd class="text-zinc-800">'+i.topics.map(C=>`<span class="inline-block rounded-sm bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600 mr-1">${te(C)}</span>`).join("")+"</dd>":""}
              <dt class="text-zinc-500">Author</dt>
              <dd class="text-zinc-800 font-mono text-[10px] break-all">${i.manifestPubkey||"unknown"}</dd>
            </dl>
          </div>
        </aside>
      </div>
    </section>`,a.appendChild(x.firstElementChild),l==="text/html"){const C=document.getElementById("ia-html-preview");C&&fetch(r).then(A=>A.text()).then(A=>{C.srcdoc=A}).catch(()=>{})}else if(l.startsWith("text/")||l.includes("json")||l.includes("yaml")||l.includes("javascript")||l.includes("xml")){const C=document.getElementById("ia-text-preview");C&&fetch(r).then(A=>A.text()).then(A=>{C.textContent=A}).catch(()=>{C.textContent="Failed to load content."})}return function(){const A=a.querySelector("video"),L=a.querySelector("audio");A&&A.pause(),L&&L.pause()}}function Om(e,t){const n=document.querySelector("main");return n.innerHTML=`
    <div class="mx-auto max-w-[1280px] px-4 py-8">
      <h1 class="text-2xl font-semibold tracking-tight">About Internet Archive on Nostr</h1>
      <p class="mt-4 max-w-3xl text-sm text-zinc-600 leading-relaxed">
        This is a decentralized archival platform built on the Nostr protocol and Blossom content-addressed storage.
        Files are uploaded to Blossom servers, tracked via kind:35128 manifests, and discoverable through Nostr relays.
      </p>
      <h2 class="mt-6 text-lg font-semibold">How it works</h2>
      <ul class="mt-2 text-sm text-zinc-600 list-disc pl-5 space-y-1">
        <li>Files are stored on <strong>Blossom</strong> servers, content-addressed by SHA-256</li>
        <li>Personal archives are tracked as <strong>kind:35128</strong> (NIP-5A nsite) manifest events</li>
        <li>Bridge events (<strong>kind:1115</strong>) and index events (<strong>kind:1116</strong>) provide metadata</li>
        <li>URL archiving intent is signaled via <strong>kind:1621</strong> issue events</li>
        <li>Authentication uses <strong>NIP-07</strong> browser extensions (nos2x, Alby)</li>
      </ul>
      <p class="mt-6 text-xs text-zinc-400">Vibed with <a href="https://soapbox.pub/mkstack" class="text-[var(--color-ia-link)] hover:underline">MKStack</a></p>
    </div>`,function(){}}async function Bm(e,t){const[n]=e,a=document.querySelector("main");a.innerHTML="";const o=[],i=st(),s=kt(),r=await Oo(n,i),c=(r==null?void 0:r.name)||n.slice(0,16)+"...",l=(r==null?void 0:r.picture)||null;a.appendChild(Wt([{label:"Home",href:"#/"},{label:c}]));const d=document.createElement("section");d.className="border-b border-[var(--color-ia-border)] bg-white py-4";const p=l?`<img src="${te(l)}" class="h-12 w-12 rounded-full object-cover flex-shrink-0" onerror="this.outerHTML='<div class=\\'ia-archive-avatar-fallback\\'>&#9786;</div>'">`:'<div class="ia-archive-avatar-fallback">&#9786;</div>',f=r!=null&&r.about?`<p class="mt-1 text-sm text-zinc-600 line-clamp-2">${te(r.about)}</p>`:"",g=r!=null&&r.nip05?`<p class="text-xs text-[var(--color-ia-link)]">${te(r.nip05)}</p>`:"";d.innerHTML=`
    <div class="mx-auto max-w-[1280px] px-4 flex items-start gap-3">
      ${p}
      <div class="min-w-0">
        <h1 class="text-lg font-semibold text-zinc-800">${te(c)}</h1>
        <p class="text-xs text-zinc-400 font-mono">${n.slice(0,16)}...${n.slice(-4)}</p>
        ${g}
        ${f}
      </div>
    </div>`,a.appendChild(d);const v=document.createElement("div");a.appendChild(v);const h=document.createElement("div");a.appendChild(h);const x=document.createElement("section");x.className="py-6";const S=document.createElement("div");S.className="mx-auto max-w-[1280px] px-4";const $=document.createElement("div");$.className="mb-4 flex items-center justify-between";const C=document.createElement("h2");C.className="text-sm font-semibold uppercase tracking-wider text-zinc-500",C.textContent="Loading...",$.appendChild(C);const A=document.createElement("div");A.className="ia-items-grid",A.id="archive-grid";const{el:L,cleanup:R}=zt(A);$.appendChild(L),o.push(R),o.push(Kt(A)),S.appendChild($),S.appendChild(A),x.appendChild(S),a.appendChild(x);const j=[];await _t(i,{kinds:[35128],authors:[n],limit:50},u=>{const m=fn(u);j.push(...m)}),j.sort((u,m)=>(m.added||0)-(u.added||0));let W=null,w=null;function P(){return j.filter(u=>u.path.split("/").filter(Boolean).length<=1)}function U(){let u=j;return W&&(u=u.filter(m=>Fe(m.mime)===W)),w&&(u=u.filter(m=>{const y=m.path.split("/").filter(Boolean);return y.length>=2&&y[0]===w})),u}function N(u){const m={};for(const y of u){const k=Fe(y.mime);m[k]=(m[k]||0)+1}return m}function H(u){const m={};for(const y of u){const k=y.path.split("/").filter(Boolean);if(k.length>=2){const I=k[0];m[I]||(m[I]={count:0,kind:Fe(y.mime)}),m[I].count++}}return m}function ee(){return W!==null||w!==null}function be(){const u=N(j),m=ee()?U():P();C.textContent=`${m.length} file${m.length!==1?"s":""}`,v.innerHTML="";const y=document.createElement("section");y.className="border-b border-[var(--color-ia-border)] bg-white py-3",y.innerHTML=`
      <div class="mx-auto max-w-[1280px] px-4 flex flex-wrap gap-2">
        <button class="ia-filter-chip ${ee()?"":"active"}" data-filter="all">All ${j.length}</button>
        ${Object.entries(u).map(([k,I])=>{const X=Ye[k]||"📄",re=k.charAt(0).toUpperCase()+k.slice(1);return`<button class="ia-filter-chip ${W===k?"active":""}" data-kind="${k}">${X} ${re} ${I}</button>`}).join("")}
      </div>`,y.querySelectorAll('[data-filter="all"]').forEach(k=>{k.addEventListener("click",()=>{W=null,w=null,be(),ae(),ne()})}),y.querySelectorAll("[data-kind]").forEach(k=>{k.addEventListener("click",()=>{const I=k.dataset.kind;W=W===I?null:I,w=null,be(),ae(),ne()})}),v.appendChild(y)}function ae(){h.innerHTML="";const u=W?j.filter(I=>Fe(I.mime)===W):j,m=H(u),y=Object.keys(m).sort();if(y.length===0)return;const k=document.createElement("section");k.className="border-b border-[var(--color-ia-border)] bg-white py-3",k.innerHTML=`
      <div class="mx-auto max-w-[1280px] px-4">
        <div class="flex flex-wrap gap-2">
          ${y.map(I=>{const X=m[I],re=Ye[X.kind]||"📁";return`<button class="ia-filter-chip ${w===I?"active":""}" data-folder="${te(I)}">${re} ${te(I)} ${X.count}</button>`}).join("")}
        </div>
      </div>`,k.querySelectorAll("[data-folder]").forEach(I=>{I.addEventListener("click",()=>{const X=I.dataset.folder;w=w===X?null:X,W=null,be(),ae(),ne()})}),h.appendChild(k)}function ne(){const u=ee()?U():P();if(A.innerHTML="",u.length===0&&!ee()){A.innerHTML='<div class="col-span-full text-center py-8 text-zinc-400 text-sm">No files at root level. Browse collections or folders above.</div>';return}if(u.length===0){A.innerHTML='<div class="col-span-full text-center py-8 text-zinc-400 text-sm">No files match this filter.</div>';return}const m=new Set;for(const y of u)m.has(y.sha256)||(m.add(y.sha256),A.appendChild(Vt(y,s)))}return j.length===0?(C.textContent="0 files",A.innerHTML='<div class="col-span-full text-center py-12 text-zinc-400 text-sm">No files found in this archive.</div>'):(be(),ae(),ne()),function(){o.forEach(m=>{try{m()}catch{}})}}function qm(e,t){const n=document.querySelector("main");n.innerHTML="";const a=[],o=document.createElement("section");o.className="bg-gradient-to-b from-[var(--color-ia-nav-hover)] to-[var(--color-ia-nav)] py-8 text-white",o.innerHTML=`
    <div class="mx-auto max-w-[1280px] px-4">
      <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">Explore Archives</h1>
      <p class="mt-1 max-w-3xl text-sm text-white/75">Browse public archives from the Nostr network. Click any archive to explore its files.</p>
    </div>`,n.appendChild(o);const i=document.createElement("section");i.className="py-6";const s=document.createElement("div");s.className="mx-auto max-w-[1280px] px-4";const r=document.createElement("div");r.className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3",r.id="explore-grid";const c=document.createElement("button");c.className="mt-6 block mx-auto px-6 py-2 rounded border border-[var(--color-ia-border)] bg-white text-sm text-zinc-600 hover:bg-zinc-50 cursor-pointer",c.textContent="Load More",c.style.display="none";let l=!1;c.addEventListener("click",async()=>{if(!l){l=!0,c.textContent="Loading...";try{window.__loadExploreMore&&await window.__loadExploreMore()}catch(p){console.error("[explore] load more failed:",p)}l=!1,c.textContent="Load More"}}),s.appendChild(r),s.appendChild(c),i.appendChild(s),n.appendChild(i);function d(){const{exploreArchives:p,exploreHasMore:f}=t.getState();if(r.innerHTML="",p.length===0){r.innerHTML=`
        <div class="col-span-full text-center py-12">
          <div class="text-zinc-400 text-sm">Loading archives from relays...</div>
        </div>`,c.style.display="none";return}for(const g of p){const v=g.picture?`<img src="${g.picture}" class="h-10 w-10 rounded-full object-cover" onerror="this.outerHTML='<div class=\\'ia-archive-avatar-fallback\\'>&#9786;</div>'">`:'<div class="ia-archive-avatar-fallback">&#9786;</div>',h=g.recentFiles.length>0?`<ul class="mt-2 space-y-0.5">${g.recentFiles.map(S=>`<li class="text-xs text-zinc-400 truncate">&#8226; ${te(S)}</li>`).join("")}</ul>`:'<div class="text-xs text-zinc-400 mt-1">No files yet</div>',x=document.createElement("a");x.href=`#/archive/${g.pubkey}`,x.className="block rounded-lg border border-[var(--color-ia-border)] bg-white p-4 hover:shadow-md transition-shadow no-underline",x.innerHTML=`
        <div class="flex items-center gap-3">
          ${v}
          <div class="min-w-0 flex-1">
            <div class="font-medium text-sm text-zinc-800 truncate">${te(g.name)}</div>
            <div class="text-xs text-zinc-500">${g.fileCount} files</div>
          </div>
        </div>
        ${h}`,r.appendChild(x)}c.style.display=f?"block":"none"}return d(),a.push(t.subscribe("exploreArchives",d)),function(){a.forEach(f=>{try{f()}catch{}})}}function Fm(e,t){const n=document.getElementById("ia-main");return n.innerHTML="",Am(n),function(){n.innerHTML=""}}function Hm(e,t){const n=document.querySelector("main"),a=e[0];n.innerHTML=`
    <div class="ia-profile-page">
      <div class="ia-profile-loading">Loading profile...</div>
    </div>`;const o=n.querySelector(".ia-profile-page");return(async()=>{const i=Vm(a);if(!i){o.innerHTML='<div class="ia-profile-error">Invalid npub.</div><a href="#/chat" class="ia-profile-back">← Back to chat</a>';return}const[s,r]=await Promise.all([fetch("/bud-lite/soul-hints.json").catch(()=>null),fetch(`/bud-lite/souls/${i}.md`).catch(()=>null)]);let c=null,l="";if(s&&s.ok&&(c=await s.json()),r&&r.ok&&(l=await r.text()),!c){o.innerHTML='<div class="ia-profile-error">Failed to load profile data.</div>';return}const d=c.hints||{},p=c.micros||{},f=c.labels||{},g=c.pictures||{};if(!(f[i]||d[i]||p[i]||l)){o.innerHTML='<div class="ia-profile-error">Profile not found.</div><a href="#/chat" class="ia-profile-back">← Back to chat</a>';return}const h=f[i]||i.slice(0,8),x=g[i]||"",S=d[i]||"",$=p[i]||"",C=l?Math.floor(l.length/4):0;o.innerHTML=`
      <div class="ia-profile-header">
        ${x?`<img src="${We(x)}" class="ia-profile-avatar" alt="${We(h)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="ia-profile-avatar-placeholder" style="display:none">${We(h[0].toUpperCase())}</div>`:`<div class="ia-profile-avatar-placeholder">${We(h[0].toUpperCase())}</div>`}
        <div class="ia-profile-header-info">
          <h1 class="ia-profile-name">${We(h)}</h1>
          <div class="ia-profile-npub">${We(a)}</div>
          <div class="ia-profile-links">
            <a href="https://primal.net/p/${i}" target="_blank" class="ia-profile-ext-link">Nostr ↗</a>
          </div>
        </div>
      </div>

      ${S?`
      <div class="ia-profile-section">
        <h2 class="ia-profile-section-title">Compact Soul <span class="ia-profile-badge">~1000 tokens</span></h2>
        <p class="ia-profile-section-desc">AI-distilled from their Nostr posts</p>
        <div class="ia-profile-soul-content">${fa(S)}</div>
      </div>`:'<div class="ia-profile-empty">No compact profile generated yet.</div>'}

      ${$?`
      <div class="ia-profile-section">
        <h2 class="ia-profile-section-title">Micro Summary</h2>
        <div class="ia-profile-micro">${We($)}</div>
      </div>`:""}

      ${l?`
      <div class="ia-profile-section">
        <h2 class="ia-profile-section-title" style="cursor:pointer" id="ia-full-soul-toggle">
          Full Soul <span class="ia-profile-badge">~${C.toLocaleString()} tokens</span>
          <span class="ia-profile-collapse-icon" id="ia-soul-collapse-icon">▼</span>
        </h2>
        <p class="ia-profile-section-desc">Complete AI-generated profile from all their Nostr posts</p>
        <div class="ia-profile-soul-full" id="ia-full-soul-content">
          ${fa(l)}
        </div>
      </div>`:""}

      <div class="ia-profile-footer">
        <p class="ia-profile-disclaimer">Auto-generated from public Nostr posts. May contain inaccuracies.
        <a href="https://primal.net/p/${i}" target="_blank">See original posts ↗</a></p>
        <a href="#/chat" class="ia-profile-back">← Back to chat</a>
      </div>`;const A=document.getElementById("ia-full-soul-toggle"),L=document.getElementById("ia-full-soul-content"),R=document.getElementById("ia-soul-collapse-icon");A&&L&&(L.style.display="none",R.textContent="▶",A.addEventListener("click",()=>{const j=L.style.display!=="none";L.style.display=j?"none":"block",R.textContent=j?"▶":"▼"}))})(),()=>{}}function Vm(e){const t="qpzry9x8gf2tvdw0s3jn54khce6mua7l";if(!e.startsWith("npub1"))return null;const n=[];for(const r of e.slice(5)){const c=t.indexOf(r);if(c===-1)return null;n.push(c)}const a=n.slice(0,n.length-6),o=[];let i=0,s=0;for(const r of a)for(i=i<<5|r,s+=5;s>=8;)s-=8,o.push(i>>>s&255);return o.map(r=>r.toString(16).padStart(2,"0")).join("")}function fa(e){let t=We(e);return t=t.replace(/^### (.+)$/gm,"<h3>$1</h3>"),t=t.replace(/^## (.+)$/gm,"<h2>$1</h2>"),t=t.replace(/^# (.+)$/gm,"<h1>$1</h1>"),t=t.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),t=t.replace(/^- (.+)$/gm,"<li>$1</li>"),t=t.replace(/(<li>.*<\/li>\n?)+/g,"<ul>$&</ul>"),t=t.replace(/\n\n/g,"</p><p>"),t="<p>"+t+"</p>",t=t.replace(/<p>\s*(<h[123]>)/g,"$1"),t=t.replace(/(<\/h[123]>)\s*<\/p>/g,"$1"),t}function We(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}const Pn=300*1e3,we=Uo({user:null,items:[],exploreArchives:[],exploreCacheTime:0,exploreHasMore:!0,followedPubkeys:[],blossomBase:"",cacheTime:0,settings:ke(),viewMode:localStorage.getItem("ia-view-mode")||"grid",listSort:localStorage.getItem("ia-list-sort")||"date-desc",currentRoute:null});document.documentElement.setAttribute("data-view",we.getState().viewMode);const zm=document.getElementById("app");zm.innerHTML=`
  <div class="flex h-screen flex-col overflow-hidden">
    <header class="border-b border-white/10 bg-[var(--color-ia-nav)]">
      <div class="mx-auto flex h-12 max-w-[1280px] items-center justify-between px-4">
        <a href="#/" class="flex items-center gap-2 text-white no-underline">
          <span class="text-lg font-bold tracking-tight">IA</span>
          <span class="text-sm text-white/75">Internet Archive</span>
          <span class="text-xs text-white/55">on nostr</span>
        </a>
        <nav class="flex gap-4">
          <a href="#/chat" class="text-sm text-white/75 hover:text-white no-underline">Chat</a>
          <a href="#/explore" class="text-sm text-white/75 hover:text-white no-underline">Explore</a>
          <a href="#/collection/texts" class="text-sm text-white/75 hover:text-white no-underline">Texts</a>
          <a href="#/collection/images" class="text-sm text-white/75 hover:text-white no-underline">Images</a>
          <a href="#/collection/audio" class="text-sm text-white/75 hover:text-white no-underline">Audio</a>
          <a href="#/collection/video" class="text-sm text-white/75 hover:text-white no-underline">Video</a>
          <a href="#/collection/software" class="text-sm text-white/75 hover:text-white no-underline">Software</a>
          <a href="#/collection/web" class="text-sm text-white/75 hover:text-white no-underline">Web</a>
          <a href="#/about" class="text-sm text-white/75 hover:text-white no-underline">About</a>
        </nav>
      </div>
    </header>
    <main id="ia-main" class="flex-1 overflow-y-auto"></main>

    <footer class="border-t border-[var(--color-ia-border)] py-4 text-center text-xs text-zinc-500">
      Internet Archive on nostr · kind:35128 manifests · Blossom storage
    </footer>
  </div>

  <!-- Login widget -->
  <div id="ia-login-widget" title="Click to login">
    <div id="ia-login-prompt">Login</div>
  </div>

  <!-- Raw JSON viewer modal -->
  <div id="ia-raw-modal" class="hidden">
    <div id="ia-raw-content">
      <button id="ia-raw-close">&times;</button>
      <pre id="ia-raw-json"></pre>
    </div>
  </div>

  <!-- FABs -->
  <button id="ingest-fab" class="ia-fab hidden" title="Archive a URL">+</button>
  <button id="ia-archive-fab" class="ia-fab hidden" title="My Archive">📂</button>
  <button id="ia-settings-fab" class="ia-fab" title="Settings">⚙</button>

    <!-- Settings modal -->
    <div id="ia-settings-overlay" class="ia-overlay hidden">
      <div id="ia-settings-panel" class="ia-modal-panel">
        <h2>Settings <button id="ia-settings-close" style="background:none;border:none;color:#888;font-size:1.4rem;cursor:pointer">&times;</button></h2>
        <form id="ia-settings-form">
          <label>
            Default archiver npub
            <input type="text" id="set-archiver-npub">
          </label>
          <label>
            Blossom server
            <input type="text" id="set-blossom-url" placeholder="https://blossom.primal.net">
          </label>
          <label>
            Blossom mirror
            <input type="text" id="set-blossom-mirror" placeholder="https://nostr.download">
          </label>
          <label>
            Relays (comma-separated)
            <input type="text" id="set-relays" placeholder="wss://nos.lol, wss://relay.damus.io">
          </label>
          <label>
            Manifest d-tag
            <input type="text" id="set-manifest-dtag" placeholder="archive">
            <div class="hint">Identifier for your personal archive nsite (kind:35128)</div>
          </label>
          <label>
            RAG Backend URL
            <input type="text" id="set-rag-url" placeholder="http://localhost:8080">
            <div class="hint">Legacy: backend proxy URL. Not needed if Qdrant + LLM configured below.</div>
          </label>
          <hr style="border-color:#333;margin:0.8em 0">
          <h3 style="margin:0 0 0.5em;font-size:0.95rem;color:#6ee7b7">Direct API Access</h3>
          <div class="hint" style="margin-bottom:0.8em">Configure to call APIs directly from browser. No backend needed.</div>
          <label>
            Qdrant URL
            <input type="text" id="set-qdrant-url" placeholder="http://localhost:6333">
            <div class="hint">Qdrant instance URL (local or cloud.qdrant.io)</div>
          </label>
          <label>
            Qdrant API Key
            <input type="password" id="set-qdrant-key" placeholder="(optional for local)">
          </label>
          <label>
            Qdrant Collection
            <input type="text" id="set-qdrant-collection" placeholder="nostr_rag">
          </label>
          <hr style="border-color:#333;margin:0.8em 0">
          <h3 style="margin:0 0 0.5em;font-size:0.95rem;color:#6ee7b7">API Keys</h3>
          <div class="hint" style="margin-bottom:0.8em">Keys stored in your browser only. Backend never stores keys.</div>
          <label>
            HuggingFace (embeddings)
            <input type="password" id="set-hf-key" placeholder="hf_...">
            <div class="hint">Free at huggingface.co → Settings → Access Tokens</div>
          </label>
          <label>
            LLM API Key (Anthropic-compatible)
            <input type="password" id="set-llm-key" placeholder="sk-ant-...">
          </label>
          <label>
            LLM Base URL
            <input type="text" id="set-llm-base-url" placeholder="https://api.anthropic.com">
          </label>
          <label>
            LLM Model
            <input type="text" id="set-llm-model" placeholder="claude-sonnet-4-5-20250514">
          </label>
          <label>
            Groq (audio transcription)
            <input type="password" id="set-groq-key" placeholder="gsk_...">
          </label>
          <label>
            Gemini (image/PDF extraction)
            <input type="password" id="set-gemini-key" placeholder="AIza...">
          </label>
          <button type="submit" id="ia-settings-save">Save Settings</button>
        </form>
      </div>
    </div>

    <!-- Modal overlay (hidden by default) -->
    <div id="ingest-overlay" class="ia-overlay hidden">
      <section id="ingest-section" class="ia-modal-panel" style="max-width:640px">
        <h2>
          Archive
          <button id="ingest-close" type="button">&times;</button>
        </h2>
        <div class="ingest-tabs">
          <div class="ingest-tab active" data-tab="url">Flag URL</div>
          <div class="ingest-tab" data-tab="file">Upload File</div>
          <div class="ingest-tab" data-tab="sync">Sync Folder</div>
        </div>
        <form id="ingest-form">
          <!-- URL tab -->
          <div class="ingest-panel active" id="ingest-panel-url">
            <p class="hint">Flag a URL for archiving. Publishes a kind 1621 event to signal intent. Requires NIP-07 login (nos2x, Alby, etc).</p>
            <label>
              URL to archive
              <input type="url" id="ingest-url" placeholder="https://example.com/file.pdf">
            </label>
          </div>
          <!-- File upload tab -->
          <div class="ingest-panel" id="ingest-panel-file">
            <p class="hint">Upload a file directly from your browser. Signed with your Nostr identity.</p>
            <div id="ingest-file-drop">
              <div>Drop a file here or click to browse</div>
              <input type="file" id="ingest-file-input" style="display:none">
            </div>
            <div id="ingest-file-name" style="color:#6ee7b7;font-size:0.85rem;margin-top:0.5em"></div>
          </div>
          <!-- Folder sync tab -->
          <div class="ingest-panel" id="ingest-panel-sync">
            <p class="hint">Select a local folder to sync to your archive. Only new or changed files are uploaded. Folder name is saved so you can re-sync later.</p>
            <div id="ingest-sync-drop" style="border:2px dashed #2a2d34;border-radius:8px;padding:1.5em;text-align:center;cursor:pointer;color:#666;font-size:0.9rem;transition:border-color 0.2s">
              <div style="font-size:1.5em;margin-bottom:0.3em">&#128193;</div>
              <div>Click to select a folder</div>
              <input type="file" id="ingest-folder-input" webkitdirectory multiple style="display:none">
            </div>
            <div id="ingest-sync-info" style="color:#93c5fd;font-size:0.85rem;margin-top:0.5em"></div>
            <div id="ingest-sync-stored" style="display:none;color:#555;font-size:0.75rem;margin-top:0.2em"></div>
            <div id="ingest-sync-diff" style="margin-top:0.5em;font-size:0.8rem;max-height:150px;overflow-y:auto"></div>
            <div style="display:flex;align-items:center;gap:1em;margin-top:0.5em">
              <button type="button" id="ingest-sync-btn" style="display:none;padding:0.6em 1.5em;background:#6ee7b7;color:#111;border:none;border-radius:4px;font-size:1rem;cursor:pointer;font-weight:600">Sync to Archive</button>
              <label style="display:none;align-items:center;gap:0.4em;font-size:0.8rem;color:#888;cursor:pointer" id="ingest-sync-force-label">
                <input type="checkbox" id="ingest-sync-force"> Force re-sync all
              </label>
            </div>
          </div>
          <!-- Common fields -->
          <div class="ingest-row">
            <label>
              Title
              <input type="text" id="ingest-title" placeholder="(optional)">
            </label>
            <label>
              Folder path
              <input type="text" id="ingest-folder" placeholder="texts/my-folder">
            </label>
          </div>
          <div class="ingest-row">
            <label>
              Source kind
              <select id="ingest-source-kind">
                <option value="">— none —</option>
                <option value="webpage">webpage</option>
                <option value="document/pdf">document/pdf</option>
                <option value="audio/podcast">audio/podcast</option>
                <option value="audio/music">audio/music</option>
                <option value="video">video</option>
                <option value="image">image</option>
                <option value="software">software</option>
                <option value="text/book">text/book</option>
              </select>
            </label>
            <label>
              Topics <span style="color:#888;font-size:0.8rem">(comma-separated)</span>
              <input type="text" id="ingest-topics" placeholder="bitcoin, nostr">
            </label>
          </div>
          <div class="ingest-row">
            <label class="checkbox-label">
              <input type="checkbox" id="ingest-skip-ots" checked>
              Skip OTS timestamping (faster)
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="ingest-transcribe">
              Transcribe audio (whisper)
            </label>
          </div>
          <button type="submit" id="ingest-btn">Archive this URL</button>
        </form>
        <div id="ingest-progress" style="display:none;">
          <div id="ingest-steps"></div>
          <div id="ingest-current"></div>
        </div>
      </section>
    </div>

    <!-- Archive browser overlay -->
    <div id="ia-archive-overlay" class="ia-overlay hidden">
      <section id="ia-archive-section" class="ia-modal-panel" style="max-width:640px">
        <h2>
          <span>My Archive</span>
          <button id="ia-archive-close" type="button" style="background:none;border:none;color:#888;font-size:1.4rem;cursor:pointer">&times;</button>
        </h2>
        <div style="display:flex;gap:0.5em;margin-bottom:1em">
          <button id="ia-archive-sync-btn" type="button" style="padding:0.5em 1em;background:#6ee7b7;color:#111;border:none;border-radius:4px;font-size:0.85rem;cursor:pointer;font-weight:600">Sync Folder</button>
          <span id="ia-archive-status" style="color:#888;font-size:0.85rem;display:flex;align-items:center">Loading...</span>
        </div>
        <div id="ia-archive-tree"></div>
      </section>
    </div>`;Fo(document.getElementById("ia-login-widget"),we);lm();fm();ym();async function $n(){const{user:e,cacheTime:t,items:n}=we.getState();if(!(e!=null&&e.pubkey)){we.setState({items:[],cacheTime:0});return}const a=st(),o=kt();if(n.length>0&&t&&Date.now()-t<Pn){console.log("[feed] using cache",n.length,"items");return}console.log("[feed] streaming from",a,"for",e.pubkey.slice(0,12)+"...");const i=[];await _t(a,{kinds:[35128],authors:[e.pubkey],limit:50},s=>{const r=it(s.content);for(const[c,l]of Object.entries(r))i.push({title:l.title||c.split("/").pop(),sha256:l.sha256,mime:l.mime,size:l.size,added:l.added||s.created_at,path:c,manifestId:s.id,manifestPubkey:s.pubkey,topics:l.topics||[],source:l.source||null,bridgeEventId:l.bridge_event_id||null,indexEventId:l.index_event_id||null})}),i.sort((s,r)=>(r.added||0)-(s.added||0)),console.log("[feed]",i.length,"items"),we.setState({items:i,blossomBase:o,cacheTime:Date.now()})}const Cn=20;function ho(e){const{user:t,followedPubkeys:n}=we.getState(),a={kinds:[35128],limit:Cn};return t!=null&&t.pubkey&&n.length>0&&(a.authors=n),e&&(a.until=e),a}async function go(e){const t=st();for(const o of e.values())o.items.sort((i,s)=>(s.added||0)-(i.added||0));const n=[...e.keys()],a=await Bo(n,t);return n.map(o=>{const{items:i,manifestId:s}=e.get(o),r=a.get(o)||{};return{pubkey:o,name:r.name||o.slice(0,12)+"...",picture:r.picture||null,about:r.about||null,fileCount:i.length,recentFiles:i.slice(0,5).map(c=>c.title),manifestId:s}})}let yt=null;async function Nt(){const{exploreCacheTime:e}=we.getState();if(e&&Date.now()-e<Pn){console.log("[explore] using cache");return}const t=st(),n=kt(),a=ho();console.log("[explore] fetching manifests...",a);const o=new Map;let i=1/0;await _t(t,a,r=>{const c=r.pubkey;o.has(c)||o.set(c,{items:[],manifestId:r.id}),o.get(c).items.push(...fn(r)),r.created_at<i&&(i=r.created_at)}),yt=i<1/0?i:null;const s=await go(o);s.sort((r,c)=>c.fileCount-r.fileCount),console.log("[explore]",s.length,"archives"),we.setState({exploreArchives:s,blossomBase:n,exploreCacheTime:Date.now(),exploreHasMore:s.length>=Cn})}async function Km(){if(!yt)return;const e=st(),t=kt(),n=ho(yt);console.log("[explore] loading more...",n);const a=new Map;let o=1/0;const i=we.getState().exploreArchives,s=new Set(i.map(l=>l.pubkey));await _t(e,n,l=>{const d=l.pubkey;a.has(d)||a.set(d,{items:[],manifestId:l.id}),a.get(d).items.push(...fn(l)),l.created_at<o&&(o=l.created_at)});for(const l of s)a.delete(l);yt=o<1/0?o:yt;const r=await go(a);if(r.sort((l,d)=>d.fileCount-l.fileCount),r.length===0){we.setState({exploreHasMore:!1});return}const c=[...i,...r];console.log("[explore] loaded",r.length,"more, total",c.length),we.setState({exploreArchives:c,blossomBase:t,exploreHasMore:r.length>=Cn})}window.__loadExploreMore=Km;window.__exploreHasMore=()=>we.getState().exploreHasMore;const Wm=Mo([{pattern:/^\/$/,handler:Mm},{pattern:/^\/chat$/,handler:Fm},{pattern:/^\/explore$/,handler:qm},{pattern:/^\/archive\/([0-9a-f]{64})$/,handler:Bm},{pattern:/^\/collection\/(.+)$/,handler:Nm},{pattern:/^\/folder\/(.+)$/,handler:Dm},{pattern:/^\/details\/([0-9a-f]{64})$/,handler:jm},{pattern:/^\/about$/,handler:Om},{pattern:/^\/(npub1[a-zA-HJ-NP-Z0-9]+)$/,handler:Hm}],we);Wm.onNavigate=e=>{const t=document.querySelector("footer");t&&(t.style.display=e==="/chat"?"none":"")};{const e=location.hash.replace(/^#/,"")||"/",t=document.querySelector("footer");t&&(t.style.display=e==="/chat"?"none":"")}async function Xm(e){if(e){$n().catch(a=>console.error("[feed] load failed:",a));const t=st(),n=await qo(e.pubkey,t);we.setState({followedPubkeys:n}),console.log("[contacts]",n.length,"followed pubkeys"),we.setState({exploreCacheTime:0}),Nt().catch(a=>console.error("[explore] load failed:",a))}else we.setState({items:[],cacheTime:0,followedPubkeys:[],exploreCacheTime:0}),Nt().catch(t=>console.error("[explore] load failed:",t))}we.subscribe("user",Xm);Ja();we.getState().user?$n().catch(e=>console.error("[feed] load failed:",e)):Nt().catch(e=>console.error("[explore] load failed:",e));setInterval(()=>{we.getState().user?$n().catch(()=>{}):Nt().catch(()=>{})},Pn);
