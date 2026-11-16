# Kontrola automatyczna UX-5 (2026-11-16T19:36, względem origin/main)

## 1. git diff --stat
```
docs/gry/test/atrapa-supabase.js | 19 ++++++++++
 i18n-en.js                       | 34 ++++++++++++++++-
 index.html                       | 79 +++++++++++++++++++++++++---------------
 supabase/test/pglite.mjs         |  2 +-
 4 files changed, 103 insertions(+), 31 deletions(-)
```

## 2. Zmienione funkcje (lista B3 pętli 5)
### index.html
- ✓ `[linia 1: ?v= i18n.js]` (1 linii)
- ✓ `[CSS/HTML przed skryptem]` (5 linii)
- ✓ `subjectHero` (6 linii)
- ✓ `courseSection` (32 linii)
- ✓ `viewMaterial` (1 linii)
- ✓ `ptsMilestone` (1 linii)
- ✓ `[most ux-5]` (3 linii)
- ✓ `[ładowanie nagrody.js]` (1 linii)
- CSS (dodane/zmienione reguły):
  - `.sk-node, .lp-node { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 12px`
  - `.sk-node .t, .lp-node .t { min-width: 0; overflow-wrap: anywhere; display: grid; gap: 2px`
  - `.sk-node.now, .lp-node.now, .sk-node.opt, .lp-node.opt { display: grid; grid-template-col`
  - `.sk-node.lock { white-space: normal; font-size: inherit; color: inherit; } /* ux-5: ogóln`
  - `.sk-node .t { grid-template-columns: minmax(0, 1fr); }`
- wywołania z umów:
  - `    window.ZD_NAGRODY?.dzialSprawdz?.(sid); // ux-5: koniec działu = nagroda z bazy (v58)`
### skrot-supabase.js
- bez zmian

## 3. Emoji w dodanych liniach kodu
- brak ✓

## 4. Tablice quiz (hash linii z „quiz”)
- atrapa: przed d9b925bb92c73b96 · po d9b925bb92c73b96 ✓ równe
- pliki docs/*.json|js z innym hashem: brak ✓

## 5. Nowe migracje
- `skrot-v58-nagroda-dzial.sql`: strażnik kodowania ✓; `funkcje-sql.mjs --nadpisane`: (pusto: żadna funkcja nie ma późniejszej wersji) ✓

## 6. Nowe teksty PL bez pary EN (przybliżenie: literał w całości; zdania składane z kilku części mogą być fałszywym alarmem)
- index.html: : hasU ? `Dział {0}: ${u.title ||
- index.html: {0}. {1}{2}{3}{4}

