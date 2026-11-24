// Planet Bonk — 오프라인 캐시
const CACHE = 'pb-v6';
const ASSETS = [
  './',
  './index.html',
  './settings.js',
  './leaderboard.js',
  './manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// HTML·JS는 네트워크 우선(최신 코드 반영), 나머지는 캐시 우선
self.addEventListener('fetch', e => {
  const req = e.request;
  // 순위표 서버(Firebase)와의 통신은 캐시를 거치지 않음. 글꼴·Firebase 프로그램 파일만 캐시
  if (req.method !== 'GET') return;
  const host = new URL(req.url).hostname;
  if (new URL(req.url).origin !== self.location.origin
      && !/(^|\.)(gstatic\.com|fonts\.googleapis\.com)$/.test(host)) return;
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept')||'').includes('text/html');
  const isJS = new URL(req.url).pathname.endsWith('.js');
  if (isHTML || isJS) {
    // 우리 사이트 파일은 휴대폰에 남아 있는 옛 사본(최대 10분)을 쓰지 말고 매번 새 버전인지 확인
    const sameSite = new URL(req.url).origin === self.location.origin;
    const fresh = sameSite ? new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : req;
    e.respondWith(
      fetch(fresh).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
