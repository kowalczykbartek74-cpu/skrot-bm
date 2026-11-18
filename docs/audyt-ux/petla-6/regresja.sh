#!/bin/bash
# Wszystkie istniejące testy Playwright po kolei (A3 pkt 10): docs/audyt-ux/petla-6/regresja.sh > log
# Kolejno, nie równolegle (równoległe przebiegi dają fałszywe ✗). Pliki raportów starych pętli, które testy nadpisują, przywraca git.
cd "$(dirname "$0")/../../.." || exit 1
B=${BASE:-http://127.0.0.1:8816/}; mkdir -p /tmp/ux-6/h2
for f in docs/gry/test/h2-etap*.mjs docs/gry/test/ux[1-5]-etap*.mjs docs/gry/test/etap2.mjs docs/gry/test/dzien.mjs docs/gry/test/przygotuj-sie.mjs docs/gry/test/dzis-prosciej.mjs docs/gry/test/lekcja-dnia-4.mjs docs/gry/test/ux6-zadania.mjs; do
  [ -f "$f" ] || continue
  o=$(BASE=$B OUT=/tmp/ux-6/h2 node $f 2>&1); n=$(echo "$o" | grep -c '^✗')
  echo "$(basename $f): $(echo "$o" | tail -1) ${n}✗"; [ "$n" != 0 ] && echo "$o" | grep '^✗' | cut -c1-200 | sed 's/^/    /'
done
git status --short | grep -v '^??' | awk '{print $2}' | grep -E '^docs/(audyt-ux/petla-[1-5]|dzis-review|gry/)' | grep -v '\.mjs$\|\.js$' | xargs git checkout -- 2>/dev/null
echo koniec
