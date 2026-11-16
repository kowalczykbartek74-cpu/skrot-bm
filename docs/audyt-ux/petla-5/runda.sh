#!/bin/bash
# Pomiary i log jednej rundy: docs/audyt-ux/petla-5/runda.sh <etap> <runda>
# Uruchamia: test etapu (zrzuty + raport), kontrola.mjs, node --test, PGlite, istniejące h2-*.mjs i wcześniejsze ux5-etap*.mjs. Log: etap-N/runda-R/testy.log
cd "$(dirname "$0")/../../.." || exit 1
E=$1; R=$2; D=docs/audyt-ux/petla-5/etap-$E/runda-$R; B=${BASE:-http://127.0.0.1:8815/}
mkdir -p $D
RUNDA=$R BASE=$B node docs/gry/test/ux5-etap$E.mjs > /tmp/ux-5/etap$E-r$R.log 2>&1; ET=$?
node docs/audyt-ux/petla-5/kontrola.mjs $D/kontrola.md > /dev/null 2>&1
node --test --test-concurrency=1 tests/*.test.js > /tmp/ux-5/unit.log 2>&1; UT=$?
node supabase/test/pglite.mjs > /tmp/ux-5/pglite.log 2>&1; PT=$?
H=""; for f in docs/gry/test/h2-etap*.mjs; do o=$(BASE=$B OUT=/tmp/ux-5 node $f 2>&1); H="$H$(basename $f): $(echo "$o" | tail -1)$(echo "$o" | grep -c '^✗' | sed 's/^0$//;s/^\(.\+\)$/ (✗ \1)/')\n"; done
P=""; for e in $( [ "$E" -gt 1 ] && seq 1 $((E-1)) ); do o=$(RUNDA=kontrola-po-etapie-$E BASE=$B node docs/gry/test/ux5-etap$e.mjs 2>&1); P="${P}ux5-etap$e.mjs: $(echo "$o" | tail -1)\n"; rm -rf docs/audyt-ux/petla-5/etap-$e/runda-kontrola-po-etapie-$E; done
{
  echo "# Log testów – etap G$E runda $R ($(date '+%Y-%m-%d %H:%M'))"; echo
  echo "## ux5-etap$E.mjs (kod wyjścia $ET)"; echo '```'; cat /tmp/ux-5/etap$E-r$R.log; echo '```'; echo
  echo "## node --test tests/*.test.js (kod wyjścia $UT)"; grep -E "^ℹ (tests|pass|fail|skipped)" /tmp/ux-5/unit.log; echo
  echo "## PGlite (kod wyjścia $PT; ✗ v12 limit_wpisow jest oczekiwany)"; echo '```'; grep -E "✗|v5[89]|v6[0-2]|V5[89]|V6[0-2]" /tmp/ux-5/pglite.log; tail -3 /tmp/ux-5/pglite.log; echo '```'; echo
  echo "## istniejące testy h2-*.mjs"; printf "$H"; echo
  [ -n "$P" ] && { echo "## wcześniejsze etapy pętli 5"; printf "$P"; }
} > $D/testy.log
echo "etap $ET unit $UT pglite $PT"; printf "$H$P"
