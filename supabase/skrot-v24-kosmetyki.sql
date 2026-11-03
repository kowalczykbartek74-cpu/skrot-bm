-- Skrót BM v24: przedmioty kosmetyczne w sklepie za monetki (ramki, kolory nicku, tytuły, gablota odznak, skórki i tła gier,
-- wygląd fiszek, efekty quizu, dźwięki, kolor płomienia serii, zamrożenie serii, zestawy, kolekcja sezonowa).
-- Wklej w Supabase → SQL Editor → Run, PO v22 (numery v22/v23 zajmuje gałąź kierunków). Można uruchamiać wielokrotnie.
--
-- Zasady:
--   • Wszystko tu to wyłącznie wygląd. Nic nie zmienia punktów rankingu, XP ani wyników. Jedyny wyjątek to zamrożenie serii,
--     które chroni serię dni w przeglądarce (opuszczony jeden dzień) – nie tworzy wpisów w nauka_rp, więc nie daje punktów
--     rankingu (także bonusu „seria”), monet ani XP.
--   • Katalog i ceny są tylko tutaj (nauka_sklep_katalog). Przeglądarka nigdy nie podaje ceny.
--   • Zakup jest atomowy: blokada na osobę, sprawdzenie salda / poziomu / okna sezonu / posiadania, odjęcie monet i zapis
--     posiadania w jednej transakcji. Saldo nie zejdzie poniżej zera. Ten sam zakup nie wpadnie dwa razy (unikalny klucz
--     w księdze monet; zamrożenia mają klucz z identyfikatora żądania z przeglądarki).
--   • Zakładać można tylko to, co się posiada (sprawdza baza). Jeden założony przedmiot na slot.
--   • Poziom, odznaki i tytuły za osiągnięcia baza czyta z dokumentu postępu osoby (nauka_docs, kolekcja progress), tak jak
--     grupę w v13. XP liczy przeglądarka, więc to ta sama wiarygodność co poziom pokazywany na stronie.
--   • Dotychczasowe zakupy (motywy w nauka_posiadane) zostają bez zmian. Plik tylko dokłada tabele i funkcje.
--   • Daty sezonów: nauka_sezony() niżej. Kupione przedmioty sezonowe zostają na zawsze.

-- =====================================================================
-- 1) Ustawienia: sezony i limity
-- =====================================================================
-- Okna czasowe (daty po czasie warszawskim, obie włącznie). Żeby zmienić: popraw daty i uruchom plik ponownie.
create or replace function public.nauka_sezony() returns jsonb
language sql stable set search_path = '' as $$
  select '{
    "zima": {"od": "2026-11-03", "do": "2027-02-28", "pl": "Sesja zimowa", "en": "Winter exam session"}
  }'::jsonb
$$;

create or replace function public.nauka_kosm_cfg() returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'zamrozenia_max', 2,     -- najwięcej zamrożeń serii naraz
    'gablota_bazowo', 1,     -- miejsca w gablocie bez zakupów
    'sloty', jsonb_build_array('ramka','kolor','tytul','skorka','tlo','fiszki','efekt','dzwieki','plomien')
  )
$$;

-- =====================================================================
-- 2) Katalog (jedno miejsce na wszystkie przedmioty)
-- =====================================================================
-- Pola: id, kat (motywy|profil|gry|nauka|zestawy), slot (gdzie się zakłada; brak = nie zakłada się), pl, en, opis_pl, opis_en,
-- cena (monety; null = nie do kupienia), min_poziom (kupisz od poziomu X), tylko_za_poziom (odblokowuje się sam od poziomu X),
-- sezon (klucz z nauka_sezony()), wyglad (dane dla strony), czesci (zestaw), wymaga (najpierw kup tamto), max (ile naraz).
-- Motywy zostają jak w v21 (typ, theme, poziom = od którego poziomu za darmo – to sprawdza przeglądarka).
create or replace function public.nauka_sklep_katalog() returns jsonb
language sql immutable set search_path = '' as $$
  select '[
    {"id":"motyw:pink",   "kat":"motywy", "typ":"motyw", "theme":"pink",   "cena":150,  "poziom":3,  "pl":"Jednorożec", "en":"Unicorn"},
    {"id":"motyw:bow",    "kat":"motywy", "typ":"motyw", "theme":"bow",    "cena":350,  "poziom":5,  "pl":"Kokardka",   "en":"Bow"},
    {"id":"motyw:meadow", "kat":"motywy", "typ":"motyw", "theme":"meadow", "cena":350,  "poziom":5,  "pl":"Łąka",       "en":"Meadow"},
    {"id":"motyw:lilia",  "kat":"motywy", "typ":"motyw", "theme":"lilia",  "cena":600,  "poziom":7,  "pl":"Nenufary",   "en":"Water Lilies"},
    {"id":"motyw:sea",    "kat":"motywy", "typ":"motyw", "theme":"sea",    "cena":800,  "poziom":8,  "pl":"Nocny rejs", "en":"Night Sail"},
    {"id":"motyw:noc",    "kat":"motywy", "typ":"motyw", "theme":"noc",    "cena":1000, "poziom":10, "pl":"Nokturn",    "en":"Nocturne"},

    {"id":"ramka:liscie",  "kat":"profil", "slot":"ramka", "cena":200, "pl":"Liście", "en":"Leaves",
     "opis_pl":"Wianek z liści wokół awatara.", "opis_en":"A wreath of leaves around your avatar.", "wyglad":{"g":"liscie"}},
    {"id":"ramka:fale",    "kat":"profil", "slot":"ramka", "cena":200, "pl":"Fale", "en":"Waves",
     "opis_pl":"Spokojne fale wokół awatara.", "opis_en":"Calm waves around your avatar.", "wyglad":{"g":"fale"}},
    {"id":"ramka:klosy",   "kat":"profil", "slot":"ramka", "cena":200, "pl":"Kłosy", "en":"Wheat",
     "opis_pl":"Złote kłosy wokół awatara.", "opis_en":"Golden wheat ears around your avatar.", "wyglad":{"g":"klosy"}},
    {"id":"ramka:gwiazdy", "kat":"profil", "slot":"ramka", "cena":260, "pl":"Gwiazdy nad morzem", "en":"Stars over the Sea",
     "opis_pl":"Granatowa ramka z gwiazdami, pasuje do Nocnego rejsu.", "opis_en":"A navy frame with stars, matches Night Sail.", "wyglad":{"g":"gwiazdy"}},
    {"id":"ramka:zlota",   "kat":"profil", "slot":"ramka", "cena":null, "tylko_za_poziom":10, "pl":"Złota ramka", "en":"Golden Frame",
     "opis_pl":"Tylko dla rangi Mistrz (poziom 10). Nie da się jej kupić.", "opis_en":"Only for the Master rank (level 10). It can''t be bought.", "wyglad":{"g":"zlota"}},
    {"id":"ramka:szron",   "kat":"profil", "slot":"ramka", "cena":240, "sezon":"zima", "pl":"Szron", "en":"Frost",
     "opis_pl":"Szronione gałązki na czas sesji zimowej.", "opis_en":"Frosted twigs for the winter exam session.", "wyglad":{"g":"szron"}},

    {"id":"kolor:las",      "kat":"profil", "slot":"kolor", "cena":60, "pl":"Las", "en":"Forest",
     "opis_pl":"Głęboka zieleń nicku w rankingu.", "opis_en":"A deep green nickname in the ranking.", "wyglad":{"k":"las"}},
    {"id":"kolor:morze",    "kat":"profil", "slot":"kolor", "cena":60, "pl":"Morze", "en":"Sea",
     "opis_pl":"Morski turkus nicku w rankingu.", "opis_en":"A sea teal nickname in the ranking.", "wyglad":{"k":"morze"}},
    {"id":"kolor:oliwka",   "kat":"profil", "slot":"kolor", "cena":60, "pl":"Oliwka", "en":"Olive",
     "opis_pl":"Oliwkowa zieleń nicku w rankingu.", "opis_en":"An olive green nickname in the ranking.", "wyglad":{"k":"oliwka"}},
    {"id":"kolor:glebia",   "kat":"profil", "slot":"kolor", "cena":60, "pl":"Głębia", "en":"Deep Blue",
     "opis_pl":"Granat nocnego morza w rankingu.", "opis_en":"Night-sea navy in the ranking.", "wyglad":{"k":"glebia"}},
    {"id":"kolor:bursztyn", "kat":"profil", "slot":"kolor", "cena":60, "pl":"Bursztyn", "en":"Amber",
     "opis_pl":"Ciepły bursztyn nicku w rankingu.", "opis_en":"A warm amber nickname in the ranking.", "wyglad":{"k":"bursztyn"}},
    {"id":"kolor:wrzos",    "kat":"profil", "slot":"kolor", "cena":60, "pl":"Wrzos", "en":"Heather",
     "opis_pl":"Wrzosowy fiolet nicku w rankingu.", "opis_en":"A heather purple nickname in the ranking.", "wyglad":{"k":"wrzos"}},

    {"id":"tytul:nocny-marek",      "kat":"profil", "slot":"tytul", "cena":180, "pl":"Nocny Marek", "en":"Night Owl",
     "opis_pl":"Tytuł pod nickiem w rankingu.", "opis_en":"A title under your nickname in the ranking."},
    {"id":"tytul:fiszkowy-maniak",  "kat":"profil", "slot":"tytul", "cena":180, "pl":"Fiszkowy Maniak", "en":"Flashcard Fanatic",
     "opis_pl":"Tytuł pod nickiem w rankingu.", "opis_en":"A title under your nickname in the ranking."},
    {"id":"tytul:kawa-kolokwium",   "kat":"profil", "slot":"tytul", "cena":180, "pl":"Kawa i Kolokwium", "en":"Coffee and Quizzes",
     "opis_pl":"Tytuł pod nickiem w rankingu.", "opis_en":"A title under your nickname in the ranking."},
    {"id":"tytul:spokojny-sesja",   "kat":"profil", "slot":"tytul", "cena":180, "pl":"Spokojny Przed Sesją", "en":"Calm Before Exams",
     "opis_pl":"Tytuł pod nickiem w rankingu.", "opis_en":"A title under your nickname in the ranking."},
    {"id":"tytul:pogromca",         "kat":"profil", "slot":"tytul", "cena":null, "osiagniecie":"lekcje_przedmiotu", "pl":"Pogromca …", "en":"Conqueror of …",
     "opis_pl":"Za ukończenie wszystkich lekcji z przedmiotu. Nie da się go kupić.", "opis_en":"For finishing every lesson in a subject. It can''t be bought."},

    {"id":"gablota:2", "kat":"profil", "cena":600, "pl":"Gablota: 2. miejsce", "en":"Showcase: 2nd slot",
     "opis_pl":"Pokaż na profilu drugą zdobytą odznakę.", "opis_en":"Show a second earned badge on your profile."},
    {"id":"gablota:3", "kat":"profil", "cena":800, "wymaga":"gablota:2", "pl":"Gablota: 3. miejsce", "en":"Showcase: 3rd slot",
     "opis_pl":"Pokaż na profilu trzecią zdobytą odznakę.", "opis_en":"Show a third earned badge on your profile."},

    {"id":"skorka:owca",     "kat":"gry", "slot":"skorka", "cena":560, "pl":"Owca", "en":"Sheep",
     "opis_pl":"Puszysta owca we Fruń i Przejdź.", "opis_en":"A fluffy sheep in Fly and Cross.", "wyglad":{"s":"owca"}},
    {"id":"skorka:mewa",     "kat":"gry", "slot":"skorka", "cena":600, "pl":"Mewa", "en":"Seagull",
     "opis_pl":"Mewa we Fruń i Przejdź.", "opis_en":"A seagull in Fly and Cross.", "wyglad":{"s":"mewa"}},
    {"id":"skorka:zaglowka", "kat":"gry", "slot":"skorka", "cena":700, "pl":"Żaglówka", "en":"Sailboat",
     "opis_pl":"Mała żaglówka we Fruń i Przejdź.", "opis_en":"A little sailboat in Fly and Cross.", "wyglad":{"s":"zaglowka"}},
    {"id":"skorka:latarnia", "kat":"gry", "slot":"skorka", "cena":800, "min_poziom":8, "pl":"Latarnia", "en":"Lighthouse",
     "opis_pl":"Latarnia morska ze światłem. Od poziomu 8.", "opis_en":"A lighthouse with a beam. From level 8.", "wyglad":{"s":"latarnia"}},

    {"id":"tlo:dzien",     "kat":"gry", "slot":"tlo", "cena":160, "pl":"Dzień", "en":"Daytime",
     "opis_pl":"Jasna łąka w słońcu. Pasuje do motywu Łąka.", "opis_en":"A sunny meadow. Matches the Meadow theme.", "wyglad":{"t":"dzien"}},
    {"id":"tlo:zachod",    "kat":"gry", "slot":"tlo", "cena":220, "pl":"Zachód słońca", "en":"Sunset",
     "opis_pl":"Ciepłe niebo o zachodzie.", "opis_en":"A warm sunset sky.", "wyglad":{"t":"zachod"}},
    {"id":"tlo:noc-morze", "kat":"gry", "slot":"tlo", "cena":260, "pl":"Noc na morzu", "en":"Night at Sea",
     "opis_pl":"Granatowe morze i gwiazdy. Pasuje do Nocnego rejsu.", "opis_en":"A navy sea and stars. Matches Night Sail.", "wyglad":{"t":"noc-morze"}},
    {"id":"tlo:zima",      "kat":"gry", "slot":"tlo", "cena":240, "sezon":"zima", "pl":"Zimowy wieczór", "en":"Winter Evening",
     "opis_pl":"Śnieg i ciepłe okna na czas sesji.", "opis_en":"Snow and warm windows for exam season.", "wyglad":{"t":"zima"}},

    {"id":"fiszki:papier", "kat":"nauka", "slot":"fiszki", "cena":160, "pl":"Papier", "en":"Paper",
     "opis_pl":"Fiszki jak kartki z zeszytu w kratkę.", "opis_en":"Flashcards like squared notebook paper.", "wyglad":{"f":"papier"}},
    {"id":"fiszki:kreda",  "kat":"nauka", "slot":"fiszki", "cena":200, "pl":"Kreda", "en":"Chalk",
     "opis_pl":"Zielona tablica i jasna kreda.", "opis_en":"A green board and light chalk.", "wyglad":{"f":"kreda"}},
    {"id":"fiszki:nocny",  "kat":"nauka", "slot":"fiszki", "cena":200, "pl":"Nocny", "en":"Night",
     "opis_pl":"Ciemne fiszki, łagodne dla oczu wieczorem.", "opis_en":"Dark flashcards, easy on the eyes at night.", "wyglad":{"f":"nocny"}},

    {"id":"efekt:liscie", "kat":"nauka", "slot":"efekt", "cena":200, "pl":"Liście", "en":"Leaves",
     "opis_pl":"Po quizie spadają liście zamiast konfetti.", "opis_en":"Leaves fall after a quiz instead of confetti.", "wyglad":{"e":"liscie"}},
    {"id":"efekt:iskry",  "kat":"nauka", "slot":"efekt", "cena":200, "pl":"Iskry", "en":"Sparks",
     "opis_pl":"Po quizie rozbłyskują iskry.", "opis_en":"Sparks twinkle after a quiz.", "wyglad":{"e":"iskry"}},
    {"id":"efekt:fala",   "kat":"nauka", "slot":"efekt", "cena":220, "pl":"Fala", "en":"Wave",
     "opis_pl":"Po quizie przez ekran przechodzi fala.", "opis_en":"A wave rolls across the screen after a quiz.", "wyglad":{"e":"fala"}},
    {"id":"efekt:snieg",  "kat":"nauka", "slot":"efekt", "cena":240, "sezon":"zima", "pl":"Płatki śniegu", "en":"Snowflakes",
     "opis_pl":"Po quizie prószy śnieg.", "opis_en":"Snow falls after a quiz.", "wyglad":{"e":"snieg"}},

    {"id":"dzwieki:krople",   "kat":"nauka", "slot":"dzwieki", "cena":50, "pl":"Krople", "en":"Droplets",
     "opis_pl":"Cichy dźwięk kropli przy dobrej odpowiedzi.", "opis_en":"A soft droplet sound for a correct answer.", "wyglad":{"d":"krople"}},
    {"id":"dzwieki:dzwonki",  "kat":"nauka", "slot":"dzwieki", "cena":50, "pl":"Dzwoneczki", "en":"Chimes",
     "opis_pl":"Delikatny dzwoneczek przy dobrej odpowiedzi.", "opis_en":"A gentle chime for a correct answer.", "wyglad":{"d":"dzwonki"}},
    {"id":"dzwieki:drewno",   "kat":"nauka", "slot":"dzwieki", "cena":50, "pl":"Drewno", "en":"Wood",
     "opis_pl":"Ciepłe stuknięcie w drewno przy dobrej odpowiedzi.", "opis_en":"A warm wooden tap for a correct answer.", "wyglad":{"d":"drewno"}},

    {"id":"plomien:zielony",   "kat":"nauka", "slot":"plomien", "cena":50, "pl":"Zielony płomień", "en":"Green Flame",
     "opis_pl":"Zielony płomień serii dni.", "opis_en":"A green flame for your day streak.", "wyglad":{"p":"zielony"}},
    {"id":"plomien:niebieski", "kat":"nauka", "slot":"plomien", "cena":60, "pl":"Niebieski płomień", "en":"Blue Flame",
     "opis_pl":"Niebieski płomień serii dni.", "opis_en":"A blue flame for your day streak.", "wyglad":{"p":"niebieski"}},
    {"id":"plomien:zloty",     "kat":"nauka", "slot":"plomien", "cena":80, "pl":"Złoty płomień", "en":"Golden Flame",
     "opis_pl":"Złoty płomień serii dni.", "opis_en":"A golden flame for your day streak.", "wyglad":{"p":"zloty"}},

    {"id":"zamrozenie", "kat":"nauka", "cena":40, "max":2, "pl":"Zamrożenie serii", "en":"Streak Freeze",
     "opis_pl":"Chroni serię, gdy opuścisz jeden dzień. Działa samo. Najwyżej 2 naraz. Nie daje punktów ani XP.",
     "opis_en":"Protects your streak when you miss one day. Works by itself. Up to 2 at a time. Gives no points or XP."},

    {"id":"zestaw:laka",  "kat":"zestawy", "cena":700, "czesci":["ramka:liscie","tlo:dzien","skorka:owca"], "pl":"Zestaw Łąka", "en":"Meadow Set",
     "opis_pl":"Ramka Liście, tło Dzień i skórka Owca. Do motywu Łąka.", "opis_en":"Leaves frame, Daytime background and Sheep skin. For the Meadow theme."},
    {"id":"zestaw:morze", "kat":"zestawy", "cena":840, "czesci":["ramka:gwiazdy","tlo:noc-morze","skorka:zaglowka"], "pl":"Zestaw Nocne morze", "en":"Night Sea Set",
     "opis_pl":"Ramka Gwiazdy nad morzem, tło Noc na morzu i skórka Żaglówka. Do Nocnego rejsu.", "opis_en":"Stars over the Sea frame, Night at Sea background and Sailboat skin. For Night Sail."},
    {"id":"zestaw:zima",  "kat":"zestawy", "cena":560, "sezon":"zima", "czesci":["ramka:szron","tlo:zima","efekt:snieg"], "pl":"Zestaw Sesja zimowa", "en":"Winter Session Set",
     "opis_pl":"Ramka Szron, tło Zimowy wieczór i efekt Płatki śniegu.", "opis_en":"Frost frame, Winter Evening background and Snowflakes effect."}
  ]'::jsonb
$$;

create or replace function public.nauka_kat_item(p_id text) returns jsonb
language sql immutable set search_path = '' as $$
  select e from jsonb_array_elements(public.nauka_sklep_katalog()) e where e->>'id' = p_id
$$;

-- =====================================================================
-- 3) Tabele
-- =====================================================================
-- Założone przedmioty: jeden na slot.
create table if not exists public.nauka_zalozone (
  user_id    uuid not null,
  slot       text not null check (slot ~ '^[a-z]{2,12}$'),
  item       text not null check (char_length(item) between 1 and 80),
  updated_at timestamptz not null default now(),
  primary key (user_id, slot)
);

-- Gablota: odznaki wybrane do pokazania (kolejność = kolejność na profilu).
create table if not exists public.nauka_gablota (
  user_id    uuid primary key,
  odznaki    text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- Zamrożenia serii: jeden wiersz = jedno zamrożenie. uzyte_dzien = dzień, który chroni (null = jeszcze w zapasie).
create table if not exists public.nauka_zamrozenia (
  id          bigint generated always as identity primary key,
  user_id     uuid not null,
  req         text not null check (char_length(req) between 8 and 64),
  cena        int  not null check (cena >= 0),
  created_at  timestamptz not null default now(),
  uzyte_dzien date,
  uzyte_at    timestamptz,
  unique (user_id, req),
  unique (user_id, uzyte_dzien)
);
create index if not exists nauka_zamrozenia_user_idx on public.nauka_zamrozenia (user_id) where uzyte_dzien is null;

alter table public.nauka_zalozone   enable row level security;
alter table public.nauka_gablota    enable row level security;
alter table public.nauka_zamrozenia enable row level security;
revoke all on public.nauka_zalozone, public.nauka_gablota, public.nauka_zamrozenia from anon, authenticated;

-- =====================================================================
-- 4) Funkcje pomocnicze
-- =====================================================================
-- Dokument postępu osoby (XP, odznaki, tytuły za osiągnięcia zapisuje przeglądarka).
create or replace function public.nauka_postep(p_user uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce((select d.data from public.nauka_docs d where d.kolekcja = 'progress' and d.id = p_user::text), '{}'::jsonb)
$$;

-- Poziom z XP tym samym wzorem co strona: próg poziomu n = 50·n·(n−1).
create or replace function public.nauka_poziom_z_xp(p_xp numeric) returns int
language sql immutable set search_path = '' as $$
  select greatest(1, floor((1 + sqrt(1 + greatest(coalesce(p_xp, 0), 0) / 12.5)) / 2))::int
$$;

create or replace function public.nauka_poziom(p_user uuid) returns int
language sql stable security definer set search_path = '' as $$
  select public.nauka_poziom_z_xp(case when jsonb_typeof(p->'xp'->'t') = 'number' then (p->'xp'->>'t')::numeric else 0 end)
  from (select public.nauka_postep(p_user) p) x
$$;

-- Klucze obiektu z dokumentu postępu (np. odznaki, tytuly) – tylko krótkie, bezpieczne identyfikatory.
create or replace function public.nauka_postep_klucze(p jsonb, pole text) returns text[]
language sql immutable set search_path = '' as $$
  select coalesce(array_agg(k order by k), '{}') from jsonb_object_keys(
    case when jsonb_typeof(p->pole) = 'object' then p->pole else '{}'::jsonb end) k
  where k ~ '^[a-z0-9:_-]{1,60}$'
$$;

-- Czy sezon jest dziś otwarty (brak sezonu = zawsze).
create or replace function public.nauka_sezon_otwarty(p_sezon text) returns boolean
language sql stable set search_path = '' as $$
  select p_sezon is null or coalesce((
    select public.nauka_dzis() between (s->>'od')::date and (s->>'do')::date
      from (select public.nauka_sezony()->p_sezon s) x where s is not null), false)
$$;

-- Czy osoba ma przedmiot: kupiony (albo dany przez starostę), za poziom, za osiągnięcie, albo cały zestaw.
-- Tytuł za osiągnięcie ma id „tytul:pogromca:<przedmiot>” i liczy się, gdy jest w postęp.tytuly.
create or replace function public.nauka_ma(p_user uuid, p_item text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare it jsonb;
begin
  if p_item is null then return false; end if;
  if p_item ~ '^tytul:pogromca:[a-z0-9-]{1,50}$' then
    return p_item = any(public.nauka_postep_klucze(public.nauka_postep(p_user), 'tytuly'));
  end if;
  it := public.nauka_kat_item(p_item);
  if it is null then return false; end if;
  if exists (select 1 from public.nauka_posiadane where user_id = p_user and item = p_item) then return true; end if;
  if it ? 'tylko_za_poziom' then return public.nauka_poziom(p_user) >= (it->>'tylko_za_poziom')::int; end if;
  return false;
end $$;

-- Miejsca w gablocie.
create or replace function public.nauka_gablota_miejsca(p_user uuid) returns int
language sql stable security definer set search_path = '' as $$
  select (public.nauka_kosm_cfg()->>'gablota_bazowo')::int
       + (select count(*) from public.nauka_posiadane where user_id = p_user and item in ('gablota:2','gablota:3'))::int
$$;

-- Wygląd jednej osoby (do rankingu i profilu): tylko to, co nadal posiada, a w gablocie tylko zdobyte odznaki.
create or replace function public.nauka_wyglad_osoby(p_user uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare z jsonb; g text[]; p jsonb := public.nauka_postep(p_user); miejsca int := public.nauka_gablota_miejsca(p_user);
begin
  select coalesce(jsonb_object_agg(x.slot, x.item), '{}'::jsonb) into z
    from public.nauka_zalozone x where x.user_id = p_user and public.nauka_ma(p_user, x.item);
  select coalesce(array(select o from unnest(gb.odznaki) with ordinality t(o, i)
                         where o = any(public.nauka_postep_klucze(p, 'odznaki')) order by i limit miejsca), '{}')
    into g from public.nauka_gablota gb where gb.user_id = p_user;
  return jsonb_build_object('zalozone', z, 'gablota', to_jsonb(coalesce(g, '{}'::text[])),
                            'poziom', public.nauka_poziom_z_xp(case when jsonb_typeof(p->'xp'->'t') = 'number' then (p->'xp'->>'t')::numeric else 0 end));
end $$;

-- =====================================================================
-- 5) Funkcje dla strony
-- =====================================================================
-- Stan sklepu: wszystko z v22 + założone, poziom wg bazy, gablota, zamrożenia, sezony, zdobyte tytuły.
create or replace function public.nauka_sklep_stan() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare u uuid := auth.uid(); p jsonb;
begin
  if u is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  p := public.nauka_postep(u);
  return jsonb_build_object('ok', true,
    'saldo', public.nauka_saldo(u),
    'dzis_nauka', coalesce((select delta from public.nauka_monety where user_id = u and klucz = 'nauka:' || public.nauka_dzis()::text), 0),
    'dzis_pkt', coalesce((select sum(pkt) from public.nauka_rp where user_id = u and dzien = public.nauka_dzis()), 0)::int,
    'dzis_max', public.nauka_mon_dzis_max(),
    'kurs_pkt', (public.nauka_mon_cfg()->>'kurs_pkt')::int,
    'mozna', public.nauka_rp_mozna(),
    'posiadane', coalesce((select jsonb_agg(item order by created_at) from public.nauka_posiadane where user_id = u), '[]'::jsonb),
    'katalog', public.nauka_sklep_katalog(),
    'zarobione_lacznie', coalesce((select sum(delta) from public.nauka_monety where user_id = u and delta > 0), 0),
    'wydane_lacznie', coalesce((select -sum(delta) from public.nauka_monety where user_id = u and zrodlo = 'zakup'), 0),
    -- v24
    'dzis', public.nauka_dzis(),
    'teraz', now(),
    'poziom', public.nauka_poziom(u),
    'zalozone', coalesce((select jsonb_object_agg(slot, item) from public.nauka_zalozone where user_id = u and public.nauka_ma(u, item)), '{}'::jsonb),
    'tytuly', to_jsonb(public.nauka_postep_klucze(p, 'tytuly')),
    'gablota', jsonb_build_object('miejsca', public.nauka_gablota_miejsca(u),
                                  'odznaki', coalesce((select to_jsonb(odznaki) from public.nauka_gablota where user_id = u), '[]'::jsonb)),
    'zamrozenia', jsonb_build_object(
       'ma', (select count(*) from public.nauka_zamrozenia where user_id = u and uzyte_dzien is null),
       'max', (public.nauka_kosm_cfg()->>'zamrozenia_max')::int,
       'dni', coalesce((select jsonb_agg(uzyte_dzien order by uzyte_dzien) from public.nauka_zamrozenia
                         where user_id = u and uzyte_dzien is not null and uzyte_dzien >= public.nauka_dzis() - 400), '[]'::jsonb)),
    'sezony', public.nauka_sezony());
end $$;

-- Zakup. p_req: identyfikator żądania z przeglądarki (wymagany dla zamrożeń; ponowne wysłanie tego samego = bez drugiej opłaty).
-- Kody błędów: not_logged_in, no_item, not_for_sale, owned, level (brakuje poziomu), season (sezon zamknięty), needs (najpierw
-- kup inny przedmiot), max (limit zamrożeń), no_req, no_coins.
drop function if exists public.nauka_sklep_kup(text);
create or replace function public.nauka_sklep_kup(p_item text, p_req text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  u uuid := auth.uid();
  it jsonb; cena int; s int; lv int; minlv int; brak text[]; c text; n int;
begin
  if u is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  perform pg_advisory_xact_lock(hashtext('nauka_mon:' || u::text));
  it := public.nauka_kat_item(p_item);
  if it is null then return jsonb_build_object('ok', false, 'code', 'no_item'); end if;
  s := public.nauka_saldo(u);
  if it->'cena' is null or jsonb_typeof(it->'cena') <> 'number' then
    return jsonb_build_object('ok', false, 'code', 'not_for_sale', 'saldo', s);
  end if;
  if not public.nauka_sezon_otwarty(it->>'sezon') then
    return jsonb_build_object('ok', false, 'code', 'season', 'saldo', s);
  end if;
  if it ? 'wymaga' and not public.nauka_ma(u, it->>'wymaga') then
    return jsonb_build_object('ok', false, 'code', 'needs', 'wymaga', it->>'wymaga', 'saldo', s);
  end if;

  -- Zamrożenie serii: przedmiot „na sztuki”, najwyżej max w zapasie.
  if p_item = 'zamrozenie' then
    if p_req is null or p_req !~ '^[A-Za-z0-9-]{8,64}$' then return jsonb_build_object('ok', false, 'code', 'no_req'); end if;
    if exists (select 1 from public.nauka_zamrozenia where user_id = u and req = p_req) then
      return jsonb_build_object('ok', true, 'item', p_item, 'juz', true, 'saldo', s,
        'zamrozenia', (select count(*) from public.nauka_zamrozenia where user_id = u and uzyte_dzien is null));
    end if;
    if (select count(*) from public.nauka_zamrozenia where user_id = u and uzyte_dzien is null) >= (it->>'max')::int then
      return jsonb_build_object('ok', false, 'code', 'max', 'saldo', s);
    end if;
    cena := (it->>'cena')::int;
    if s < cena then return jsonb_build_object('ok', false, 'code', 'no_coins', 'brakuje', cena - s, 'saldo', s); end if;
    insert into public.nauka_zamrozenia (user_id, req, cena) values (u, p_req, cena);
    insert into public.nauka_monety (user_id, delta, zrodlo, klucz, opis)
    values (u, -cena, 'zakup', 'zakup:zamrozenie:' || p_req, 'Zakup: ' || (it->>'pl'));
    return jsonb_build_object('ok', true, 'item', p_item, 'cena', cena, 'saldo', s - cena,
      'zamrozenia', (select count(*) from public.nauka_zamrozenia where user_id = u and uzyte_dzien is null));
  end if;

  if exists (select 1 from public.nauka_posiadane where user_id = u and item = p_item) then
    return jsonb_build_object('ok', false, 'code', 'owned', 'saldo', s);
  end if;
  lv := public.nauka_poziom(u);

  if it ? 'czesci' then
    -- Zestaw: płacisz za brakujące części, nigdy więcej niż za nie osobno.
    select coalesce(array_agg(x order by o), '{}') into brak
      from jsonb_array_elements_text(it->'czesci') with ordinality t(x, o)
     where not exists (select 1 from public.nauka_posiadane p where p.user_id = u and p.item = x);
    if cardinality(brak) = 0 then return jsonb_build_object('ok', false, 'code', 'owned', 'saldo', s); end if;
    select coalesce(max((public.nauka_kat_item(x)->>'min_poziom')::int), 0),
           least((it->>'cena')::int, coalesce(sum((public.nauka_kat_item(x)->>'cena')::int), 0))
      into minlv, cena from unnest(brak) x;
    if lv < minlv then return jsonb_build_object('ok', false, 'code', 'level', 'poziom', minlv, 'saldo', s); end if;
    if s < cena then return jsonb_build_object('ok', false, 'code', 'no_coins', 'brakuje', cena - s, 'saldo', s); end if;
    insert into public.nauka_posiadane (user_id, item, cena) values (u, p_item, cena);
    foreach c in array brak loop
      insert into public.nauka_posiadane (user_id, item, cena, powod) values (u, c, 0, p_item) on conflict do nothing;
    end loop;
  else
    if it ? 'min_poziom' and lv < (it->>'min_poziom')::int then
      return jsonb_build_object('ok', false, 'code', 'level', 'poziom', (it->>'min_poziom')::int, 'saldo', s);
    end if;
    cena := (it->>'cena')::int;
    if s < cena then return jsonb_build_object('ok', false, 'code', 'no_coins', 'brakuje', cena - s, 'saldo', s); end if;
    insert into public.nauka_posiadane (user_id, item, cena) values (u, p_item, cena);
  end if;

  if cena > 0 then
    insert into public.nauka_monety (user_id, delta, zrodlo, klucz, opis)
    values (u, -cena, 'zakup', 'zakup:' || p_item, 'Zakup: ' || (it->>'pl'))
    on conflict (user_id, klucz) do nothing;
    get diagnostics n = row_count;
    if n = 0 then raise exception 'nauka_sklep_kup: podwójny wpis zakupu %', p_item; end if;   -- cofa całą transakcję
  end if;
  return jsonb_build_object('ok', true, 'item', p_item, 'cena', cena, 'saldo', s - cena,
    'czesci', case when it ? 'czesci' then to_jsonb(brak) end);
end $$;

-- Zakładanie i zdejmowanie (p_item null = zdejmij). Kody: bad_slot, no_item, wrong_slot, not_owned.
create or replace function public.nauka_sklep_zaloz(p_slot text, p_item text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); it jsonb;
begin
  if u is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  if p_slot is null or not (public.nauka_kosm_cfg()->'sloty') ? p_slot then
    return jsonb_build_object('ok', false, 'code', 'bad_slot');
  end if;
  if p_item is null then
    delete from public.nauka_zalozone where user_id = u and slot = p_slot;
    return jsonb_build_object('ok', true, 'slot', p_slot, 'item', null);
  end if;
  if p_item ~ '^tytul:pogromca:' then it := public.nauka_kat_item('tytul:pogromca');
  else it := public.nauka_kat_item(p_item); end if;
  if it is null then return jsonb_build_object('ok', false, 'code', 'no_item'); end if;
  if it->>'slot' is distinct from p_slot then return jsonb_build_object('ok', false, 'code', 'wrong_slot'); end if;
  if not public.nauka_ma(u, p_item) then return jsonb_build_object('ok', false, 'code', 'not_owned'); end if;
  insert into public.nauka_zalozone (user_id, slot, item) values (u, p_slot, p_item)
  on conflict (user_id, slot) do update set item = excluded.item, updated_at = now();
  return jsonb_build_object('ok', true, 'slot', p_slot, 'item', p_item);
end $$;

-- Gablota: które zdobyte odznaki pokazać. Kody: too_many, not_earned.
create or replace function public.nauka_gablota_ustaw(p_odznaki text[]) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); m int; zdob text[]; o text; lista text[] := '{}';
begin
  if u is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  m := public.nauka_gablota_miejsca(u);
  zdob := public.nauka_postep_klucze(public.nauka_postep(u), 'odznaki');
  foreach o in array coalesce(p_odznaki, '{}') loop
    if not o = any(lista) then lista := lista || o; end if;     -- bez powtórzeń, kolejność zostaje
  end loop;
  if cardinality(lista) > m then return jsonb_build_object('ok', false, 'code', 'too_many', 'miejsca', m); end if;
  if exists (select 1 from unnest(lista) x where not x = any(zdob)) then
    return jsonb_build_object('ok', false, 'code', 'not_earned');
  end if;
  insert into public.nauka_gablota (user_id, odznaki) values (u, lista)
  on conflict (user_id) do update set odznaki = excluded.odznaki, updated_at = now();
  return jsonb_build_object('ok', true, 'odznaki', to_jsonb(lista), 'miejsca', m);
end $$;

-- Zamrożenie serii: przeglądarka woła to sama przy pierwszej nauce dnia, gdy wczoraj nie było nauki, a przedwczoraj była.
-- Chroni WCZORAJ (dzień po czasie warszawskim). Nie dodaje punktów, monet ani XP.
-- Kody: none (brak zamrożeń), not_missed (wczoraj są punkty, nic do chronienia). Drugi raz ten sam dzień = ok, juz.
create or replace function public.nauka_zamrozenie_uzyj() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); d date := public.nauka_dzis() - 1; zid bigint;
begin
  if u is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  perform pg_advisory_xact_lock(hashtext('nauka_mon:' || u::text));
  if exists (select 1 from public.nauka_zamrozenia where user_id = u and uzyte_dzien = d) then
    return jsonb_build_object('ok', true, 'juz', true, 'dzien', d,
      'zostalo', (select count(*) from public.nauka_zamrozenia where user_id = u and uzyte_dzien is null));
  end if;
  if exists (select 1 from public.nauka_rp where user_id = u and dzien = d) then
    return jsonb_build_object('ok', false, 'code', 'not_missed');
  end if;
  select id into zid from public.nauka_zamrozenia where user_id = u and uzyte_dzien is null order by created_at limit 1;
  if zid is null then return jsonb_build_object('ok', false, 'code', 'none'); end if;
  update public.nauka_zamrozenia set uzyte_dzien = d, uzyte_at = now() where id = zid;
  return jsonb_build_object('ok', true, 'dzien', d,
    'zostalo', (select count(*) from public.nauka_zamrozenia where user_id = u and uzyte_dzien is null));
end $$;

-- Wygląd osób z rankingu (ramka, kolor nicku, tytuł, gablota, poziom) po nickach z tego samego rocznika.
-- Osobna funkcja, żeby nie zmieniać nauka_ranking. Tylko osoby widoczne w rankingu (w_rankingu i nick).
create or replace function public.nauka_wyglad(p_nicki text[]) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare c jsonb := public.nauka_rp_cfg(); me public.nauka_profil; v jsonb;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'code', 'not_logged_in'); end if;
  select * into me from public.nauka_profil where user_id = auth.uid();
  select coalesce(jsonb_object_agg(p.nick, public.nauka_wyglad_osoby(p.user_id)), '{}'::jsonb) into v
    from public.nauka_profil p
   where p.nick = any(coalesce(p_nicki[1:60], '{}'))
     and (p.w_rankingu or p.user_id = auth.uid())
     and p.kierunek = coalesce(me.kierunek, c->>'kierunek') and p.rocznik = coalesce(me.rocznik, (c->>'rocznik')::int);
  return jsonb_build_object('ok', true, 'osoby', v, 'ja', public.nauka_wyglad_osoby(auth.uid()));
end $$;

-- =====================================================================
-- 6) Uprawnienia
-- =====================================================================
revoke execute on function
  public.nauka_sezony(), public.nauka_kosm_cfg(), public.nauka_sklep_katalog(), public.nauka_kat_item(text),
  public.nauka_postep(uuid), public.nauka_poziom_z_xp(numeric), public.nauka_poziom(uuid), public.nauka_postep_klucze(jsonb, text),
  public.nauka_sezon_otwarty(text), public.nauka_ma(uuid, text), public.nauka_gablota_miejsca(uuid), public.nauka_wyglad_osoby(uuid),
  public.nauka_sklep_stan(), public.nauka_sklep_kup(text, text), public.nauka_sklep_zaloz(text, text),
  public.nauka_gablota_ustaw(text[]), public.nauka_zamrozenie_uzyj(), public.nauka_wyglad(text[])
from public, anon, authenticated;

grant execute on function
  public.nauka_sklep_stan(), public.nauka_sklep_kup(text, text), public.nauka_sklep_zaloz(text, text),
  public.nauka_gablota_ustaw(text[]), public.nauka_zamrozenie_uzyj(), public.nauka_wyglad(text[])
to authenticated;

notify pgrst, 'reload schema';
