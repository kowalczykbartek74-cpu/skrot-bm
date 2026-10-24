-- Skrót BM v4: „Moje materiały” — każda osoba z pełnym dostępem wgrywa własne pliki,
-- AI opracowuje je tak samo jak materiały roku, a wynik trafia do sekcji wybranej przez tę osobę.
-- Materiały są prywatne: widzi je, zmienia i usuwa tylko ich właściciel (created_by).
-- AI dla studentów działa na kluczu starosty, więc każdy plik wymaga „biletu” z limitem:
-- domyślnie 5 plików dziennie i 40 w miesiącu na osobę (zmienisz w funkcji nauka_moje_start).
-- Wklej w Supabase → SQL Editor → Run. Można uruchamiać wielokrotnie. Wymaga wcześniej skrot-v3.sql.
-- UWAGA: po każdym uruchomieniu tego pliku uruchom też skrot-v5.sql (terminy tylko od starosty, limit bajtów AI).
-- Potem wdróż ponownie funkcję AI:  npx supabase functions deploy claude

-- 1) nowe kolekcje
alter table public.nauka_docs drop constraint if exists nauka_docs_kolekcja_check;
alter table public.nauka_docs add constraint nauka_docs_kolekcja_check check (kolekcja in (
  'materials','materialContent','materialSources','materialSimple','quizWhy',
  'tasks','meta','deadlines','announcements','reports','progress',
  'exams','examBank','glossary',
  'myMaterials','myContent'));

create index if not exists nauka_docs_wlasciciel_idx on public.nauka_docs (kolekcja, created_by);

-- 2) reguły (to samo co v3 + własne materiały)
drop policy if exists "nauka czytaj" on public.nauka_docs;
create policy "nauka czytaj" on public.nauka_docs for select to anon, authenticated using (
     kolekcja = 'materials'
  or (kolekcja in ('materialContent','materialSimple','quizWhy')
        and (public.nauka_platny() or (auth.uid() is not null and public.nauka_darmowy(id))))
  or (kolekcja = 'materialSources'
        and (public.nauka_admin()
             or ((public.nauka_platny() or (auth.uid() is not null and public.nauka_darmowy(id)))
                 and public.nauka_z_sylabusa(id))))
  or (kolekcja in ('tasks','meta','deadlines','announcements','exams','examBank','glossary') and public.nauka_platny())
  or (kolekcja = 'reports'  and public.nauka_admin())
  or (kolekcja = 'progress' and id = auth.uid()::text)
  or (kolekcja in ('myMaterials','myContent') and auth.uid() is not null and created_by = auth.uid())
);

drop policy if exists "nauka dodaj" on public.nauka_docs;
create policy "nauka dodaj" on public.nauka_docs for insert to authenticated with check (
     (kolekcja in ('deadlines','reports') and public.nauka_platny())
  or (kolekcja = 'progress' and id = auth.uid()::text)
  or (kolekcja in ('materials','materialContent','materialSources','materialSimple','quizWhy',
                   'tasks','meta','announcements','exams','examBank','glossary') and public.nauka_admin())
  or (kolekcja in ('myMaterials','myContent') and public.nauka_platny())
);

drop policy if exists "nauka zmien" on public.nauka_docs;
create policy "nauka zmien" on public.nauka_docs for update to authenticated
  using (
       (kolekcja = 'deadlines' and (created_by = auth.uid() or public.nauka_admin()))
    or (kolekcja = 'progress'  and id = auth.uid()::text)
    or (kolekcja in ('materials','materialContent','materialSources','materialSimple','quizWhy',
                     'tasks','meta','announcements','reports','exams','examBank','glossary') and public.nauka_admin())
    or (kolekcja in ('myMaterials','myContent') and created_by = auth.uid())
  )
  with check (
       (kolekcja = 'deadlines' and (created_by = auth.uid() or public.nauka_admin()))
    or (kolekcja = 'progress'  and id = auth.uid()::text)
    or (kolekcja in ('materials','materialContent','materialSources','materialSimple','quizWhy',
                     'tasks','meta','announcements','reports','exams','examBank','glossary') and public.nauka_admin())
    or (kolekcja in ('myMaterials','myContent') and created_by = auth.uid())
  );

drop policy if exists "nauka usun" on public.nauka_docs;
create policy "nauka usun" on public.nauka_docs for delete to authenticated using (
     (kolekcja = 'deadlines' and (created_by = auth.uid() or public.nauka_admin()))
  or (kolekcja = 'progress'  and id = auth.uid()::text)
  or (kolekcja in ('materials','materialContent','materialSources','materialSimple','quizWhy',
                   'tasks','meta','announcements','reports','exams','examBank','glossary') and public.nauka_admin())
  or (kolekcja in ('myMaterials','myContent') and created_by = auth.uid())
);

-- 3) ochrona przed zasypaniem bazy: najwyżej 30 nowych własnych materiałów na godzinę
create or replace function public.nauka_przed_zapisem() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := now();
    if new.kolekcja in ('deadlines','reports') and not public.nauka_admin() then
      if (select count(*) from public.nauka_docs d
          where d.created_by = auth.uid() and d.kolekcja = new.kolekcja
            and d.created_at > now() - interval '1 hour') >= 20 then
        raise exception 'Za dużo wpisów w ciągu godziny. Spróbuj później.';
      end if;
    end if;
    if new.kolekcja = 'myMaterials' and not public.nauka_admin() then
      if (select count(*) from public.nauka_docs d
          where d.created_by = auth.uid() and d.kolekcja = 'myMaterials'
            and d.created_at > now() - interval '1 hour') >= 30 then
        raise exception 'Za dużo nowych materiałów w ciągu godziny. Spróbuj później.';
      end if;
    end if;
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end $$;

-- 4) bilety AI: jeden bilet = jeden plik (do 10 zapytań do AI w ciągu 2 godzin)
create table if not exists public.nauka_ai_bilety (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  created_at  timestamptz not null default now(),
  zostalo     integer not null default 10
);
create index if not exists nauka_ai_bilety_user_idx on public.nauka_ai_bilety (user_id, created_at);
alter table public.nauka_ai_bilety enable row level security;
revoke all on public.nauka_ai_bilety from anon, authenticated;
-- brak reguł: tabelę czytają tylko funkcje poniżej

-- Ile plików ta osoba przetworzyła dziś i w tym miesiącu (czas polski).
create or replace function public.nauka_moje_stan() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'dzien', (select count(*) from public.nauka_ai_bilety b where b.user_id = auth.uid()
              and b.created_at >= (date_trunc('day', now() at time zone 'Europe/Warsaw') at time zone 'Europe/Warsaw')),
    'miesiac', (select count(*) from public.nauka_ai_bilety b where b.user_id = auth.uid()
              and b.created_at >= (date_trunc('month', now() at time zone 'Europe/Warsaw') at time zone 'Europe/Warsaw')),
    'limit_dzien', 5,
    'limit_miesiac', 40,
    'admin', public.nauka_admin()
  )
$$;

-- Wywołuje strona przed przetworzeniem pliku: sprawdza limit i wydaje bilet.
create or replace function public.nauka_moje_start() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare st jsonb; b uuid;
begin
  if auth.uid() is null then raise exception 'nie_zalogowany'; end if;
  if not public.nauka_platny() then raise exception 'brak_dostepu'; end if;
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
  st := public.nauka_moje_stan();
  if not public.nauka_admin() then
    if (st ->> 'dzien')::int >= (st ->> 'limit_dzien')::int then raise exception 'limit_dzien'; end if;
    if (st ->> 'miesiac')::int >= (st ->> 'limit_miesiac')::int then raise exception 'limit_miesiac'; end if;
  end if;
  insert into public.nauka_ai_bilety (user_id) values (auth.uid()) returning id into b;
  return st || jsonb_build_object('bilet', b, 'dzien', (st ->> 'dzien')::int + 1, 'miesiac', (st ->> 'miesiac')::int + 1);
end $$;

-- Wywołuje funkcja AI na serwerze przy każdym zapytaniu studenta: zużywa jedno zapytanie z biletu.
create or replace function public.nauka_ai_bilet(b uuid) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
begin
  if auth.uid() is null or b is null then return false; end if;
  update public.nauka_ai_bilety set zostalo = zostalo - 1
   where id = b and user_id = auth.uid() and zostalo > 0
     and created_at > now() - interval '2 hours';
  return found;
end $$;

revoke all on function public.nauka_moje_stan(), public.nauka_moje_start(), public.nauka_ai_bilet(uuid) from public, anon;
grant execute on function public.nauka_moje_stan(), public.nauka_moje_start(), public.nauka_ai_bilet(uuid) to authenticated;
