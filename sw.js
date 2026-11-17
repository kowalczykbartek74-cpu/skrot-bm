// Service worker Zdawalni (pętla UX-2, etap 4): start bez sieci i instalacja na ekranie głównym. Bez powiadomień push.
// Obsługuje TYLKO zapytania GET z tej samej domeny. Nigdy: Supabase, Stripe, plan.zdawalni.pl, CDN, inne domeny, POST.
//  - HTML i skrypty/style (także z ?v=): najpierw sieć, kopia w pamięci na wypadek braku sieci.
//  - ikony, obrazki, fonty, manifest: najpierw pamięć (zmieniają się rzadko).
// Wyłącznik: zmiana WERSJA kasuje stare pamięci przy aktywacji; strona z ?sw=off wyrejestrowuje workera (nawyk.js).
const WERSJA = "zdawalni-sw-20261117-3";
const STRONA = WERSJA + "-strona", PLIKI = WERSJA + "-pliki";

const sameOrigin = (url) => url.origin === self.location.origin;
const naStale = (url) => /\/icons\/|\.(?:png|jpg|jpeg|svg|webp|ico|woff2?|ttf)$|manifest\.webmanifest$/.test(url.pathname);
// Strona aplikacji („/”, „/index.html”, z dowolnym ?…) ma jeden klucz w pamięci: index.html. Inne strony HTML (regulamin,
// wypis z przypomnień, plan) zapisują się pod własnym adresem i nigdy nie nadpisują kopii aplikacji.
const KLUCZ_APP = () => new URL("index.html", self.location.href).href;
const aplikacja = (url) => { const base = new URL("./", self.location.href).pathname; return url.pathname === base || url.pathname === base + "index.html"; };
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
      await c.put(KLUCZ_APP(), r);
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
    const c = await caches.open(STRONA), app = strona(req, url) && aplikacja(url);
    try {
      const res = await fetch(req);
      if (res.ok && app) await c.put(KLUCZ_APP(), res.clone()); // zawsze najświeższa strona aplikacji pod jednym kluczem
      else if (res.ok && (strona(req, url) || /\.(?:js|css|json)$/.test(url.pathname))) await polozJedna(c, new Request(url.origin + url.pathname + url.search), res.clone());
      return res;
    } catch (err) {
      // Bez sieci: dokładny adres, a gdy pamięć ma inną wersję pliku (inne ?v=), ta sama ścieżka – lepsze niż brak skryptu.
      const hit = app ? await c.match(KLUCZ_APP()) : (await c.match(req, { ignoreVary: true })) || (await c.match(req, { ignoreVary: true, ignoreSearch: true }));
      if (hit) return hit;
      throw err;
    }
  })());
});
