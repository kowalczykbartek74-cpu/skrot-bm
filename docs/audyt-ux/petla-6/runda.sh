#!/bin/bash
# Przygotowanie audytu rundy R (E1 pkt 1): docs/audyt-ux/petla-6/runda.sh <R>
# kontrola.mjs (pełna) + wyniki testów dopisane do kontrola.md + sonda w tle (zatrzymanie: curl -s 127.0.0.1:8826/stop).
cd "$(dirname "$0")/../../.." || exit 1
R=$1; D=docs/audyt-ux/petla-6/runda-$R; B=${BASE:-http://127.0.0.1:8816/}; L=/tmp/ux-6; mkdir -p $D $L
BASE=$B RUNDA=$R node docs/audyt-ux/petla-6/kontrola.mjs > $L/kontrola-$R.log 2>&1
BASE=$B node docs/gry/test/ux6-zadania.mjs > $L/zadania-$R.log 2>&1; ZT=$?
node --test --test-concurrency=1 tests/*.test.js > $L/unit-$R.log 2>&1; UT=$?
{
  echo; echo "## Testy (stan kodu tej rundy)"; echo
  echo "- \`node --test tests/*.test.js\`: kod wyjścia $UT · $(grep -E '^ℹ (pass|fail)' $L/unit-$R.log | tr '\n' ' ')"
  echo "- test regresji zadań \`ux6-zadania.mjs\` (czy da się dojść do celu znaną drogą): kod wyjścia $ZT · $(tail -1 $L/zadania-$R.log)"
} >> $D/kontrola.md
curl -s 127.0.0.1:8826/stop > /dev/null 2>&1; sleep 1
(BASE=$B RUNDA=$R node docs/audyt-ux/petla-6/sonda.mjs > $L/sonda-$R.log 2>&1 &)
sleep 3; curl -s -o /dev/null -w "sonda: %{http_code}\n" "127.0.0.1:8826/koniec"
tail -1 $L/kontrola-$R.log
