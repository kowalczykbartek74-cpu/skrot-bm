fatal: path 'docs/audyt-ux/petla-1/etap-1/runda-1/raport.json' exists on disk, but not in 'origin/main'
fatal: path 'docs/audyt-ux/petla-1/etap-1/runda-2/raport.json' exists on disk, but not in 'origin/main'
fatal: path 'docs/logowanie-review/0/raport.json' exists on disk, but not in 'origin/main'
# Kontrola automatyczna – pętla UX-1

Stan: 647d1a2 test: scalanie i wyglad-logowanie – pasek próby nad panelem, kropka w pasku, tag „Wkrótce” w linii podpisu (pętla UX-1, etapy 1–2) (+ zmiany niezacommitowane)

## git diff --stat origin/main

```
docs/audyt-ux/petla-1/PROGRESS.md                  |   46 +
 .../runda-1/arkusz-proby-1280-ciemny-ekran1.png    |  Bin 0 -> 171729 bytes
 .../runda-1/arkusz-proby-1280-jasny-ekran1.png     |  Bin 0 -> 164582 bytes
 .../runda-1/arkusz-proby-360-ciemny-ekran1.png     |  Bin 0 -> 61827 bytes
 .../runda-1/arkusz-proby-360-jasny-ekran1.png      |  Bin 0 -> 61140 bytes
 .../runda-1/arkusz-proby-390-ciemny-ekran1.png     |  Bin 0 -> 87793 bytes
 .../runda-1/arkusz-proby-390-jasny-ekran1.png      |  Bin 0 -> 86194 bytes
 .../runda-1/arkusz-proby-390-jasny-en-ekran1.png   |  Bin 0 -> 84222 bytes
 .../runda-1/blad-limitu-390-ciemny-ekran1.png      |  Bin 0 -> 67937 bytes
 .../runda-1/blad-limitu-390-jasny-ekran1.png       |  Bin 0 -> 70266 bytes
 .../runda-1/blad-limitu-390-jasny-en-ekran1.png    |  Bin 0 -> 67025 bytes
 .../runda-1/dzis-darmowe-1280-ciemny-ekran1.png    |  Bin 0 -> 134243 bytes
 .../etap-1/runda-1/dzis-darmowe-1280-ciemny.png    |  Bin 0 -> 253446 bytes
 .../runda-1/dzis-darmowe-1280-jasny-ekran1.png     |  Bin 0 -> 131666 bytes
 .../etap-1/runda-1/dzis-darmowe-1280-jasny.png     |  Bin 0 -> 269940 bytes
 .../runda-1/dzis-darmowe-360-ciemny-ekran1.png     |  Bin 0 -> 65836 bytes
 .../etap-1/runda-1/dzis-darmowe-360-ciemny.png     |  Bin 0 -> 201082 bytes
 .../runda-1/dzis-darmowe-360-jasny-ekran1.png      |  Bin 0 -> 64532 bytes
 .../etap-1/runda-1/dzis-darmowe-360-jasny.png      |  Bin 0 -> 203662 bytes
 .../runda-1/dzis-darmowe-390-ciemny-ekran1.png     |  Bin 0 -> 83603 bytes
 .../etap-1/runda-1/dzis-darmowe-390-ciemny.png     |  Bin 0 -> 202726 bytes
 .../runda-1/dzis-darmowe-390-jasny-ekran1.png      |  Bin 0 -> 81413 bytes
 .../runda-1/dzis-darmowe-390-jasny-en-ekran1.png   |  Bin 0 -> 83192 bytes
 .../etap-1/runda-1/dzis-darmowe-390-jasny-en.png   |  Bin 0 -> 202084 bytes
 .../etap-1/runda-1/dzis-darmowe-390-jasny.png      |  Bin 0 -> 206240 bytes
 .../dzis-platne-bez-paska-390-ciemny-ekran1.png    |  Bin 0 -> 88300 bytes
 .../dzis-platne-bez-paska-390-jasny-ekran1.png     |  Bin 0 -> 89073 bytes
 .../runda-1/kod-po-60s-360-ciemny-ekran1.png       |  Bin 0 -> 57704 bytes
 .../etap-1/runda-1/kod-po-60s-360-ciemny.png       |  Bin 0 -> 90831 bytes
 .../etap-1/runda-1/kod-po-60s-360-jasny-ekran1.png |  Bin 0 -> 58209 bytes
 .../etap-1/runda-1/kod-po-60s-360-jasny.png        |  Bin 0 -> 90616 bytes
 .../runda-1/kod-po-60s-390-ciemny-ekran1.png       |  Bin 0 -> 68809 bytes
 .../etap-1/runda-1/kod-po-60s-390-ciemny.png       |  Bin 0 -> 88301 bytes
 .../etap-1/runda-1/kod-po-60s-390-jasny-ekran1.png |  Bin 0 -> 69014 bytes
 .../runda-1/kod-po-60s-390-jasny-en-ekran1.png     |  Bin 0 -> 63490 bytes
 .../etap-1/runda-1/kod-po-60s-390-jasny-en.png     |  Bin 0 -> 85987 bytes
 .../etap-1/runda-1/kod-po-60s-390-jasny.png        |  Bin 0 -> 88655 bytes
 .../runda-1/kod-tryb-proby-1280-ciemny-ekran1.png  |  Bin 0 -> 183756 bytes
 .../runda-1/kod-tryb-proby-1280-jasny-ekran1.png   |  Bin 0 -> 181929 bytes
 .../runda-1/kod-tryb-proby-390-ciemny-ekran1.png   |  Bin 0 -> 70163 bytes
 .../runda-1/kod-tryb-proby-390-jasny-ekran1.png    |  Bin 0 -> 70661 bytes
 .../runda-1/kod-tryb-proby-390-jasny-en-ekran1.png |  Bin 0 -> 65945 bytes
 docs/audyt-ux/petla-1/etap-1/runda-1/kontrola.md   |   67 +
 .../runda-1/logowanie-1280-ciemny-ekran1.png       |  Bin 0 -> 196861 bytes
 .../etap-1/runda-1/logowanie-1280-ciemny.png       |  Bin 0 -> 138643 bytes
 .../etap-1/runda-1/logowanie-1280-jasny-ekran1.png |  Bin 0 -> 198873 bytes
 .../etap-1/runda-1/logowanie-1280-jasny.png        |  Bin 0 -> 140210 bytes
 .../etap-1/runda-1/logowanie-360-ciemny-ekran1.png |  Bin 0 -> 71842 bytes
 .../etap-1/runda-1/logowanie-360-ciemny.png        |  Bin 0 -> 124509 bytes
 .../etap-1/runda-1/logowanie-360-jasny-ekran1.png  |  Bin 0 -> 76840 bytes
 .../petla-1/etap-1/runda-1/logowanie-360-jasny.png |  Bin 0 -> 129271 bytes
 .../etap-1/runda-1/logowanie-390-ciemny-ekran1.png |  Bin 0 -> 87940 bytes
 .../etap-1/runda-1/logowanie-390-ciemny.png        |  Bin 0 -> 123768 bytes
 .../etap-1/runda-1/logowanie-390-jasny-ekran1.png  |  Bin 0 -> 92813 bytes
 .../runda-1/logowanie-390-jasny-en-ekran1.png      |  Bin 0 -> 94404 bytes
 .../etap-1/runda-1/logowanie-390-jasny-en.png      |  Bin 0 -> 128730 bytes
 .../petla-1/etap-1/runda-1/logowanie-390-jasny.png |  Bin 0 -> 128534 bytes
 .../logowanie-bez-grupy-1280-ciemny-ekran1.png     |  Bin 0 -> 183791 bytes
 .../runda-1/logowanie-bez-grupy-1280-ciemny.png    |  Bin 0 -> 155359 bytes
 .../logowanie-bez-grupy-1280-jasny-ekran1.png      |  Bin 0 -> 182134 bytes
 .../runda-1/logowanie-bez-grupy-1280-jasny.png     |  Bin 0 -> 152781 bytes
 .../logowanie-bez-grupy-390-ciemny-ekran1.png      |  Bin 0 -> 89283 bytes
 .../runda-1/logowanie-bez-grupy-390-ciemny.png     |  Bin 0 -> 170356 bytes
 .../logowanie-bez-grupy-390-jasny-ekran1.png       |  Bin 0 -> 91066 bytes
 .../runda-1/logowanie-bez-grupy-390-jasny.png      |  Bin 0 -> 170644 bytes
 .../logowanie-tryb-proby-390-ciemny-ekran1.png     |  Bin 0 -> 86766 bytes
 .../logowanie-tryb-proby-390-jasny-ekran1.png      |  Bin 0 -> 90362 bytes
 .../logowanie-tryb-proby-390-jasny-en-ekran1.png   |  Bin 0 -> 88994 bytes
 .../runda-1/przejscie-darmowe-arkusz-pozniej-1.png |  Bin 0 -> 86162 bytes
 .../runda-1/przejscie-darmowe-arkusz-pozniej-2.png |  Bin 0 -> 81670 bytes
 .../runda-1/przejscie-darmowe-arkusz-pozniej-3.png |  Bin 0 -> 81470 bytes
 .../runda-1/przejscie-darmowe-arkusz-tak-1.png     |  Bin 0 -> 85366 bytes
 .../runda-1/przejscie-darmowe-arkusz-tak-2.png     |  Bin 0 -> 76721 bytes
 .../runda-1/przejscie-darmowe-pasek-wlacz-1.png    |  Bin 0 -> 81413 bytes
 .../runda-1/przejscie-darmowe-pasek-wlacz-2.png    |  Bin 0 -> 77373 bytes
 .../runda-1/przejscie-kod-wyslij-ponownie-1.png    |  Bin 0 -> 60840 bytes
 .../runda-1/przejscie-kod-wyslij-ponownie-2.png    |  Bin 0 -> 77147 bytes
 .../runda-1/przejscie-kod-wyslij-ponownie-3.png    |  Bin 0 -> 79806 bytes
 .../runda-1/przejscie-nowa-osoba-proba-1.png       |  Bin 0 -> 92869 bytes
 .../runda-1/przejscie-nowa-osoba-proba-2.png       |  Bin 0 -> 89945 bytes
 .../runda-1/przejscie-nowa-osoba-proba-3.png       |  Bin 0 -> 70670 bytes
 .../runda-1/przejscie-nowa-osoba-proba-4.png       |  Bin 0 -> 69846 bytes
 docs/audyt-ux/petla-1/etap-1/runda-1/raport.json   | 1719 ++++++++++++++++++++
 docs/audyt-ux/petla-1/etap-1/runda-1/raport.md     |  175 ++
 docs/audyt-ux/petla-1/etap-1/runda-1/test.log      |   90 +
 .../runda-2/arkusz-proby-1280-ciemny-ekran1.png    |  Bin 0 -> 154643 bytes
 .../runda-2/arkusz-proby-1280-jasny-ekran1.png     |  Bin 0 -> 151658 bytes
 .../runda-2/arkusz-proby-360-ciemny-ekran1.png     |  Bin 0 -> 62262 bytes
 .../runda-2/arkusz-proby-360-jasny-ekran1.png      |  Bin 0 -> 60643 bytes
 .../runda-2/arkusz-proby-390-ciemny-ekran1.png     |  Bin 0 -> 81084 bytes
 .../runda-2/arkusz-proby-390-jasny-ekran1.png      |  Bin 0 -> 81539 bytes
 .../runda-2/arkusz-proby-390-jasny-en-ekran1.png   |  Bin 0 -> 77867 bytes
 .../runda-2/blad-limitu-390-ciemny-ekran1.png      |  Bin 0 -> 67956 bytes
 .../runda-2/blad-limitu-390-jasny-ekran1.png       |  Bin 0 -> 70240 bytes
 .../runda-2/blad-limitu-390-jasny-en-ekran1.png    |  Bin 0 -> 66832 bytes
 .../runda-2/dzis-darmowe-1280-ciemny-ekran1.png    |  Bin 0 -> 139273 bytes
 .../etap-1/runda-2/dzis-darmowe-1280-ciemny.png    |  Bin 0 -> 239635 bytes
 .../runda-2/dzis-darmowe-1280-jasny-ekran1.png     |  Bin 0 -> 142794 bytes
 .../etap-1/runda-2/dzis-darmowe-1280-jasny.png     |  Bin 0 -> 255321 bytes
 .../runda-2/dzis-darmowe-360-ciemny-ekran1.png     |  Bin 0 -> 65836 bytes
 .../etap-1/runda-2/dzis-darmowe-360-ciemny.png     |  Bin 0 -> 187901 bytes
 .../runda-2/dzis-darmowe-360-jasny-ekran1.png      |  Bin 0 -> 64576 bytes
 .../etap-1/runda-2/dzis-darmowe-360-jasny.png      |  Bin 0 -> 190887 bytes
 .../runda-2/dzis-darmowe-390-ciemny-ekran1.png     |  Bin 0 -> 84095 bytes
 .../etap-1/runda-2/dzis-darmowe-390-ciemny.png     |  Bin 0 -> 189556 bytes
 .../runda-2/dzis-darmowe-390-jasny-ekran1.png      |  Bin 0 -> 81828 bytes
 .../runda-2/dzis-darmowe-390-jasny-en-ekran1.png   |  Bin 0 -> 82152 bytes
 .../etap-1/runda-2/dzis-darmowe-390-jasny-en.png   |  Bin 0 -> 186993 bytes
 .../etap-1/runda-2/dzis-darmowe-390-jasny.png      |  Bin 0 -> 192614 bytes
 .../dzis-platne-bez-paska-390-ciemny-ekran1.png    |  Bin 0 -> 88300 bytes
 .../dzis-platne-bez-paska-390-jasny-ekran1.png     |  Bin 0 -> 89073 bytes
 .../runda-2/kod-po-60s-360-ciemny-ekran1.png       |  Bin 0 -> 48381 bytes
 .../etap-1/runda-2/kod-po-60s-360-ciemny.png       |  Bin 0 -> 87682 bytes
 .../etap-1/runda-2/kod-po-60s-360-jasny-ekran1.png |  Bin 0 -> 48302 bytes
 .../etap-1/runda-2/kod-po-60s-360-jasny.png        |  Bin 0 -> 87901 bytes
 .../runda-2/kod-po-60s-390-ciemny-ekran1.png       |  Bin 0 -> 72309 bytes
 .../etap-1/runda-2/kod-po-60s-390-ciemny.png       |  Bin 0 -> 86214 bytes
 .../etap-1/runda-2/kod-po-60s-390-jasny-ekran1.png |  Bin 0 -> 71819 bytes
 .../runda-2/kod-po-60s-390-jasny-en-ekran1.png     |  Bin 0 -> 67529 bytes
 .../etap-1/runda-2/kod-po-60s-390-jasny-en.png     |  Bin 0 -> 83997 bytes
 .../etap-1/runda-2/kod-po-60s-390-jasny.png        |  Bin 0 -> 85825 bytes
 .../runda-2/kod-tryb-proby-1280-ciemny-ekran1.png  |  Bin 0 -> 184632 bytes
 .../runda-2/kod-tryb-proby-1280-jasny-ekran1.png   |  Bin 0 -> 182912 bytes
 .../runda-2/kod-tryb-proby-390-ciemny-ekran1.png   |  Bin 0 -> 72699 bytes
 .../runda-2/kod-tryb-proby-390-jasny-ekran1.png    |  Bin 0 -> 72387 bytes
 .../runda-2/kod-tryb-proby-390-jasny-en-ekran1.png |  Bin 0 -> 68100 bytes
 docs/audyt-ux/petla-1/etap-1/runda-2/kontrola.md   |  172 ++
 .../runda-2/logowanie-1280-ciemny-ekran1.png       |  Bin 0 -> 194476 bytes
 .../etap-1/runda-2/logowanie-1280-ciemny.png       |  Bin 0 -> 138643 bytes
 .../etap-1/runda-2/logowanie-1280-jasny-ekran1.png |  Bin 0 -> 196583 bytes
 .../etap-1/runda-2/logowanie-1280-jasny.png        |  Bin 0 -> 140210 bytes
 .../etap-1/runda-2/logowanie-360-ciemny-ekran1.png |  Bin 0 -> 75453 bytes
 .../etap-1/runda-2/logowanie-360-ciemny.png        |  Bin 0 -> 132113 bytes
 .../etap-1/runda-2/logowanie-360-jasny-ekran1.png  |  Bin 0 -> 80904 bytes
 .../petla-1/etap-1/runda-2/logowanie-360-jasny.png |  Bin 0 -> 137313 bytes
 .../etap-1/runda-2/logowanie-390-ciemny-ekran1.png |  Bin 0 -> 94579 bytes
 .../etap-1/runda-2/logowanie-390-ciemny.png        |  Bin 0 -> 131533 bytes
 .../etap-1/runda-2/logowanie-390-jasny-ekran1.png  |  Bin 0 -> 99793 bytes
 .../runda-2/logowanie-390-jasny-en-ekran1.png      |  Bin 0 -> 99266 bytes
 .../etap-1/runda-2/logowanie-390-jasny-en.png      |  Bin 0 -> 137527 bytes
 .../petla-1/etap-1/runda-2/logowanie-390-jasny.png |  Bin 0 -> 136574 bytes
 .../logowanie-bez-grupy-1280-ciemny-ekran1.png     |  Bin 0 -> 181925 bytes
 .../runda-2/logowanie-bez-grupy-1280-ciemny.png    |  Bin 0 -> 155359 bytes
 .../logowanie-bez-grupy-1280-jasny-ekran1.png      |  Bin 0 -> 180272 bytes
 .../runda-2/logowanie-bez-grupy-1280-jasny.png     |  Bin 0 -> 152781 bytes
 .../logowanie-bez-grupy-390-ciemny-ekran1.png      |  Bin 0 -> 89354 bytes
 .../runda-2/logowanie-bez-grupy-390-ciemny.png     |  Bin 0 -> 170510 bytes
 .../logowanie-bez-grupy-390-jasny-ekran1.png       |  Bin 0 -> 91164 bytes
 .../runda-2/logowanie-bez-grupy-390-jasny.png      |  Bin 0 -> 170749 bytes
 .../logowanie-tryb-proby-390-ciemny-ekran1.png     |  Bin 0 -> 91760 bytes
 .../logowanie-tryb-proby-390-jasny-ekran1.png      |  Bin 0 -> 95045 bytes
 .../logowanie-tryb-proby-390-jasny-en-ekran1.png   |  Bin 0 -> 93789 bytes
 .../runda-2/przejscie-darmowe-arkusz-pozniej-1.png |  Bin 0 -> 81485 bytes
 .../runda-2/przejscie-darmowe-arkusz-pozniej-2.png |  Bin 0 -> 82084 bytes
 .../runda-2/przejscie-darmowe-arkusz-pozniej-3.png |  Bin 0 -> 81828 bytes
 .../runda-2/przejscie-darmowe-arkusz-tak-1.png     |  Bin 0 -> 80728 bytes
 .../runda-2/przejscie-darmowe-arkusz-tak-2.png     |  Bin 0 -> 75510 bytes
 .../runda-2/przejscie-darmowe-pasek-wlacz-1.png    |  Bin 0 -> 81828 bytes
 .../runda-2/przejscie-darmowe-pasek-wlacz-2.png    |  Bin 0 -> 75506 bytes
 .../runda-2/przejscie-kod-wyslij-ponownie-1.png    |  Bin 0 -> 54590 bytes
 .../runda-2/przejscie-kod-wyslij-ponownie-2.png    |  Bin 0 -> 70815 bytes
 .../runda-2/przejscie-kod-wyslij-ponownie-3.png    |  Bin 0 -> 76069 bytes
 .../runda-2/przejscie-nowa-osoba-proba-1.png       |  Bin 0 -> 99747 bytes
 .../runda-2/przejscie-nowa-osoba-proba-2.png       |  Bin 0 -> 95486 bytes
 .../runda-2/przejscie-nowa-osoba-proba-3.png       |  Bin 0 -> 72397 bytes
 .../runda-2/przejscie-nowa-osoba-proba-4.png       |  Bin 0 -> 72134 bytes
 docs/audyt-ux/petla-1/etap-1/runda-2/raport.json   | 1719 ++++++++++++++++++++
 docs/audyt-ux/petla-1/etap-1/runda-2/raport.md     |  175 ++
 docs/audyt-ux/petla-1/etap-1/runda-2/test.log      |   95 ++
 docs/audyt-ux/petla-1/kontrola.mjs                 |  114 ++
 docs/audyt-ux/petla-1/pomiary.mjs                  |  125 ++
 docs/audyt-ux/petla-1/recenzja/etap-1.md           |  167 ++
 docs/audyt-ux/petla-1/scenariusze-1.mjs            |   52 +
 docs/audyt-ux/petla-1/uwagi-dla-innych.md          |   10 +
 docs/gry/test/atrapa-supabase.js                   |    9 +-
 docs/gry/test/h2-etap9.mjs                         |    3 +-
 docs/gry/test/scalanie.mjs                         |   10 +-
 docs/gry/test/ux1-etap1.mjs                        |  190 +++
 docs/gry/test/ux1-etap2.mjs                        |  173 ++
 docs/gry/test/wyglad-logowanie.mjs                 |    2 +-
 docs/logowanie-review/0/en-375-1-kierunek.png      |  Bin 0 -> 217501 bytes
 docs/logowanie-review/0/en-375-2-grupa.png         |  Bin 0 -> 109437 bytes
 docs/logowanie-review/0/en-375-3-logowanie.png     |  Bin 0 -> 139615 bytes
 .../0/pl-1280-1-kierunek-ekran1.png                |  Bin 0 -> 189072 bytes
 docs/logowanie-review/0/pl-1280-1-kierunek.png     |  Bin 0 -> 293416 bytes
 docs/logowanie-review/0/pl-1280-2-grupa-ekran1.png |  Bin 0 -> 180086 bytes
 docs/logowanie-review/0/pl-1280-2-grupa.png        |  Bin 0 -> 190730 bytes
 .../0/pl-1280-3-logowanie-ekran1.png               |  Bin 0 -> 182385 bytes
 docs/logowanie-review/0/pl-1280-3-logowanie.png    |  Bin 0 -> 218978 bytes
 docs/logowanie-review/0/pl-375-1-kierunek.png      |  Bin 0 -> 231090 bytes
 docs/logowanie-review/0/pl-375-2-grupa.png         |  Bin 0 -> 109102 bytes
 docs/logowanie-review/0/pl-375-3-logowanie.png     |  Bin 0 -> 138124 bytes
 docs/logowanie-review/0/raport.json                |  171 ++
 docs/logowanie-review/0/raport.md                  |   85 +
 i18n-en.js                                         |   50 +-
 index.html                                         |   46 +-
 przypomnienia.js                                   |   31 +-
 skrot-supabase.js                                  |  117 +-
 supabase/functions/przypomnienia/logika.js         |   31 +-
 supabase/functions/przypomnienia/obsluga.ts        |   34 +-
 supabase/skrot-v52-proba-rocznik.sql               |   54 +
 supabase/test/pglite.mjs                           |    2 +-
 supabase/test/v52.sql                              |   54 +
 ux-wejscie.css                                     |  176 ++
 ux-wejscie.js                                      |  175 ++
 205 files changed, 6090 insertions(+), 49 deletions(-)
nowy (niedodany): docs/audyt-ux/petla-1/etap-2/
nowy (niedodany): docs/audyt-ux/petla-1/recenzja/etap-2.md
nowy (niedodany): docs/audyt-ux/petla-1/recenzja/etap-3.md
nowy (niedodany): docs/audyt-ux/petla-1/scenariusze-2.mjs
nowy (niedodany): docs/audyt-ux/petla-1/scenariusze-3.mjs
nowy (niedodany): docs/gry/test/ux1-etap3.mjs
nowy (niedodany): supabase/skrot-v53-proba-przypomnienie.sql
nowy (niedodany): supabase/test/v53.sql
nowy (niedodany): tests/ux1-proba-mail.test.js
```

## Zmienione funkcje (porównanie z listą B3)

### index.html

- ✓ `(linia 1: #login)` (linie 1)
- ✗ POZA LISTĄ `(CSS)` (linie 19, 21, 35, 49, 5120)
- ✓ `(CSS szarego .btn na Dziś)` (linie 5117)
- ◦ umowa/most `(ładowanie własnego pliku)` (linie 5382, 22938)
- ◦ umowa/most `(linia <script src> – ?v=)` (linie 5394)
- ✓ `buyBanner` (linie 7740)
- ◦ umowa/most `(wywołanie z umowy)` (linie 7747, 8012, 11535, 11587, 20253)
- ✗ POZA LISTĄ `setKonto` (linie 14710)
- ◦ umowa/most `(blok mostu)` (linie 22933)

### skrot-supabase.js

- ✗ POZA LISTĄ `rocznikiBaza` (linie 230)
- ✗ POZA LISTĄ `rocznikStatus` (linie 242)
- ✗ POZA LISTĄ `trialCan` (linie 264)
- ✓ `otpErr` (linie 986)
- ✓ `codeStep` (linie 1032, 1046, 1059, 1080, 1085)
- ✓ `passStep` (linie 1094, 1111, 1125, 1128, 1130, 1137)
- ✓ `modeSwitch` (linie 1141)
- ✓ `emailStep` (linie 1146, 1160, 1170, 1175, 1177, 1186, 1193)
- ✗ POZA LISTĄ `listaOczekujacych` (linie 1345)
- ✓ `trialOffer` (linie 1496)
- ✓ `TRIAL_ERR` (linie 1521)
- ◦ umowa/most `(wywołanie z umowy)` (linie 1535)
- ✓ `afterReady` (linie 1594)

## Emoji w dodanych liniach kodu

- `+  ok("K3: funkcja przypomnienia: rodzaj „proba” przed innymi i w limit_dzien (tests/ux1-proba-mail.test.js + stare testy)", /ℹ fail 0/.test(out) && /ℹ pass 15/`

## Skrót tablic quiz (przed → po)

- docs/gry/test/atrapa-supabase.js: 05e07dea5687 → 05e07dea5687 ✓
- pliki JSON w docs/: 18, wszystkie równe: tak ✓

## Nowe migracje

### supabase/skrot-v52-proba-rocznik.sql

```
(brak wyniku)
```

### supabase/skrot-v53-proba-przypomnienie.sql

```
(brak wyniku)
```

## Nowe teksty PL bez pary EN (przybliżenie: literały z polskimi słowami w dodanych liniach)

- „{0} pełnego dostępu · potem {0} do końca 2. semestru albo {0}”
- „{0} · okres próbny, {0}”
- „Wysłaliśmy 6-cyfrowy kod na ”
- „Kod wysłaliśmy na ”
- „{0} zł”
- „Okres próbny – {0}”

(sprawdzonych literałów: 52; teksty złożone sprawdza test Playwright w trybie EN)
