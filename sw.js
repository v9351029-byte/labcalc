/* ЛабКальк: хранит приложение и движок распознавания в телефоне, чтобы всё работало без интернета */
const V = 'labcalc-v2';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
const OCR = ['./tesseract/tesseract.min.js', './tesseract/worker.min.js',
  './tesseract/core/tesseract-core-simd-lstm.wasm.js', './tesseract/core/tesseract-core-lstm.wasm.js',
  './tesseract/lang/eng.traineddata.gz'];
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    await c.addAll(CORE);
    for (const f of OCR) { try { await c.add(f); } catch (_) { /* нет файла — распознавание пойдёт запасным путём */ } }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== V) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  e.respondWith((async () => {
    const c = await caches.open(V);
    const hit = await c.match(r, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(r);
      if (res.ok && new URL(r.url).origin === location.origin) c.put(r, res.clone());
      return res;
    } catch (err) {
      if (r.mode === 'navigate') return (await c.match('./index.html')) || Response.error();
      return Response.error();
    }
  })());
});
