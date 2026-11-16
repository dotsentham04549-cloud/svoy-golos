const CACHE='svoy-golos-v5';
const VOICE_CACHE='svoy-golos-voice-v1';
const ASSETS=['./','./index.html','./style.css','./app.js','./planner.js','./lessons.js','./voices.js','./icon.svg','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('svoy-golos-')&&k!==CACHE&&k!==VOICE_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
async function voiceResponse(request){
 const cache=await caches.open(VOICE_CACHE);
 let response=await cache.match(request.url);
 if(!response){response=await fetch(new Request(request.url,{credentials:'same-origin'}));if(response.status===200)await cache.put(request.url,response.clone());}
 const range=request.headers.get('range');
 if(!range||response.status!==200)return response;
 const match=/^bytes=(\d*)-(\d*)$/.exec(range);
 if(!match)return response;
 const buffer=await response.arrayBuffer(),size=buffer.byteLength;
 const start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
 const end=match[1]&&match[2]?Math.min(Number(match[2]),size-1):size-1;
 if(start>end||start>=size)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
 return new Response(buffer.slice(start,end+1),{status:206,headers:{'Content-Type':'audio/mpeg','Content-Length':String(end-start+1),'Content-Range':`bytes ${start}-${end}/${size}`,'Accept-Ranges':'bytes'}});
}
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 if(new URL(e.request.url).pathname.includes('/audio/')){e.respondWith(voiceResponse(e.request).catch(()=>Response.error()));return;}
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});}return r;}).catch(()=>caches.match(e.request).then(r=>r||(e.request.mode==='navigate'?caches.match(new URL('./index.html',self.location.href).href):Response.error()))));
});
