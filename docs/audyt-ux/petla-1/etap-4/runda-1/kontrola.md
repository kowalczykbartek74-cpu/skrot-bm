fatal: path 'docs/audyt-ux/petla-1/etap-1/runda-1/raport.json' exists on disk, but not in 'origin/main'
fatal: path 'docs/audyt-ux/petla-1/etap-1/runda-2/raport.json' exists on disk, but not in 'origin/main'
fatal: path 'docs/audyt-ux/petla-1/etap-2/runda-1/raport.json' exists on disk, but not in 'origin/main'
fatal: path 'docs/audyt-ux/petla-1/etap-2/runda-2/raport.json' exists on disk, but not in 'origin/main'
fatal: path 'docs/audyt-ux/petla-1/etap-3/runda-1/raport.json' exists on disk, but not in 'origin/main'
fatal: path 'docs/logowanie-review/0/raport.json' exists on disk, but not in 'origin/main'
# Kontrola automatyczna – pętla UX-1

Stan: 5dfc568 test: scalanie – po próbie pasek „Próba minęła” (koniec próby z bazy, pętla UX-1 etap 4) (+ zmiany niezacommitowane)

## git diff --stat origin/main

```
docs/audyt-ux/petla-1/PROGRESS.md                  |   66 +
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
 docs/audyt-ux/petla-1/etap-1/runda-1/raport.json   | 1719 ++++++++++++++++
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
 docs/audyt-ux/petla-1/etap-1/runda-2/raport.json   | 1719 ++++++++++++++++
 docs/audyt-ux/petla-1/etap-1/runda-2/raport.md     |  175 ++
 docs/audyt-ux/petla-1/etap-1/runda-2/test.log      |   95 +
 .../arkusz-ostatnie-godziny-1280-ciemny-ekran1.png |  Bin 0 -> 170401 bytes
 .../arkusz-ostatnie-godziny-1280-jasny-ekran1.png  |  Bin 0 -> 168577 bytes
 .../arkusz-ostatnie-godziny-360-ciemny-ekran1.png  |  Bin 0 -> 46849 bytes
 .../arkusz-ostatnie-godziny-360-jasny-ekran1.png   |  Bin 0 -> 46704 bytes
 .../arkusz-ostatnie-godziny-390-ciemny-ekran1.png  |  Bin 0 -> 73878 bytes
 .../arkusz-ostatnie-godziny-390-jasny-ekran1.png   |  Bin 0 -> 73145 bytes
 ...arkusz-ostatnie-godziny-390-jasny-en-ekran1.png |  Bin 0 -> 70305 bytes
 .../runda-1/blad-urzadzenie-390-ciemny-ekran1.png  |  Bin 0 -> 76051 bytes
 .../runda-1/blad-urzadzenie-390-jasny-ekran1.png   |  Bin 0 -> 75621 bytes
 .../blad-urzadzenie-390-jasny-en-ekran1.png        |  Bin 0 -> 71304 bytes
 .../blad-wykorzystany-1280-ciemny-ekran1.png       |  Bin 0 -> 152965 bytes
 .../blad-wykorzystany-1280-jasny-ekran1.png        |  Bin 0 -> 152522 bytes
 .../blad-wykorzystany-360-ciemny-ekran1.png        |  Bin 0 -> 53879 bytes
 .../runda-1/blad-wykorzystany-360-jasny-ekran1.png |  Bin 0 -> 53285 bytes
 .../blad-wykorzystany-390-ciemny-ekran1.png        |  Bin 0 -> 77977 bytes
 .../runda-1/blad-wykorzystany-390-jasny-ekran1.png |  Bin 0 -> 77570 bytes
 .../blad-wykorzystany-390-jasny-en-ekran1.png      |  Bin 0 -> 73685 bytes
 .../runda-1/dzis-darmowe-360-ciemny-ekran1.png     |  Bin 0 -> 67881 bytes
 .../etap-2/runda-1/dzis-darmowe-360-ciemny.png     |  Bin 0 -> 244730 bytes
 .../runda-1/dzis-darmowe-360-jasny-ekran1.png      |  Bin 0 -> 67554 bytes
 .../etap-2/runda-1/dzis-darmowe-360-jasny.png      |  Bin 0 -> 242727 bytes
 .../runda-1/dzis-darmowe-390-ciemny-ekran1.png     |  Bin 0 -> 90288 bytes
 .../etap-2/runda-1/dzis-darmowe-390-ciemny.png     |  Bin 0 -> 246670 bytes
 .../runda-1/dzis-darmowe-390-jasny-ekran1.png      |  Bin 0 -> 89778 bytes
 .../runda-1/dzis-darmowe-390-jasny-en-ekran1.png   |  Bin 0 -> 89653 bytes
 .../etap-2/runda-1/dzis-darmowe-390-jasny-en.png   |  Bin 0 -> 235288 bytes
 .../etap-2/runda-1/dzis-darmowe-390-jasny.png      |  Bin 0 -> 241277 bytes
 ...-darmowe-bez-bloku-lekcji-390-ciemny-ekran1.png |  Bin 0 -> 87909 bytes
 .../dzis-darmowe-bez-bloku-lekcji-390-ciemny.png   |  Bin 0 -> 195160 bytes
 ...s-darmowe-bez-bloku-lekcji-390-jasny-ekran1.png |  Bin 0 -> 85461 bytes
 .../dzis-darmowe-bez-bloku-lekcji-390-jasny.png    |  Bin 0 -> 198542 bytes
 .../dzis-proba-dzien2-1280-ciemny-ekran1.png       |  Bin 0 -> 159557 bytes
 .../runda-1/dzis-proba-dzien2-1280-ciemny.png      |  Bin 0 -> 380348 bytes
 .../dzis-proba-dzien2-1280-jasny-ekran1.png        |  Bin 0 -> 162618 bytes
 .../runda-1/dzis-proba-dzien2-1280-jasny.png       |  Bin 0 -> 380864 bytes
 .../dzis-proba-dzien2-360-ciemny-ekran1.png        |  Bin 0 -> 69213 bytes
 .../runda-1/dzis-proba-dzien2-360-ciemny.png       |  Bin 0 -> 297653 bytes
 .../runda-1/dzis-proba-dzien2-360-jasny-ekran1.png |  Bin 0 -> 68676 bytes
 .../etap-2/runda-1/dzis-proba-dzien2-360-jasny.png |  Bin 0 -> 296859 bytes
 .../dzis-proba-dzien2-390-ciemny-ekran1.png        |  Bin 0 -> 91475 bytes
 .../runda-1/dzis-proba-dzien2-390-ciemny.png       |  Bin 0 -> 299348 bytes
 .../runda-1/dzis-proba-dzien2-390-jasny-ekran1.png |  Bin 0 -> 91609 bytes
 .../dzis-proba-dzien2-390-jasny-en-ekran1.png      |  Bin 0 -> 91630 bytes
 .../runda-1/dzis-proba-dzien2-390-jasny-en.png     |  Bin 0 -> 294746 bytes
 .../etap-2/runda-1/dzis-proba-dzien2-390-jasny.png |  Bin 0 -> 298491 bytes
 .../dzis-proba-koniec-1280-ciemny-ekran1.png       |  Bin 0 -> 145177 bytes
 .../runda-1/dzis-proba-koniec-1280-ciemny.png      |  Bin 0 -> 297652 bytes
 .../dzis-proba-koniec-1280-jasny-ekran1.png        |  Bin 0 -> 148140 bytes
 .../runda-1/dzis-proba-koniec-1280-jasny.png       |  Bin 0 -> 297719 bytes
 .../dzis-proba-koniec-360-ciemny-ekran1.png        |  Bin 0 -> 68091 bytes
 .../runda-1/dzis-proba-koniec-360-ciemny.png       |  Bin 0 -> 233485 bytes
 .../runda-1/dzis-proba-koniec-360-jasny-ekran1.png |  Bin 0 -> 68104 bytes
 .../etap-2/runda-1/dzis-proba-koniec-360-jasny.png |  Bin 0 -> 232539 bytes
 .../dzis-proba-koniec-390-ciemny-ekran1.png        |  Bin 0 -> 91602 bytes
 .../runda-1/dzis-proba-koniec-390-ciemny.png       |  Bin 0 -> 236640 bytes
 .../runda-1/dzis-proba-koniec-390-jasny-ekran1.png |  Bin 0 -> 93459 bytes
 .../dzis-proba-koniec-390-jasny-en-ekran1.png      |  Bin 0 -> 92936 bytes
 .../runda-1/dzis-proba-koniec-390-jasny-en.png     |  Bin 0 -> 227031 bytes
 .../etap-2/runda-1/dzis-proba-koniec-390-jasny.png |  Bin 0 -> 233561 bytes
 ...a-koniec-bez-bloku-lekcji-390-ciemny-ekran1.png |  Bin 0 -> 85480 bytes
 ...is-proba-koniec-bez-bloku-lekcji-390-ciemny.png |  Bin 0 -> 182744 bytes
 ...ba-koniec-bez-bloku-lekcji-390-jasny-ekran1.png |  Bin 0 -> 83045 bytes
 ...zis-proba-koniec-bez-bloku-lekcji-390-jasny.png |  Bin 0 -> 186255 bytes
 ...is-proba-ostatnie-godziny-360-ciemny-ekran1.png |  Bin 0 -> 69226 bytes
 ...zis-proba-ostatnie-godziny-360-jasny-ekran1.png |  Bin 0 -> 68750 bytes
 ...is-proba-ostatnie-godziny-390-ciemny-ekran1.png |  Bin 0 -> 91818 bytes
 ...zis-proba-ostatnie-godziny-390-jasny-ekran1.png |  Bin 0 -> 91334 bytes
 docs/audyt-ux/petla-1/etap-2/runda-1/kontrola.md   |  290 +++
 .../logowanie-kierunki-1280-ciemny-ekran1.png      |  Bin 0 -> 200881 bytes
 .../runda-1/logowanie-kierunki-1280-ciemny.png     |  Bin 0 -> 211107 bytes
 .../logowanie-kierunki-1280-jasny-ekran1.png       |  Bin 0 -> 198811 bytes
 .../runda-1/logowanie-kierunki-1280-jasny.png      |  Bin 0 -> 209657 bytes
 .../logowanie-kierunki-390-ciemny-ekran1.png       |  Bin 0 -> 93438 bytes
 .../runda-1/logowanie-kierunki-390-ciemny.png      |  Bin 0 -> 219391 bytes
 .../logowanie-kierunki-390-jasny-ekran1.png        |  Bin 0 -> 95667 bytes
 .../logowanie-kierunki-390-jasny-en-ekran1.png     |  Bin 0 -> 93541 bytes
 .../runda-1/logowanie-kierunki-390-jasny-en.png    |  Bin 0 -> 207385 bytes
 .../runda-1/logowanie-kierunki-390-jasny.png       |  Bin 0 -> 220616 bytes
 .../etap-2/runda-1/przejscie-blad-proby-plan-1.png |  Bin 0 -> 89945 bytes
 .../etap-2/runda-1/przejscie-blad-proby-plan-2.png |  Bin 0 -> 77578 bytes
 .../etap-2/runda-1/przejscie-blad-proby-plan-3.png |  Bin 0 -> 80759 bytes
 .../runda-1/przejscie-kierunek-wkrotce-1.png       |  Bin 0 -> 95599 bytes
 .../runda-1/przejscie-kierunek-wkrotce-2.png       |  Bin 0 -> 80397 bytes
 .../runda-1/przejscie-proba-koniec-kup-1.png       |  Bin 0 -> 93626 bytes
 .../runda-1/przejscie-proba-koniec-kup-2.png       |  Bin 0 -> 72744 bytes
 .../runda-1/przejscie-proba-ostatni-dzien-1.png    |  Bin 0 -> 73068 bytes
 .../runda-1/przejscie-proba-ostatni-dzien-2.png    |  Bin 0 -> 87806 bytes
 .../runda-1/przejscie-proba-ostatni-dzien-3.png    |  Bin 0 -> 91264 bytes
 docs/audyt-ux/petla-1/etap-2/runda-1/raport.json   | 2164 ++++++++++++++++++++
 docs/audyt-ux/petla-1/etap-2/runda-1/raport.md     |  291 +++
 docs/audyt-ux/petla-1/etap-2/runda-1/test.log      |  102 +
 .../ustawienia-konto-proba-1280-ciemny-ekran1.png  |  Bin 0 -> 102675 bytes
 .../ustawienia-konto-proba-1280-jasny-ekran1.png   |  Bin 0 -> 101230 bytes
 .../ustawienia-konto-proba-390-ciemny-ekran1.png   |  Bin 0 -> 73971 bytes
 .../ustawienia-konto-proba-390-jasny-ekran1.png    |  Bin 0 -> 72615 bytes
 .../ustawienia-konto-proba-390-jasny-en-ekran1.png |  Bin 0 -> 69875 bytes
 .../arkusz-ostatnie-godziny-1280-ciemny-ekran1.png |  Bin 0 -> 173174 bytes
 .../arkusz-ostatnie-godziny-1280-jasny-ekran1.png  |  Bin 0 -> 173212 bytes
 .../arkusz-ostatnie-godziny-360-ciemny-ekran1.png  |  Bin 0 -> 49294 bytes
 .../arkusz-ostatnie-godziny-360-jasny-ekran1.png   |  Bin 0 -> 49353 bytes
 .../arkusz-ostatnie-godziny-390-ciemny-ekran1.png  |  Bin 0 -> 64570 bytes
 .../arkusz-ostatnie-godziny-390-jasny-ekran1.png   |  Bin 0 -> 63854 bytes
 ...arkusz-ostatnie-godziny-390-jasny-en-ekran1.png |  Bin 0 -> 64290 bytes
 .../runda-2/blad-urzadzenie-390-ciemny-ekran1.png  |  Bin 0 -> 80185 bytes
 .../runda-2/blad-urzadzenie-390-jasny-ekran1.png   |  Bin 0 -> 80518 bytes
 .../blad-urzadzenie-390-jasny-en-ekran1.png        |  Bin 0 -> 76664 bytes
 .../blad-wykorzystany-1280-ciemny-ekran1.png       |  Bin 0 -> 158631 bytes
 .../blad-wykorzystany-1280-jasny-ekran1.png        |  Bin 0 -> 158577 bytes
 .../blad-wykorzystany-360-ciemny-ekran1.png        |  Bin 0 -> 56299 bytes
 .../runda-2/blad-wykorzystany-360-jasny-ekran1.png |  Bin 0 -> 55732 bytes
 .../blad-wykorzystany-390-ciemny-ekran1.png        |  Bin 0 -> 81939 bytes
 .../runda-2/blad-wykorzystany-390-jasny-ekran1.png |  Bin 0 -> 82481 bytes
 .../blad-wykorzystany-390-jasny-en-ekran1.png      |  Bin 0 -> 78925 bytes
 .../runda-2/dzis-darmowe-360-ciemny-ekran1.png     |  Bin 0 -> 67783 bytes
 .../etap-2/runda-2/dzis-darmowe-360-ciemny.png     |  Bin 0 -> 241909 bytes
 .../runda-2/dzis-darmowe-360-jasny-ekran1.png      |  Bin 0 -> 67554 bytes
 .../etap-2/runda-2/dzis-darmowe-360-jasny.png      |  Bin 0 -> 240082 bytes
 .../runda-2/dzis-darmowe-390-ciemny-ekran1.png     |  Bin 0 -> 90205 bytes
 .../etap-2/runda-2/dzis-darmowe-390-ciemny.png     |  Bin 0 -> 243311 bytes
 .../runda-2/dzis-darmowe-390-jasny-ekran1.png      |  Bin 0 -> 89766 bytes
 .../runda-2/dzis-darmowe-390-jasny-en-ekran1.png   |  Bin 0 -> 89743 bytes
 .../etap-2/runda-2/dzis-darmowe-390-jasny-en.png   |  Bin 0 -> 232791 bytes
 .../etap-2/runda-2/dzis-darmowe-390-jasny.png      |  Bin 0 -> 238924 bytes
 ...-darmowe-bez-bloku-lekcji-390-ciemny-ekran1.png |  Bin 0 -> 85899 bytes
 .../dzis-darmowe-bez-bloku-lekcji-390-ciemny.png   |  Bin 0 -> 193381 bytes
 ...s-darmowe-bez-bloku-lekcji-390-jasny-ekran1.png |  Bin 0 -> 83415 bytes
 .../dzis-darmowe-bez-bloku-lekcji-390-jasny.png    |  Bin 0 -> 196648 bytes
 .../dzis-proba-dzien2-1280-ciemny-ekran1.png       |  Bin 0 -> 159386 bytes
 .../runda-2/dzis-proba-dzien2-1280-ciemny.png      |  Bin 0 -> 378928 bytes
 .../dzis-proba-dzien2-1280-jasny-ekran1.png        |  Bin 0 -> 162285 bytes
 .../runda-2/dzis-proba-dzien2-1280-jasny.png       |  Bin 0 -> 380438 bytes
 .../dzis-proba-dzien2-360-ciemny-ekran1.png        |  Bin 0 -> 69287 bytes
 .../runda-2/dzis-proba-dzien2-360-ciemny.png       |  Bin 0 -> 297621 bytes
 .../runda-2/dzis-proba-dzien2-360-jasny-ekran1.png |  Bin 0 -> 69113 bytes
 .../etap-2/runda-2/dzis-proba-dzien2-360-jasny.png |  Bin 0 -> 297781 bytes
 .../dzis-proba-dzien2-390-ciemny-ekran1.png        |  Bin 0 -> 91938 bytes
 .../runda-2/dzis-proba-dzien2-390-ciemny.png       |  Bin 0 -> 300278 bytes
 .../runda-2/dzis-proba-dzien2-390-jasny-ekran1.png |  Bin 0 -> 91745 bytes
 .../dzis-proba-dzien2-390-jasny-en-ekran1.png      |  Bin 0 -> 91636 bytes
 .../runda-2/dzis-proba-dzien2-390-jasny-en.png     |  Bin 0 -> 295024 bytes
 .../etap-2/runda-2/dzis-proba-dzien2-390-jasny.png |  Bin 0 -> 298410 bytes
 .../dzis-proba-koniec-1280-ciemny-ekran1.png       |  Bin 0 -> 154092 bytes
 .../runda-2/dzis-proba-koniec-1280-ciemny.png      |  Bin 0 -> 308591 bytes
 .../dzis-proba-koniec-1280-jasny-ekran1.png        |  Bin 0 -> 157375 bytes
 .../runda-2/dzis-proba-koniec-1280-jasny.png       |  Bin 0 -> 308021 bytes
 .../dzis-proba-koniec-360-ciemny-ekran1.png        |  Bin 0 -> 71403 bytes
 .../runda-2/dzis-proba-koniec-360-ciemny.png       |  Bin 0 -> 243528 bytes
 .../runda-2/dzis-proba-koniec-360-jasny-ekran1.png |  Bin 0 -> 70949 bytes
 .../etap-2/runda-2/dzis-proba-koniec-360-jasny.png |  Bin 0 -> 240901 bytes
 .../dzis-proba-koniec-390-ciemny-ekran1.png        |  Bin 0 -> 93698 bytes
 .../runda-2/dzis-proba-koniec-390-ciemny.png       |  Bin 0 -> 245436 bytes
 .../runda-2/dzis-proba-koniec-390-jasny-ekran1.png |  Bin 0 -> 93270 bytes
 .../dzis-proba-koniec-390-jasny-en-ekran1.png      |  Bin 0 -> 92892 bytes
 .../runda-2/dzis-proba-koniec-390-jasny-en.png     |  Bin 0 -> 234214 bytes
 .../etap-2/runda-2/dzis-proba-koniec-390-jasny.png |  Bin 0 -> 240704 bytes
 ...a-koniec-bez-bloku-lekcji-390-ciemny-ekran1.png |  Bin 0 -> 87644 bytes
 ...is-proba-koniec-bez-bloku-lekcji-390-ciemny.png |  Bin 0 -> 195011 bytes
 ...ba-koniec-bez-bloku-lekcji-390-jasny-ekran1.png |  Bin 0 -> 85260 bytes
 ...zis-proba-koniec-bez-bloku-lekcji-390-jasny.png |  Bin 0 -> 198060 bytes
 ...is-proba-ostatnie-godziny-360-ciemny-ekran1.png |  Bin 0 -> 70878 bytes
 ...zis-proba-ostatnie-godziny-360-jasny-ekran1.png |  Bin 0 -> 70510 bytes
 ...is-proba-ostatnie-godziny-390-ciemny-ekran1.png |  Bin 0 -> 93900 bytes
 ...zis-proba-ostatnie-godziny-390-jasny-ekran1.png |  Bin 0 -> 93323 bytes
 docs/audyt-ux/petla-1/etap-2/runda-2/kontrola.md   |  387 ++++
 .../logowanie-kierunki-1280-ciemny-ekran1.png      |  Bin 0 -> 203415 bytes
 .../runda-2/logowanie-kierunki-1280-ciemny.png     |  Bin 0 -> 214169 bytes
 .../logowanie-kierunki-1280-jasny-ekran1.png       |  Bin 0 -> 203234 bytes
 .../runda-2/logowanie-kierunki-1280-jasny.png      |  Bin 0 -> 213924 bytes
 .../logowanie-kierunki-390-ciemny-ekran1.png       |  Bin 0 -> 96905 bytes
 .../runda-2/logowanie-kierunki-390-ciemny.png      |  Bin 0 -> 222881 bytes
 .../logowanie-kierunki-390-jasny-ekran1.png        |  Bin 0 -> 99111 bytes
 .../logowanie-kierunki-390-jasny-en-ekran1.png     |  Bin 0 -> 96252 bytes
 .../runda-2/logowanie-kierunki-390-jasny-en.png    |  Bin 0 -> 210076 bytes
 .../runda-2/logowanie-kierunki-390-jasny.png       |  Bin 0 -> 224051 bytes
 .../etap-2/runda-2/przejscie-blad-proby-plan-1.png |  Bin 0 -> 89930 bytes
 .../etap-2/runda-2/przejscie-blad-proby-plan-2.png |  Bin 0 -> 82310 bytes
 .../etap-2/runda-2/przejscie-blad-proby-plan-3.png |  Bin 0 -> 80759 bytes
 .../runda-2/przejscie-kierunek-wkrotce-1.png       |  Bin 0 -> 99205 bytes
 .../runda-2/przejscie-kierunek-wkrotce-2.png       |  Bin 0 -> 80216 bytes
 .../runda-2/przejscie-proba-koniec-kup-1.png       |  Bin 0 -> 93217 bytes
 .../runda-2/przejscie-proba-koniec-kup-2.png       |  Bin 0 -> 80759 bytes
 .../runda-2/przejscie-proba-ostatni-dzien-1.png    |  Bin 0 -> 63854 bytes
 .../runda-2/przejscie-proba-ostatni-dzien-2.png    |  Bin 0 -> 89492 bytes
 .../runda-2/przejscie-proba-ostatni-dzien-3.png    |  Bin 0 -> 94573 bytes
 docs/audyt-ux/petla-1/etap-2/runda-2/raport.json   | 2164 ++++++++++++++++++++
 docs/audyt-ux/petla-1/etap-2/runda-2/raport.md     |  290 +++
 docs/audyt-ux/petla-1/etap-2/runda-2/test.log      |  103 +
 .../ustawienia-konto-proba-1280-ciemny-ekran1.png  |  Bin 0 -> 102675 bytes
 .../ustawienia-konto-proba-1280-jasny-ekran1.png   |  Bin 0 -> 101230 bytes
 .../ustawienia-konto-proba-390-ciemny-ekran1.png   |  Bin 0 -> 73971 bytes
 .../ustawienia-konto-proba-390-jasny-ekran1.png    |  Bin 0 -> 72607 bytes
 .../ustawienia-konto-proba-390-jasny-en-ekran1.png |  Bin 0 -> 69875 bytes
 .../runda-1/dzis-po-probie-1280-ciemny-ekran1.png  |  Bin 0 -> 154060 bytes
 .../etap-3/runda-1/dzis-po-probie-1280-ciemny.png  |  Bin 0 -> 309213 bytes
 .../runda-1/dzis-po-probie-1280-jasny-ekran1.png   |  Bin 0 -> 157164 bytes
 .../etap-3/runda-1/dzis-po-probie-1280-jasny.png   |  Bin 0 -> 307871 bytes
 .../runda-1/dzis-po-probie-360-ciemny-ekran1.png   |  Bin 0 -> 71127 bytes
 .../etap-3/runda-1/dzis-po-probie-360-ciemny.png   |  Bin 0 -> 243315 bytes
 .../runda-1/dzis-po-probie-360-jasny-ekran1.png    |  Bin 0 -> 70870 bytes
 .../etap-3/runda-1/dzis-po-probie-360-jasny.png    |  Bin 0 -> 241139 bytes
 .../runda-1/dzis-po-probie-390-ciemny-ekran1.png   |  Bin 0 -> 94240 bytes
 .../etap-3/runda-1/dzis-po-probie-390-ciemny.png   |  Bin 0 -> 245538 bytes
 .../runda-1/dzis-po-probie-390-jasny-ekran1.png    |  Bin 0 -> 93984 bytes
 .../runda-1/dzis-po-probie-390-jasny-en-ekran1.png |  Bin 0 -> 92901 bytes
 .../etap-3/runda-1/dzis-po-probie-390-jasny-en.png |  Bin 0 -> 233675 bytes
 .../etap-3/runda-1/dzis-po-probie-390-jasny.png    |  Bin 0 -> 240941 bytes
 .../runda-1/koniec-proby-1280-ciemny-ekran1.png    |  Bin 0 -> 174278 bytes
 .../runda-1/koniec-proby-1280-jasny-ekran1.png     |  Bin 0 -> 174124 bytes
 .../runda-1/koniec-proby-360-ciemny-ekran1.png     |  Bin 0 -> 47465 bytes
 .../runda-1/koniec-proby-360-jasny-ekran1.png      |  Bin 0 -> 47426 bytes
 .../runda-1/koniec-proby-390-ciemny-ekran1.png     |  Bin 0 -> 65493 bytes
 .../runda-1/koniec-proby-390-jasny-ekran1.png      |  Bin 0 -> 65658 bytes
 .../runda-1/koniec-proby-390-jasny-en-ekran1.png   |  Bin 0 -> 63546 bytes
 .../koniec-proby-zero-390-ciemny-ekran1.png        |  Bin 0 -> 71712 bytes
 .../runda-1/koniec-proby-zero-390-jasny-ekran1.png |  Bin 0 -> 70833 bytes
 .../koniec-proby-zero-390-jasny-en-ekran1.png      |  Bin 0 -> 70548 bytes
 docs/audyt-ux/petla-1/etap-3/runda-1/kontrola.md   |  484 +++++
 .../runda-1/plan-z-maila-390-ciemny-ekran1.png     |  Bin 0 -> 82149 bytes
 .../runda-1/plan-z-maila-390-jasny-ekran1.png      |  Bin 0 -> 81775 bytes
 .../runda-1/powitanie-proby-1280-ciemny-ekran1.png |  Bin 0 -> 199513 bytes
 .../runda-1/powitanie-proby-1280-jasny-ekran1.png  |  Bin 0 -> 198001 bytes
 .../runda-1/powitanie-proby-360-ciemny-ekran1.png  |  Bin 0 -> 59790 bytes
 .../runda-1/powitanie-proby-360-jasny-ekran1.png   |  Bin 0 -> 58350 bytes
 .../runda-1/powitanie-proby-390-ciemny-ekran1.png  |  Bin 0 -> 77650 bytes
 .../runda-1/powitanie-proby-390-jasny-ekran1.png   |  Bin 0 -> 77006 bytes
 .../powitanie-proby-390-jasny-en-ekran1.png        |  Bin 0 -> 76497 bytes
 .../etap-3/runda-1/przejscie-koniec-proby-1.png    |  Bin 0 -> 65658 bytes
 .../etap-3/runda-1/przejscie-koniec-proby-2.png    |  Bin 0 -> 95242 bytes
 .../etap-3/runda-1/przejscie-koniec-proby-3.png    |  Bin 0 -> 94683 bytes
 .../etap-3/runda-1/przejscie-koniec-proby-4.png    |  Bin 0 -> 80787 bytes
 .../runda-1/przejscie-koniec-proby-plan-1.png      |  Bin 0 -> 65658 bytes
 .../runda-1/przejscie-koniec-proby-plan-2.png      |  Bin 0 -> 90071 bytes
 .../przejscie-start-proby-przypomnienie-1.png      |  Bin 0 -> 75485 bytes
 .../przejscie-start-proby-przypomnienie-2.png      |  Bin 0 -> 77327 bytes
 docs/audyt-ux/petla-1/etap-3/runda-1/raport.json   | 1005 +++++++++
 docs/audyt-ux/petla-1/etap-3/runda-1/raport.md     |  116 ++
 docs/audyt-ux/petla-1/etap-3/runda-1/test.log      |   72 +
 docs/audyt-ux/petla-1/kontrola.mjs                 |  114 ++
 docs/audyt-ux/petla-1/pomiary.mjs                  |  125 ++
 docs/audyt-ux/petla-1/recenzja/etap-1.md           |  167 ++
 docs/audyt-ux/petla-1/recenzja/etap-2.md           |  162 ++
 docs/audyt-ux/petla-1/recenzja/etap-3.md           |  185 ++
 docs/audyt-ux/petla-1/scenariusze-1.mjs            |   52 +
 docs/audyt-ux/petla-1/scenariusze-2.mjs            |   46 +
 docs/audyt-ux/petla-1/scenariusze-3.mjs            |   38 +
 docs/audyt-ux/petla-1/uwagi-dla-innych.md          |   10 +
 docs/audyt-ux/petla-3/PROGRESS.md                  |   39 -
 docs/audyt-ux/petla-3/RAPORT.md                    |   84 -
 .../petla-3/etap-1/runda-1/1280-ciemny-dobra.png   |  Bin 145003 -> 0 bytes
 .../petla-3/etap-1/runda-1/1280-ciemny-zla.png     |  Bin 159292 -> 0 bytes
 .../petla-3/etap-1/runda-1/1280-jasny-zla.png      |  Bin 157088 -> 0 bytes
 .../petla-3/etap-1/runda-1/360-calm-dobra.png      |  Bin 76640 -> 0 bytes
 .../petla-3/etap-1/runda-1/360-calm-zla.png        |  Bin 71666 -> 0 bytes
 .../petla-3/etap-1/runda-1/360-ciemny-dobra.png    |  Bin 70793 -> 0 bytes
 .../petla-3/etap-1/runda-1/360-ciemny-zla.png      |  Bin 72615 -> 0 bytes
 .../audyt-ux/petla-3/etap-1/runda-1/360-en-zla.png |  Bin 71015 -> 0 bytes
 .../petla-3/etap-1/runda-1/360-jasny-dobra.png     |  Bin 70445 -> 0 bytes
 .../petla-3/etap-1/runda-1/360-jasny-zla.png       |  Bin 71736 -> 0 bytes
 .../petla-3/etap-1/runda-1/360-reduced-dobra.png   |  Bin 76640 -> 0 bytes
 .../petla-3/etap-1/runda-1/360-reduced-zla.png     |  Bin 71666 -> 0 bytes
 .../petla-3/etap-1/runda-1/375-jasny-zla.png       |  Bin 94932 -> 0 bytes
 .../petla-3/etap-1/runda-1/390-ciemny-powtorki.png |  Bin 67649 -> 0 bytes
 .../petla-3/etap-1/runda-1/390-ciemny-zla.png      |  Bin 107169 -> 0 bytes
 .../audyt-ux/petla-3/etap-1/runda-1/390-en-zla.png |  Bin 104425 -> 0 bytes
 .../petla-3/etap-1/runda-1/390-jasny-powtorki.png  |  Bin 66651 -> 0 bytes
 .../petla-3/etap-1/runda-1/390-jasny-zla.png       |  Bin 105147 -> 0 bytes
 .../petla-3/etap-1/runda-1/390-noc-zla.png         |  Bin 105147 -> 0 bytes
 .../petla-3/etap-1/runda-1/390-pink-zla.png        |  Bin 105147 -> 0 bytes
 docs/audyt-ux/petla-3/etap-1/runda-1/pomiary.md    |   22 -
 docs/audyt-ux/petla-3/etap-1/runda-1/raport.json   |  386 ----
 docs/audyt-ux/petla-3/etap-1/runda-1/raport.md     |  182 --
 docs/audyt-ux/petla-3/etap-1/runda-1/recenzja.json |    1 -
 .../audyt-ux/petla-3/etap-1/runda-1/test-etapu.log |   76 -
 .../petla-3/etap-2/runda-1/1280-ciemny-combo3.png  |  Bin 122720 -> 0 bytes
 .../petla-3/etap-2/runda-1/1280-jasny-zla-stas.png |  Bin 161716 -> 0 bytes
 .../petla-3/etap-2/runda-1/360-calm-combo3.png     |  Bin 60340 -> 0 bytes
 .../petla-3/etap-2/runda-1/360-calm-combo5.png     |  Bin 53387 -> 0 bytes
 .../petla-3/etap-2/runda-1/360-calm-stas-zla.png   |  Bin 64645 -> 0 bytes
 .../petla-3/etap-2/runda-1/360-ciemny-combo3.png   |  Bin 61210 -> 0 bytes
 .../petla-3/etap-2/runda-1/360-ciemny-combo5.png   |  Bin 53340 -> 0 bytes
 .../etap-2/runda-1/360-ciemny-pytanie-dzwieki.png  |  Bin 48619 -> 0 bytes
 .../petla-3/etap-2/runda-1/360-ciemny-stas-zla.png |  Bin 66308 -> 0 bytes
 .../petla-3/etap-2/runda-1/360-ciemny-zla-stas.png |  Bin 66234 -> 0 bytes
 .../petla-3/etap-2/runda-1/360-jasny-combo3.png    |  Bin 59653 -> 0 bytes
 .../petla-3/etap-2/runda-1/360-jasny-combo5.png    |  Bin 54174 -> 0 bytes
 .../etap-2/runda-1/360-jasny-pytanie-dzwieki.png   |  Bin 47464 -> 0 bytes
 .../petla-3/etap-2/runda-1/360-jasny-stas-zla.png  |  Bin 65464 -> 0 bytes
 .../petla-3/etap-2/runda-1/360-jasny-zla-stas.png  |  Bin 65303 -> 0 bytes
 .../petla-3/etap-2/runda-1/360-pytanie-dzwieki.png |  Bin 53929 -> 0 bytes
 .../petla-3/etap-2/runda-1/360-reduced-combo3.png  |  Bin 60340 -> 0 bytes
 .../petla-3/etap-2/runda-1/360-reduced-combo5.png  |  Bin 53387 -> 0 bytes
 .../etap-2/runda-1/360-reduced-stas-zla.png        |  Bin 64645 -> 0 bytes
 .../etap-2/runda-1/390-ciemny-ustawienia.png       |  Bin 72364 -> 0 bytes
 .../petla-3/etap-2/runda-1/390-en-stas.png         |  Bin 68418 -> 0 bytes
 .../petla-3/etap-2/runda-1/390-en-ustawienia.png   |  Bin 69170 -> 0 bytes
 .../petla-3/etap-2/runda-1/390-en-zla-stas.png     |  Bin 95038 -> 0 bytes
 .../petla-3/etap-2/runda-1/390-jasny-combo3.png    |  Bin 90609 -> 0 bytes
 .../etap-2/runda-1/390-jasny-ustawienia.png        |  Bin 70807 -> 0 bytes
 .../petla-3/etap-2/runda-1/390-noc-combo3.png      |  Bin 96917 -> 0 bytes
 .../petla-3/etap-2/runda-1/390-pink-zla.png        |  Bin 113947 -> 0 bytes
 .../petla-3/etap-2/runda-1/390-ustawienia.png      |  Bin 70925 -> 0 bytes
 docs/audyt-ux/petla-3/etap-2/runda-1/pomiary.md    |   23 -
 docs/audyt-ux/petla-3/etap-2/runda-1/raport.json   |  498 -----
 docs/audyt-ux/petla-3/etap-2/runda-1/raport.md     |  214 --
 docs/audyt-ux/petla-3/etap-2/runda-1/recenzja.json |    1 -
 .../audyt-ux/petla-3/etap-2/runda-1/test-etapu.log |   62 -
 .../petla-3/etap-3/runda-1/1280-ciemny-grade4.png  |  Bin 35684 -> 0 bytes
 .../petla-3/etap-3/runda-1/1280-jasny-pewnosc.png  |  Bin 54171 -> 0 bytes
 .../etap-3/runda-1/360-abcd-blad-czesc2.png        |  Bin 68684 -> 0 bytes
 .../etap-3/runda-1/360-abcd-druga-szansa.png       |  Bin 67422 -> 0 bytes
 .../petla-3/etap-3/runda-1/360-bank-zle.png        |  Bin 57835 -> 0 bytes
 docs/audyt-ux/petla-3/etap-3/runda-1/360-bank.png  |  Bin 56775 -> 0 bytes
 .../petla-3/etap-3/runda-1/360-bilet-pewnosc.png   |  Bin 44894 -> 0 bytes
 .../petla-3/etap-3/runda-1/360-calm-bank.png       |  Bin 41202 -> 0 bytes
 .../petla-3/etap-3/runda-1/360-ciemny-bank.png     |  Bin 42730 -> 0 bytes
 .../petla-3/etap-3/runda-1/360-ciemny-grade4.png   |  Bin 28271 -> 0 bytes
 .../petla-3/etap-3/runda-1/360-ciemny-pewnosc.png  |  Bin 46403 -> 0 bytes
 .../etap-3/runda-1/360-ciemny-zaznaczona.png       |  Bin 57741 -> 0 bytes
 .../audyt-ux/petla-3/etap-3/runda-1/360-grade4.png |  Bin 27864 -> 0 bytes
 .../petla-3/etap-3/runda-1/360-jasny-bank.png      |  Bin 42034 -> 0 bytes
 .../360-jasny-blad-druga-szansa-pozniej.png        |  Bin 55179 -> 0 bytes
 .../petla-3/etap-3/runda-1/360-jasny-grade4.png    |  Bin 27864 -> 0 bytes
 .../petla-3/etap-3/runda-1/360-jasny-pewnosc.png   |  Bin 44900 -> 0 bytes
 .../petla-3/etap-3/runda-1/360-jasny-swipe.png     |  Bin 26031 -> 0 bytes
 .../etap-3/runda-1/360-jasny-zaznaczona.png        |  Bin 56274 -> 0 bytes
 .../etap-3/runda-1/360-luka-blad-czesc2.png        |  Bin 56696 -> 0 bytes
 .../etap-3/runda-1/360-luka-druga-szansa.png       |  Bin 52167 -> 0 bytes
 .../etap-3/runda-1/360-recall-samoocena.png        |  Bin 43881 -> 0 bytes
 .../petla-3/etap-3/runda-1/360-reduced-pewnosc.png |  Bin 42769 -> 0 bytes
 docs/audyt-ux/petla-3/etap-3/runda-1/360-swipe.png |  Bin 26375 -> 0 bytes
 .../petla-3/etap-3/runda-1/360-zaznaczona.png      |  Bin 56574 -> 0 bytes
 .../petla-3/etap-3/runda-1/390-en-grade4.png       |  Bin 27623 -> 0 bytes
 .../petla-3/etap-3/runda-1/390-en-pewnosc.png      |  Bin 47404 -> 0 bytes
 .../audyt-ux/petla-3/etap-3/runda-1/390-grade4.png |  Bin 28953 -> 0 bytes
 .../petla-3/etap-3/runda-1/390-jasny-grade4.png    |  Bin 28953 -> 0 bytes
 .../petla-3/etap-3/runda-1/390-noc-grade4.png      |  Bin 23416 -> 0 bytes
 .../petla-3/etap-3/runda-1/390-pink-pewnosc.png    |  Bin 56030 -> 0 bytes
 docs/audyt-ux/petla-3/etap-3/runda-1/390-swipe.png |  Bin 28897 -> 0 bytes
 docs/audyt-ux/petla-3/etap-3/runda-1/pomiary.md    |   25 -
 docs/audyt-ux/petla-3/etap-3/runda-1/raport.json   |  602 ------
 docs/audyt-ux/petla-3/etap-3/runda-1/raport.md     |  259 ---
 docs/audyt-ux/petla-3/etap-3/runda-1/recenzja.json |    1 -
 .../audyt-ux/petla-3/etap-3/runda-1/test-etapu.log |   51 -
 .../petla-3/etap-4/runda-1/1280-ciemny-czytaj.png  |  Bin 43103 -> 0 bytes
 .../petla-3/etap-4/runda-1/1280-czytaj.png         |  Bin 42409 -> 0 bytes
 .../petla-3/etap-4/runda-1/1280-jasny-czytaj.png   |  Bin 42494 -> 0 bytes
 .../petla-3/etap-4/runda-1/360-calm-dzis.png       |  Bin 24641 -> 0 bytes
 .../petla-3/etap-4/runda-1/360-ciemny-czytaj.png   |  Bin 30926 -> 0 bytes
 .../etap-4/runda-1/360-ciemny-dzis-pomin.png       |  Bin 26707 -> 0 bytes
 .../audyt-ux/petla-3/etap-4/runda-1/360-czytaj.png |  Bin 29942 -> 0 bytes
 .../petla-3/etap-4/runda-1/360-fiszki-pasek.png    |  Bin 26098 -> 0 bytes
 docs/audyt-ux/petla-3/etap-4/runda-1/360-ikony.png |  Bin 35565 -> 0 bytes
 .../petla-3/etap-4/runda-1/360-jasny-combo3.png    |  Bin 59018 -> 0 bytes
 .../petla-3/etap-4/runda-1/360-jasny-czytaj.png    |  Bin 30110 -> 0 bytes
 .../etap-4/runda-1/360-jasny-dzis-pomin.png        |  Bin 26317 -> 0 bytes
 .../petla-3/etap-4/runda-1/360-jasny-fiszki.png    |  Bin 20312 -> 0 bytes
 .../petla-3/etap-4/runda-1/360-pasek-combo.png     |  Bin 61537 -> 0 bytes
 docs/audyt-ux/petla-3/etap-4/runda-1/360-pasek.png |  Bin 79345 -> 0 bytes
 docs/audyt-ux/petla-3/etap-4/runda-1/360-pomin.png |  Bin 26145 -> 0 bytes
 .../petla-3/etap-4/runda-1/360-pominieto.png       |  Bin 42314 -> 0 bytes
 .../petla-3/etap-4/runda-1/360-reduced-czytaj.png  |  Bin 28920 -> 0 bytes
 .../petla-3/etap-4/runda-1/390-ciemny-czytaj.png   |  Bin 33240 -> 0 bytes
 .../audyt-ux/petla-3/etap-4/runda-1/390-czytaj.png |  Bin 32242 -> 0 bytes
 .../petla-3/etap-4/runda-1/390-en-czytaj.png       |  Bin 31783 -> 0 bytes
 .../petla-3/etap-4/runda-1/390-en-dzis.png         |  Bin 27492 -> 0 bytes
 .../petla-3/etap-4/runda-1/390-jasny-czytaj.png    |  Bin 32403 -> 0 bytes
 .../etap-4/runda-1/390-jasny-pominieto-cofnij.png  |  Bin 39113 -> 0 bytes
 .../petla-3/etap-4/runda-1/390-noc-pytanie.png     |  Bin 93045 -> 0 bytes
 .../petla-3/etap-4/runda-1/390-pink-czytaj.png     |  Bin 38121 -> 0 bytes
 .../petla-3/etap-4/runda-1/390-pink-pytanie.png    |  Bin 85538 -> 0 bytes
 docs/audyt-ux/petla-3/etap-4/runda-1/390-pomin.png |  Bin 27779 -> 0 bytes
 .../petla-3/etap-4/runda-1/390-pominieto.png       |  Bin 44259 -> 0 bytes
 docs/audyt-ux/petla-3/etap-4/runda-1/pomiary.md    |   22 -
 docs/audyt-ux/petla-3/etap-4/runda-1/raport.json   |  617 ------
 docs/audyt-ux/petla-3/etap-4/runda-1/raport.md     |  297 ---
 docs/audyt-ux/petla-3/etap-4/runda-1/recenzja.json |    1 -
 .../audyt-ux/petla-3/etap-4/runda-1/test-etapu.log |   51 -
 .../etap-5/runda-1/1280-ciemny-dzis-koniec-zle.png |  Bin 56186 -> 0 bytes
 .../etap-5/runda-1/1280-jasny-koniec-lekcji.png    |  Bin 87351 -> 0 bytes
 .../etap-5/runda-1/360-calm-dzis-koniec.png        |  Bin 27307 -> 0 bytes
 .../etap-5/runda-1/360-ciemny-karta-przejscia.png  |  Bin 18488 -> 0 bytes
 .../etap-5/runda-1/360-jasny-dzis-koniec-zle.png   |  Bin 47802 -> 0 bytes
 .../etap-5/runda-1/360-jasny-koniec-niezdany.png   |  Bin 48766 -> 0 bytes
 .../petla-3/etap-5/runda-1/360-koniec-niezdany.png |  Bin 48770 -> 0 bytes
 .../etap-5/runda-1/360-reduced-koniec-lekcji.png   |  Bin 49404 -> 0 bytes
 .../petla-3/etap-5/runda-1/390-awans-na-finale.png |  Bin 69712 -> 0 bytes
 .../runda-1/390-ciemny-dzis-koniec-dobrze.png      |  Bin 31046 -> 0 bytes
 .../etap-5/runda-1/390-ciemny-koniec-lekcji.png    |  Bin 71575 -> 0 bytes
 .../runda-1/390-dzis-koniec-bez-nawyku-zle.png     |  Bin 49870 -> 0 bytes
 .../runda-1/390-dzis-koniec-ciemny-dobrze.png      |  Bin 40109 -> 0 bytes
 .../runda-1/390-dzis-koniec-nawyk-dobrze.png       |  Bin 53730 -> 0 bytes
 .../etap-5/runda-1/390-dzis-koniec-nawyk-zle.png   |  Bin 61832 -> 0 bytes
 .../petla-3/etap-5/runda-1/390-en-dzis-koniec.png  |  Bin 45535 -> 0 bytes
 .../etap-5/runda-1/390-en-koniec-lekcji.png        |  Bin 67186 -> 0 bytes
 .../etap-5/runda-1/390-jasny-dzis-koniec-zle.png   |  Bin 49829 -> 0 bytes
 .../etap-5/runda-1/390-jasny-karta-przejscia.png   |  Bin 19370 -> 0 bytes
 .../etap-5/runda-1/390-jasny-koniec-lekcji.png     |  Bin 68689 -> 0 bytes
 .../petla-3/etap-5/runda-1/390-karta-przejscia.png |  Bin 38090 -> 0 bytes
 .../etap-5/runda-1/390-koniec-2-gwiazdki.png       |  Bin 74046 -> 0 bytes
 .../petla-3/etap-5/runda-1/390-koniec-lekcji.png   |  Bin 70029 -> 0 bytes
 .../etap-5/runda-1/390-noc-karta-przejscia.png     |  Bin 31275 -> 0 bytes
 .../etap-5/runda-1/390-pink-koniec-lekcji.png      |  Bin 81048 -> 0 bytes
 docs/audyt-ux/petla-3/etap-5/runda-1/pomiary.md    |   22 -
 docs/audyt-ux/petla-3/etap-5/runda-1/raport.json   |  762 -------
 docs/audyt-ux/petla-3/etap-5/runda-1/raport.md     |  342 ----
 docs/audyt-ux/petla-3/etap-5/runda-1/recenzja.json |    1 -
 .../audyt-ux/petla-3/etap-5/runda-1/test-etapu.log |   59 -
 .../etap-5/runda-2/1280-ciemny-dzis-koniec-zle.png |  Bin 59685 -> 0 bytes
 .../etap-5/runda-2/1280-jasny-koniec-lekcji.png    |  Bin 79206 -> 0 bytes
 .../etap-5/runda-2/360-calm-dzis-koniec.png        |  Bin 32695 -> 0 bytes
 .../etap-5/runda-2/360-ciemny-karta-przejscia.png  |  Bin 18488 -> 0 bytes
 .../etap-5/runda-2/360-jasny-dzis-koniec-zle.png   |  Bin 51001 -> 0 bytes
 .../etap-5/runda-2/360-jasny-koniec-niezdany.png   |  Bin 49552 -> 0 bytes
 .../petla-3/etap-5/runda-2/360-koniec-niezdany.png |  Bin 49558 -> 0 bytes
 .../etap-5/runda-2/360-reduced-koniec-lekcji.png   |  Bin 49453 -> 0 bytes
 .../petla-3/etap-5/runda-2/390-awans-na-finale.png |  Bin 64391 -> 0 bytes
 .../runda-2/390-ciemny-dzis-koniec-dobrze.png      |  Bin 36210 -> 0 bytes
 .../etap-5/runda-2/390-ciemny-koniec-lekcji.png    |  Bin 68211 -> 0 bytes
 .../runda-2/390-dzis-koniec-bez-nawyku-zle.png     |  Bin 53122 -> 0 bytes
 .../runda-2/390-dzis-koniec-ciemny-dobrze.png      |  Bin 45398 -> 0 bytes
 .../runda-2/390-dzis-koniec-nawyk-dobrze.png       |  Bin 56835 -> 0 bytes
 .../etap-5/runda-2/390-dzis-koniec-nawyk-zle.png   |  Bin 63121 -> 0 bytes
 .../petla-3/etap-5/runda-2/390-en-dzis-koniec.png  |  Bin 48744 -> 0 bytes
 .../etap-5/runda-2/390-en-koniec-lekcji.png        |  Bin 63972 -> 0 bytes
 .../etap-5/runda-2/390-jasny-dzis-koniec-zle.png   |  Bin 53083 -> 0 bytes
 .../etap-5/runda-2/390-jasny-karta-przejscia.png   |  Bin 19370 -> 0 bytes
 .../etap-5/runda-2/390-jasny-koniec-lekcji.png     |  Bin 66572 -> 0 bytes
 .../etap-5/runda-2/390-karta-czesc2-1z2.png        |  Bin 19955 -> 0 bytes
 .../petla-3/etap-5/runda-2/390-karta-przejscia.png |  Bin 38309 -> 0 bytes
 .../etap-5/runda-2/390-koniec-2-gwiazdki.png       |  Bin 70359 -> 0 bytes
 .../petla-3/etap-5/runda-2/390-koniec-lekcji.png   |  Bin 69312 -> 0 bytes
 .../etap-5/runda-2/390-noc-karta-przejscia.png     |  Bin 31275 -> 0 bytes
 .../etap-5/runda-2/390-pink-koniec-lekcji.png      |  Bin 72993 -> 0 bytes
 .../petla-3/etap-5/runda-2/390-powtorki-koniec.png |  Bin 64332 -> 0 bytes
 docs/audyt-ux/petla-3/etap-5/runda-2/pomiary.md    |   22 -
 docs/audyt-ux/petla-3/etap-5/runda-2/raport.json   |  678 ------
 docs/audyt-ux/petla-3/etap-5/runda-2/raport.md     |  387 ----
 docs/audyt-ux/petla-3/etap-5/runda-2/recenzja.json |    1 -
 .../audyt-ux/petla-3/etap-5/runda-2/test-etapu.log |   67 -
 docs/audyt-ux/petla-3/kontrola.mjs                 |  110 -
 docs/audyt-ux/petla-3/pomiar.mjs                   |  164 --
 docs/audyt-ux/petla-3/przed-po.mjs                 |   43 -
 .../przed-po/po-1280-ciemny-koniec-karty-5min.png  |  Bin 50651 -> 0 bytes
 .../przed-po/po-1280-ciemny-zla-odpowiedz.png      |  Bin 163905 -> 0 bytes
 .../przed-po/po-1280-jasny-koniec-karty-5min.png   |  Bin 50089 -> 0 bytes
 .../przed-po/po-1280-jasny-zla-odpowiedz.png       |  Bin 161791 -> 0 bytes
 .../przed-po/po-390-ciemny-koniec-karty-5min.png   |  Bin 42038 -> 0 bytes
 .../przed-po/po-390-ciemny-zla-odpowiedz.png       |  Bin 98534 -> 0 bytes
 .../przed-po/po-390-jasny-koniec-karty-5min.png    |  Bin 40374 -> 0 bytes
 .../przed-po/po-390-jasny-zla-odpowiedz.png        |  Bin 96743 -> 0 bytes
 .../przed-1280-ciemny-koniec-karty-5min.png        |  Bin 78035 -> 0 bytes
 .../przed-po/przed-1280-ciemny-zla-odpowiedz.png   |  Bin 115143 -> 0 bytes
 .../przed-1280-jasny-koniec-karty-5min.png         |  Bin 76456 -> 0 bytes
 .../przed-po/przed-1280-jasny-zla-odpowiedz.png    |  Bin 113894 -> 0 bytes
 .../przed-390-ciemny-koniec-karty-5min.png         |  Bin 66611 -> 0 bytes
 .../przed-po/przed-390-ciemny-zla-odpowiedz.png    |  Bin 88122 -> 0 bytes
 .../przed-po/przed-390-jasny-koniec-karty-5min.png |  Bin 64829 -> 0 bytes
 .../przed-po/przed-390-jasny-zla-odpowiedz.png     |  Bin 86880 -> 0 bytes
 docs/audyt-ux/petla-3/raport.mjs                   |   24 -
 docs/audyt-ux/petla-3/uwagi-dla-innych.md          |    9 -
 docs/gry/test/atrapa-supabase.js                   |   15 +-
 docs/gry/test/h2-etap4.mjs                         |   21 +-
 docs/gry/test/h2-etap9.mjs                         |    3 +-
 docs/gry/test/lekcje-v4.mjs                        |   28 +-
 docs/gry/test/poziomy.mjs                          |    2 -
 docs/gry/test/rewanze.mjs                          |    4 +-
 docs/gry/test/scalanie.mjs                         |   15 +-
 docs/gry/test/sprawdzian.mjs                       |    9 +-
 docs/gry/test/ux1-etap1.mjs                        |  190 ++
 docs/gry/test/ux1-etap2.mjs                        |  179 ++
 docs/gry/test/ux1-etap3.mjs                        |  132 ++
 docs/gry/test/ux3-etap1.mjs                        |  101 -
 docs/gry/test/ux3-etap2.mjs                        |  138 --
 docs/gry/test/ux3-etap3.mjs                        |  187 --
 docs/gry/test/ux3-etap4.mjs                        |  135 --
 docs/gry/test/ux3-etap5.mjs                        |  186 --
 docs/gry/test/ux3-lib.mjs                          |  111 -
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
 i18n-en.js                                         |  172 +-
 index.html                                         |  417 ++--
 kosmetyki.js                                       |    4 -
 lekcja-ux.js                                       |  370 ----
 przypomnienia.js                                   |   37 +-
 skrot-supabase.js                                  |  158 +-
 supabase/functions/przypomnienia/logika.js         |   37 +-
 supabase/functions/przypomnienia/obsluga.ts        |   38 +-
 supabase/skrot-v52-proba-rocznik.sql               |   54 +
 supabase/skrot-v53-proba-przypomnienie.sql         |   71 +
 supabase/skrot-v54-odzyskiwanie.sql                |  108 +
 supabase/test/pglite.mjs                           |    2 +-
 supabase/test/v52.sql                              |   54 +
 supabase/test/v53.sql                              |   60 +
 supabase/test/v54.sql                              |   99 +
 tests/ux1-proba-mail.test.js                       |   96 +
 ux-wejscie.css                                     |  263 +++
 ux-wejscie.js                                      |  306 +++
 679 files changed, 15047 insertions(+), 7863 deletions(-)
nowy (niedodany): docs/audyt-ux/petla-1/etap-4/
nowy (niedodany): docs/audyt-ux/petla-1/recenzja/etap-4.md
nowy (niedodany): docs/audyt-ux/petla-1/scenariusze-4.mjs
nowy (niedodany): docs/gry/test/ux1-etap4.mjs
```

## Zmienione funkcje (porównanie z listą B3)

### index.html

- ✓ `(linia 1: #login)` (linie 1)
- ✗ POZA LISTĄ `(CSS)` (linie 19, 21, 35, 49, 5120)
- ✓ `(CSS szarego .btn na Dziś)` (linie 5117, 10409, 10439, 10564, 10576, 11244, 11253, 11659, 11668, 11670, 14709, 19964, 19972)
- ◦ umowa/most `(ładowanie własnego pliku)` (linie 5382, 22951)
- ◦ umowa/most `(linia <script src> – ?v=)` (linie 5394)
- ✓ `paywallCard` (linie 7702, 7711, 7715, 7718)
- ✓ `buyBanner` (linie 7749)
- ◦ umowa/most `(wywołanie z umowy)` (linie 7756, 8021, 11544, 11596, 13637, 18991, 19004, 20266)
- ✗ POZA LISTĄ `lpBuildDeck` (linie 10244, 10246)
- ✗ POZA LISTĄ `lpLoad` (linie 10300)
- ✗ POZA LISTĄ `lpCards` (linie 10316)
- ✗ POZA LISTĄ `lpRetryLater` (linie 10321)
- ✗ POZA LISTĄ `playerOpen` (linie 10408, 10418)
- ✗ POZA LISTĄ `lpBuild` (linie 10560, 10566, 10568)
- ✗ POZA LISTĄ `lpAward` (linie 10621, 10625)
- ✗ POZA LISTĄ `lpFloat` (linie 10634)
- ✗ POZA LISTĄ `lpBuzz` (linie 10638)
- ✗ POZA LISTĄ `xpFlush` (linie 10656)
- ✗ POZA LISTĄ `lpKeys` (linie 10769, 10771)
- ✗ POZA LISTĄ `kick` (linie 10790)
- ✗ POZA LISTĄ `LPR` (linie 10826, 10830, 10834, 10839, 10856, 10859, 10861, 10864, 10871, 10875, 10899, 10959, 11081, 11089, 11093, 11106, 11110, 11114, 11148, 11155)
- ✗ POZA LISTĄ `lpBiteDone` (linie 11218, 11223, 11226, 11236, 11239)
- ✗ POZA LISTĄ `goTo` (linie 11242, 11249, 11251, 11255, 11259, 11265, 11267, 11270)
- ✗ POZA LISTĄ `lpBeforeAfter` (linie 11277)
- ✗ POZA LISTĄ `lpFinishLesson` (linie 11319)
- ✗ POZA LISTĄ `setKonto` (linie 14719)
- ✗ POZA LISTĄ `kSound` (linie 16772)
- ✗ POZA LISTĄ `segOf` (linie 19907, 19910, 19969)
- ◦ umowa/most `(blok mostu)` (linie 22946)

### skrot-supabase.js

- ✗ POZA LISTĄ `rocznikiBaza` (linie 230)
- ✗ POZA LISTĄ `rocznikStatus` (linie 242)
- ✗ POZA LISTĄ `trialCan` (linie 264)
- ✗ POZA LISTĄ `trialDays` (linie 267)
- ✓ `otpErr` (linie 996)
- ✓ `codeStep` (linie 1042, 1056, 1069, 1090, 1095)
- ✓ `passStep` (linie 1104, 1121, 1135, 1138, 1140, 1147)
- ✓ `modeSwitch` (linie 1151)
- ✓ `emailStep` (linie 1156, 1170, 1180, 1185, 1187, 1196, 1203)
- ✗ POZA LISTĄ `portal` (linie 1324)
- ✓ `manage` (linie 1330)
- ✗ POZA LISTĄ `listaOczekujacych` (linie 1360)
- ✗ POZA LISTĄ `sync` (linie 1402)
- ✗ POZA LISTĄ `KOD_ERR` (linie 1416, 1448)
- ◦ umowa/most `(wywołanie z umowy)` (linie 1474, 1559)
- ✗ POZA LISTĄ `card` (linie 1481)
- ◦ umowa/most `(ładowanie własnego pliku)` (linie 1516)
- ✓ `TRIAL_ERR` (linie 1545)
- ✓ `afterReady` (linie 1584, 1625)

## Emoji w dodanych liniach kodu

- `+  ok("K3: funkcja przypomnienia: rodzaj „proba” przed innymi, w limit_dzien, tylko w dzień, dzień końca z kalendarza (tests/ux1-proba-mail.test.js + stare test`
- `+    if (warm.length) bites.push({ id: "warm", kind: "warm", title: "Rozgrzewka", icon: "🔥", cards: warm });`
- `+    for (const e of ex) { const src = base.find((x) => x.id === e.of); if (src) out.splice(Math.min(e.at, out.length), 0, { ...src, id: src.id + "#r" + (e.n > `
- `+    el.help = h("button", { type: "button", class: "btn lp-help", hidden: true, onclick: lpSheetOpen }, "🤔 Nie łapię");`
- `+    if (st.combo >= 3) { cb.hidden = false; cb.textContent = "🔥 x" + st.combo; lpBump(cb); if (opts.graded && opts.ok && (st.combo === 5 || st.combo === 10)) `
- `+    if (after.n > before.n) { if (LP.open) lpBanner(`🎉 Awans: poziom ${after.n} · ${after.name}`); whenFree(() => levelUpShow(before.n, after.n), LP.open ? 17`
- `+        h("p", { class: "v", text: ok ? ["Dobrze! 🎉", "Tak jest! ✅", "Brawo! 💚", "Trafione! 🎯"][card.id.length % 4] : later ? "Nie tym razem." : `Nie tym ra`
- `+        later ? h("p", { class: "lbl", text: "🔁 Masz drugą szansę: to pytanie wróci za chwilę, wtedy zobaczysz poprawną odpowiedź." }) : null,`
- `+      return { el: [kick(card.first ? "📖 " + (card.ldTitle || sec.title || "Czytaj") : "📖 Czytaj dalej", card), body], cta: more ? { label: `Pokaż kolejny pu`
- `+          h("button", { type: "button", class: "btn primary", onclick: (e) => { lpAward(lpXv("recall"), { at: e.currentTarget }); ctx.set(1); setTimeout(lpNext`
- `+        h("div", { class: "lp-two lp-opts" }, [[true, "✅ Prawda"], [false, "❌ Fałsz"]].map(([v, l]) => h("button", { type: "button", disabled: done ? true : nu`
- `+        checked ? h("div", { class: "lp-fb lp-new " + (a.ok ? "ok" : "no") }, h("p", { class: "v", text: a.ok ? "Idealna kolejność! 🎯" : "Prawie. Tak wygląda `
- `+        h("p", { class: "v", text: ok ? "Dobrze! ✅" : `Nie tym razem. Poprawna: ${"ABCD"[order.indexOf(card.correct)]}.` }),`
- `+        !ok && ctx.fx.back ? h("p", { class: "lbl", text: "🔁 To pytanie wróci jeszcze w tej sesji." }) : null) : null;`
- `+        h("p", { class: "v", text: a.ok ? "Dobrze! ✅" : `Nie tym razem. Wynik: ${V4.numFmt(g.result)}${g.unit ? " " + g.unit : ""}.` }),`
- `+        !a.ok && ctx.fx.back ? h("p", { class: "lbl", text: "🔁 Za chwilę to samo zadanie wróci z nowymi liczbami." }) : null) : null;`
- `+          h("button", { type: "button", class: "btn", onclick: () => { const id = LP.m.id; lpClose(true); go({ view: "material", id, tab: "fiszki" }); } }, "⚡ `
- `+        el.ldSkip = h("button", { type: "button", class: "lp-chip ld-skip", title: "Pomiń ten krok", "aria-label": "Pomiń ten krok", onclick: () => ldSkip() },`

## Skrót tablic quiz (przed → po)

- docs/gry/test/atrapa-supabase.js: 05e07dea5687 → 05e07dea5687 ✓
- pliki JSON w docs/: 21, wszystkie równe: tak ✓

## Nowe migracje

### supabase/skrot-v52-proba-rocznik.sql

```
(brak wyniku)
```

### supabase/skrot-v53-proba-przypomnienie.sql

```
(brak wyniku)
```

### supabase/skrot-v54-odzyskiwanie.sql

```
(brak wyniku)
```

## Nowe teksty PL bez pary EN (przybliżenie: literały z polskimi słowami w dodanych liniach)

- „{0} {0}”
- „{0} pełnego dostępu · potem {0} do końca 2. semestru albo {0}”
- „Warto powtórzyć: ”
- „Uwaga, pułapka! ”
- „Tak jest dobrze: ”
- „{0} · okres próbny, {0}”
- „Wysłaliśmy 6-cyfrowy kod na ”
- „Kod wysłaliśmy na ”
- „{0} zł”

(sprawdzonych literałów: 133; teksty złożone sprawdza test Playwright w trybie EN)
