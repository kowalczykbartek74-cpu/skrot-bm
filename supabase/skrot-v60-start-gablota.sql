do $$ begin
  if 'ąćęłńóśźż' <> U&'\0105\0107\0119\0142\0144\00F3\015B\017A\017C' then
    raise exception 'Polskie znaki doszły zepsute. Skopiuj plik z github.com (Raw), nie przez Terminal.';
  end if;
end $$;
-- Skrót v60 (pętla UX-5, etap G3): 100 monet na start, gablota 3 miejsca bez dopłaty, nagrody za poziomy 15–20.
-- Wklej w Supabase → SQL Editor → Run, po v59. Kopiuj z github.com („Copy raw file”). Można uruchomić ponownie.
--
-- 1) 100 monet na start, raz na konto (klucz „start” w nauka_monety): wyzwalacze AFTER INSERT na nauka_proby (start próby)
--    i na nauka_dostep (zakup albo karnet bez próby; także gdy wiersz dostał user_id później, po pierwszym logowaniu).
--    Nie zmienia nauka_proba_start ani stripe-webhook (właściciel: pętla 1). Kto miał próbę, przy zakupie nic nie dostaje drugi raz.
-- 2) Gablota: 3 miejsca dla każdego (nauka_kosm_cfg.gablota_bazowo = 3); „gablota:2” i „gablota:3” znikają z katalogu,
--    a kto je kupił, dostaje zwrot monet (klucz zwrot:gablota:N, raz). Wiersze w nauka_posiadane zostają jako historia.
-- 3) Nagrody za poziomy 15–20 (tylko za poziom, nie do kupienia): Platynowa ramka (15), tytuł „Prezes roku” (17),
--    Ramka Geniusza (20). Złota ramka zostaje na poziomie 10 (kto ją ma, nie traci).

-- ---------- 1) monety na start ----------
create or replace function public.nauka_monety_start_cfg() returns int language sql immutable set search_path = '' as $$ select 100 $$;
create or replace function public.nauka_monety_start(p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_user is null then return; end if;
  insert into public.nauka_monety (user_id, delta, zrodlo, klucz, opis)
  values (p_user, public.nauka_monety_start_cfg(), 'admin', 'start', 'Na start: prezent od Zdawalni')
  on conflict (user_id, klucz) do nothing;
end $$;
create or replace function public.nauka_monety_start_proba() returns trigger
language plpgsql security definer set search_path = '' as $$
begin perform public.nauka_monety_start(new.user_id); return null; end $$;
create or replace function public.nauka_monety_start_dostep() returns trigger
language plpgsql security definer set search_path = '' as $$
declare u uuid := new.user_id;
begin
  if u is null then select id into u from auth.users where lower(email) = lower(new.email) limit 1; end if;
  perform public.nauka_monety_start(u);
  return null;
end $$;
drop trigger if exists nauka_monety_start_proba on public.nauka_proby;
create trigger nauka_monety_start_proba after insert on public.nauka_proby
  for each row execute function public.nauka_monety_start_proba();
drop trigger if exists nauka_monety_start_dostep on public.nauka_dostep;
create trigger nauka_monety_start_dostep after insert on public.nauka_dostep
  for each row execute function public.nauka_monety_start_dostep();
drop trigger if exists nauka_monety_start_dostep_uid on public.nauka_dostep;
create trigger nauka_monety_start_dostep_uid after update of user_id on public.nauka_dostep
  for each row when (old.user_id is null and new.user_id is not null) execute function public.nauka_monety_start_dostep();
revoke execute on function public.nauka_monety_start_cfg(), public.nauka_monety_start(uuid), public.nauka_monety_start_proba(), public.nauka_monety_start_dostep() from public, anon, authenticated;

-- ---------- 2) gablota: 3 miejsca bazowo, zwrot za kupione miejsca ----------
create or replace function public.nauka_kosm_cfg() returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'zamrozenia_max', 2,     -- najwięcej zamrożeń serii naraz
    'gablota_bazowo', 3,     -- miejsca w gablocie dla każdego (v60: wcześniej 1 + kupowane 2. i 3.)
    'sloty', jsonb_build_array('ramka','kolor','tytul','skorka','tlo','fiszki','efekt','dzwieki','plomien')
  )
$$;
create or replace function public.nauka_gablota_miejsca(p_user uuid) returns int
language sql stable security definer set search_path = '' as $$
  select (public.nauka_kosm_cfg()->>'gablota_bazowo')::int
$$;
insert into public.nauka_monety (user_id, delta, zrodlo, klucz, opis)
select p.user_id, p.cena, 'admin', 'zwrot:' || p.item, 'Zwrot: ' || case p.item when 'gablota:2' then '2.' else '3.' end || ' miejsce w gablocie jest teraz dla każdego'
  from public.nauka_posiadane p
 where p.item in ('gablota:2', 'gablota:3') and p.cena > 0
on conflict (user_id, klucz) do nothing;

-- ---------- 3) katalog: bez miejsc gabloty, nagrody za poziomy 15–20 ----------
do $do$
declare
  kat jsonb := public.nauka_sklep_katalog(); nowy jsonb := '[]'::jsonb; e jsonb; za int := 0; i int := 0;
  dodaj jsonb := '[
    {"id":"ramka:platynowa", "kat":"profil", "slot":"ramka", "cena":null, "tylko_za_poziom":15, "pl":"Platynowa ramka", "en":"Platinum Frame",
     "opis_pl":"Chłodny połysk platyny wokół awatara. Tylko za poziom 15.", "opis_en":"A cool platinum sheen around your avatar. Level 15 only.", "wyglad":{"g":"platyna"}},
    {"id":"tytul:prezes-roku", "kat":"profil", "slot":"tytul", "cena":null, "tylko_za_poziom":17, "pl":"Prezes roku", "en":"President of the Year",
     "opis_pl":"Tytuł pod pseudonimem w rankingu. Tylko za poziom 17 (Prezes).", "opis_en":"A title under your nickname in the ranking. Level 17 (President) only."},
    {"id":"ramka:geniusz", "kat":"profil", "slot":"ramka", "cena":null, "tylko_za_poziom":20, "pl":"Ramka Geniusza", "en":"Genius Frame",
     "opis_pl":"Limonkowe fasety wokół awatara. Tylko za poziom 20 (Geniusz).", "opis_en":"Lime facets around your avatar. Level 20 (Genius) only.", "wyglad":{"g":"geniusz"}}
  ]'::jsonb;
begin
  for e in select value from jsonb_array_elements(kat) loop
    if e->>'id' in ('gablota:2', 'gablota:3') then continue; end if;
    if dodaj @> jsonb_build_array(jsonb_build_object('id', e->>'id')) then continue; end if; -- drugi raz: wstawimy na nowo w tym samym miejscu
    nowy := nowy || jsonb_build_array(e);
    i := i + 1;
    if e->>'id' = 'ramka:zlota' then za := i; end if;
  end loop;
  if za = 0 then za := jsonb_array_length(nowy); end if;
  for e in select value from jsonb_array_elements(dodaj) loop
    nowy := jsonb_insert(nowy, array[za::text], e); za := za + 1;
  end loop;
  execute format($f$
    create or replace function public.nauka_sklep_katalog() returns jsonb
    language sql immutable set search_path = '' as $b$ select %L::jsonb $b$
  $f$, nowy::text);
end
$do$;

notify pgrst, 'reload schema';
