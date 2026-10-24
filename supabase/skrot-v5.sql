-- Skrót BM v5: (1) terminy dla całego roku dodaje tylko starosta, (2) limit bajtów na bilet AI („Moje materiały”).
-- Wklej w Supabase → SQL Editor → Run. Można uruchamiać wielokrotnie. Wymaga wcześniej skrot-v4-moje.sql.
-- Uruchom PRZED wdrożeniem nowej wersji funkcji „claude” (npx supabase functions deploy claude),
-- bo bez tego SQL nowa funkcja odrzuci zapytania studentów.

-- 1) Terminy (kolekcja deadlines): dodaje, zmienia i usuwa tylko starosta.
--    Wcześniej każdy płacący mógł dodać termin widoczny od razu dla całego roku i w kalendarzach w telefonach.
--    Studenci dalej wysyłają zgłoszenia błędów (reports). Terminy dodane wcześniej przez studentów zostają;
--    usuń je w aplikacji, jeśli są złe.
drop policy if exists "nauka dodaj" on public.nauka_docs;
create policy "nauka dodaj" on public.nauka_docs for insert to authenticated with check (
     (kolekcja = 'reports' and public.nauka_platny())
  or (kolekcja = 'progress' and id = auth.uid()::text)
  or (kolekcja in ('materials','materialContent','materialSources','materialSimple','quizWhy',
                   'tasks','meta','deadlines','announcements','exams','examBank','glossary') and public.nauka_admin())
  or (kolekcja in ('myMaterials','myContent') and public.nauka_platny())
);

drop policy if exists "nauka zmien" on public.nauka_docs;
create policy "nauka zmien" on public.nauka_docs for update to authenticated
  using (
       (kolekcja = 'progress'  and id = auth.uid()::text)
    or (kolekcja in ('materials','materialContent','materialSources','materialSimple','quizWhy',
                     'tasks','meta','deadlines','announcements','reports','exams','examBank','glossary') and public.nauka_admin())
    or (kolekcja in ('myMaterials','myContent') and created_by = auth.uid())
  )
  with check (
       (kolekcja = 'progress'  and id = auth.uid()::text)
    or (kolekcja in ('materials','materialContent','materialSources','materialSimple','quizWhy',
                     'tasks','meta','deadlines','announcements','reports','exams','examBank','glossary') and public.nauka_admin())
    or (kolekcja in ('myMaterials','myContent') and created_by = auth.uid())
  );

drop policy if exists "nauka usun" on public.nauka_docs;
create policy "nauka usun" on public.nauka_docs for delete to authenticated using (
     (kolekcja = 'progress'  and id = auth.uid()::text)
  or (kolekcja in ('materials','materialContent','materialSources','materialSimple','quizWhy',
                   'tasks','meta','deadlines','announcements','reports','exams','examBank','glossary') and public.nauka_admin())
  or (kolekcja in ('myMaterials','myContent') and created_by = auth.uid())
);

-- 2) Bilety AI: limit bajtów na cały plik.
-- Dlaczego: AI dla studentów działa na kluczu starosty. Bilet ograniczał tylko liczbę zapytań (8 na plik),
-- a nie ich wielkość, więc jeden bilet mógł kosztować 8 × 160 KB. Teraz bilet ma też budżet bajtów
-- na cały plik. 600 KB wystarcza na pełne przetworzenie największego pliku (mapa ~115 KB, dwie próby
-- opracowania i fiszek ~130 KB, prosty język i „Czemu?” z powtórkami ~240 KB) z zapasem.

alter table public.nauka_ai_bilety
  add column if not exists bajty_zostalo bigint not null default 600000;

-- Funkcja AI na serwerze woła to przy każdym zapytaniu studenta: zużywa jedno zapytanie i n bajtów z biletu.
create or replace function public.nauka_ai_bilet(b uuid, n integer) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
begin
  if auth.uid() is null or b is null or n is null or n < 0 then return false; end if;
  update public.nauka_ai_bilety
     set zostalo = zostalo - 1, bajty_zostalo = bajty_zostalo - n
   where id = b and user_id = auth.uid() and zostalo > 0 and bajty_zostalo >= n
     and created_at > now() - interval '2 hours';
  return found;
end $$;

-- Stara wersja bez limitu bajtów nie jest już potrzebna.
drop function if exists public.nauka_ai_bilet(uuid);

revoke all on function public.nauka_ai_bilet(uuid, integer) from public, anon;
grant execute on function public.nauka_ai_bilet(uuid, integer) to authenticated;
