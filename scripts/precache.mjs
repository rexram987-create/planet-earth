import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const paths=files('dist').filter(p=>!p.endsWith('/sw.js'));const version=crypto.createHash('sha256');paths.forEach(p=>version.update(fs.readFileSync(p)));const cache='terra-'+version.digest('hex').slice(0,12);const urls=['/',...paths.map(p=>'/'+p.replace(/^dist\//,''))];
fs.writeFileSync('dist/sw.js',`const CACHE=${JSON.stringify(cache)}, ASSETS=${JSON.stringify(urls)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('terra-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.open(CACHE).then(cache=>cache.match('/index.html'))));return;}
event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(event.request))||fetch(event.request)));});`);
console.log('Offline cache:',cache,urls.length,'files');
