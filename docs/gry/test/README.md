# Testy gier i rankingu (Playwright na atrapie)

1. W katalogu repo: `python3 -m http.server 8765 --bind 127.0.0.1`
2. `node docs/gry/test/etap0.mjs` i `node docs/gry/test/etap1.mjs`, `etap2.mjs`, `etap3.mjs`, `etap4.mjs`, `etap5.mjs`, `etap7.mjs` (Hasło dnia), `etap8.mjs` (Drabina; Pary po uogólnieniu rdzenia – `etap3.mjs`), `etap9.mjs` (Boss), `scalanie.mjs` (okres próbny v16, monety / Zadania dnia / Sklep v14 razem z grami, zakładka Monety u starosty) (+ bez przeglądarki: `przejdz-generator.mjs`, `en-tabele.mjs`) (Playwright brany z `~/matura-app/node_modules`; inny katalog: `PW_FROM=/ścieżka/package.json`).
   Zrzuty ekranu lądują w `/tmp/gry-shots` (albo `OUT=…`).

`atrapa-supabase.js` podmienia supabase-js: sesja, `nauka_docs` w pamięci i funkcje RPC (v13, v15, v14 – monety, misje, sklep – i v16 – okres próbny) bez sieci. Przełączniki opisane na górze pliku.
Nic stąd nie trafia na stronę (`docs/` jest wyłączony w `_config.yml`).
