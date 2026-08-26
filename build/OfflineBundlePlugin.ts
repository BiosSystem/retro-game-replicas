import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import type { Plugin } from 'vite';

const CACHE_PREFIX = 'bios-arcade-';

export function offlineBundlePlugin(): Plugin {
  return {
    name: 'biossystem-offline-bundle',
    apply: 'build',
    async closeBundle() {
      const outputRoot = join(process.cwd(), 'dist');
      await writeFile(join(outputRoot, 'manifest.webmanifest'), `${JSON.stringify(webManifest(), null, 2)}\n`);
      const files = (await listFiles(outputRoot))
        .map(path => relative(outputRoot, path).split(sep).join('/'))
        .filter(path => path !== 'sw.js' && !path.startsWith('.vite/'))
        .sort();
      const fingerprint = createHash('sha256');
      for (const path of files) {
        fingerprint.update(path);
        fingerprint.update(await readFile(join(outputRoot, path)));
      }
      const version = fingerprint.digest('hex').slice(0, 16);
      await writeFile(join(outputRoot, 'sw.js'), serviceWorkerSource(files, version));
    },
  };
}

function webManifest() {
  return {
    id: '/',
    name: 'Universal Retro Arcade',
    short_name: 'Retro Arcade',
    description: 'A self-contained BiosSystem arcade with generated games, graphics, and audio.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'landscape',
    background_color: '#020407',
    theme_color: '#05080d',
    categories: ['games', 'entertainment'],
    icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}

async function listFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function serviceWorkerSource(files: readonly string[], version: string) {
  const urls = ['/', ...files.map(path => `/${path}`)];
  return `const CACHE_NAME=${JSON.stringify(`${CACHE_PREFIX}${version}`)};
const CACHE_PREFIX=${JSON.stringify(CACHE_PREFIX)};
const PRECACHE=${JSON.stringify(urls)};
const PRECACHE_PATHS=new Set(PRECACHE);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(PRECACHE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).catch(()=>caches.match('/index.html').then(response=>response||caches.match('/'))));
    return;
  }
  if(!PRECACHE_PATHS.has(url.pathname))return;
  event.respondWith(caches.open(CACHE_NAME).then(cache=>cache.match(url.pathname)).then(response=>response||fetch(request)));
});
`;
}
