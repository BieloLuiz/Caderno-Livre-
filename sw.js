/* Caderno Livre — funciona sem internet.
   Arquivos do app: tenta a rede primeiro (para receber atualizações) e usa a
   cópia guardada quando não há internet. Fontes e o gerador de PDF ficam
   guardados depois da primeira vez. */
const V='caderno-20261104-continuous-pen-2';
const SHELL=['./','index.html','manifest.webmanifest','features.css','vendor/perfect-freehand-1.2.3.js','js/ink.js','js/pentest.js','js/hwr.js','js/app.js','icons/icon-180.png','icons/icon-192.png','icons/icon-512.png'];
const EXTRA=['vendor/pdf.min.js','vendor/pdf.worker.min.js','vendor/jspdf.umd.min.js'];
self.addEventListener('install',e=>{e.waitUntil((async()=>{const c=await caches.open(V);await c.addAll(SHELL);
  for(const u of EXTRA){try{await c.add(new Request(u,{mode:'cors'}))}catch(_){}}self.skipWaiting()})())});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('caderno-')&&k!==V)await caches.delete(k);await self.clients.claim()})())});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    e.respondWith((async()=>{try{const res=await fetch(r);if(res.ok){const c=await caches.open(V);c.put(r,res.clone())}return res}
      catch(_){return (await caches.match(r,{ignoreSearch:true}))||(r.mode==='navigate'?caches.match('index.html'):Response.error())}})());
    return;
  }
  if(/fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/.test(u.host)){
    e.respondWith((async()=>{const hit=await caches.match(r);if(hit)return hit;
      try{const res=await fetch(r);const c=await caches.open(V);c.put(r,res.clone());return res}catch(_){return Response.error()}})());
  }
});

