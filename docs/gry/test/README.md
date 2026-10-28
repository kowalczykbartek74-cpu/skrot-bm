# Testy gier i rankingu (Playwright na atrapie)

1. W katalogu repo: `python3 -m http.server 8765 --bind 127.0.0.1`
2. `node docs/gry/test/etap0.mjs` i `node docs/gry/test/etap1.mjs`, `etap2.mjs` (Playwright brany z `~/matura-app/node_modules`; inny katalog: `PW_FROM=/ścieżka/package.json`).
   Zrzuty ekranu lądują w `/tmp/gry-shots` (albo `OUT=…`).

`atrapa-supabase.js` podmienia supabase-js: sesja, `nauka_docs` w pamięci i funkcje RPC (także v13) bez sieci.
Nic stąd nie trafia na stronę (`docs/` jest wyłączony w `_config.yml`).
