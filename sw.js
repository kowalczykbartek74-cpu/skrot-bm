// Service worker Zdawalni (pętla UX-2, etap 4): start bez sieci i instalacja na ekranie głównym. Bez powiadomień push.
// Obsługuje TYLKO zapytania GET z tej samej domeny. Nigdy: Supabase, Stripe, plan.zdawalni.pl, CDN, inne domeny, POST.
//  - HTML i skrypty/style (także z ?v=): najpierw sieć, kopia w pamięci na wypadek braku sieci.
//  - ikony, obrazki, fonty, manifest: najpierw pamięć (zmieniają się rzadko).
// Wyłącznik: zmiana WERSJA kasuje stare pamięci przy aktywacji; strona z ?sw=off wyrejestrowuje workera (nawyk.js).
const WERSJA = "zdawalni-sw-20261117-1";
const STRONA = WERSJA + "-strona", PLIKI = WERSJA + "-pliki";

const sameOrigin = (url) => url.origin === self.location.origin;
const naStale = (url) => /\/icons\/|\.(?:png|jpg|jpeg|svg|webp|ico|woff2?|ttf)$|manifest\.webmanifest$/.test(url.pathname);
const strona = (req, url) => req.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith(".html");

// Przy instalacji: strona startowa i jej skrypty z tej samej domeny (adresy z ?v= z samego HTML), żeby Dziś działało offline
// już przy pierwszym ponownym wejściu.
self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    try {
      const c = await caches.open(STRONA), base = new URL("./", self.location.href);
      const r = await fetch(new URL("index.html", base), { cache: "no-store" });
      if (!r.ok) return;
      const html = await r.clone().text();
      await c.put(new URL("index.html", base).href, r.clone());
      await c.put(base.href, r);
      const src = [...html.matchAll(/<(?:script[^>]*\ssrc|link[^>]*\shref)="([^"]+)"/g)].map((m) => new URL(m[1], base)).filter((u) => sameOrigin(u));
      const p = await caches.open(PLIKI);
      await Promise.all(src.map((u) => fetch(u).then((x) => (x.ok ? (naStale(u) ? p : c).put(u.href, x) : null)).catch(() => null)));
    } catch (err) { /* bez sieci przy instalacji: kopia powstanie przy kolejnych wejściach */ }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("zdawalni-sw-") && !k.startsWith(WERSJA)) await caches.delete(k);
    await self.clients.claim();
  })());
});

// Nowa wersja pliku (inne ?v=): stare wpisy tej samej ścieżki znikają, żeby pamięć nie rosła.
async function polozJedna(c, req, res) {
  const u = new URL(req.url);
  if (u.search) for (const k of await c.keys()) { const ku = new URL(k.url); if (ku.pathname === u.pathname && ku.search !== u.search) await c.delete(k); }
  await c.put(req, res);
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (!sameOrigin(url)) return; // Supabase, Stripe, plan.zdawalni.pl, CDN, fonty Google: zawsze prosto do sieci
  if (url.searchParams.has("sw")) return;
  if (naStale(url)) {
    e.respondWith((async () => {
      const c = await caches.open(PLIKI), hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    })());
    return;
  }
  e.respondWith((async () => {
    const c = await caches.open(STRONA);
    try {
      const res = await fetch(req);
      if (res.ok && (strona(req, url) || /\.(?:js|css|json)$/.test(url.pathname))) await polozJedna(c, strona(req, url) ? new Request(new URL("index.html", self.location.href).href) : req, res.clone());
      return res;
    } catch (err) {
      const hit = (await c.match(req)) || (strona(req, url) ? (await c.match(new URL("index.html", self.location.href).href)) : null);
      if (hit) return hit;
      throw err;
    }
  })());
});
