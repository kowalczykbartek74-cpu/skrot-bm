-- Skrót BM v3: tryb przed kolokwium, zadania krok po kroku, słowniczek.
-- Nowe kolekcje w nauka_docs:
--   exams     – szablony próbnych testów (id: <przedmiot>-<W|CW|LAB>), pisze starosta
--   examBank  – pytania do próbnych testów (id: <przedmiot>), pisze starosta
--   glossary  – gotowy słowniczek EN–PL (id: <przedmiot>), buduje Panel AI
-- Czytają osoby z pełnym dostępem, zapisuje tylko administrator.
-- Powtórki, zadania i wyniki testów każdej osoby trafiają do jej dokumentu w kolekcji progress (bez zmian w regułach).
-- Wklej w Supabase → SQL Editor → Run. Można uruchamiać wielokrotnie. Wymaga wcześniej skrot-platnosci.sql i skrot-v2.sql.

alter table public.nauka_docs drop constraint if exists nauka_docs_kolekcja_check;
alter table public.nauka_docs add constraint nauka_docs_kolekcja_check check (kolekcja in (
  'materials','materialContent','materialSources','materialSimple','quizWhy',
  'tasks','meta','deadlines','announcements','reports','progress',
  'exams','examBank','glossary'));

drop policy if exists "nauka czytaj" on public.nauka_docs;
create policy "nauka czytaj" on public.nauka_docs for select to anon, authenticated using (
     kolekcja = 'materials'
  or (kolekcja in ('materialContent','materialSimple','quizWhy')
        and (public.nauka_platny() or (auth.uid() is not null and public.nauka_darmowy(id))))
  -- tekst źródła: studenci widzą tylko sekcje sylabusa; tekstu slajdów prowadzących nie czyta nikt poza starostą
  or (kolekcja = 'materialSources'
        and (public.nauka_admin()
             or ((public.nauka_platny() or (auth.uid() is not null and public.nauka_darmowy(id)))
                 and public.nauka_z_sylabusa(id))))
  or (kolekcja in ('tasks','meta','deadlines','announcements','exams','examBank','glossary') and public.nauka_platny())
  or (kolekcja = 'reports'  and public.nauka_admin())
  or (kolekcja = 'progress' and id = auth.uid()::text)
);

drop policy if exists "nauka dodaj" on public.nauka_docs;
create policy "nauka dodaj" on public.nauka_docs for insert to authenticated with check (
     (kolekcja in ('deadlines','reports') and public.nauka_platny())
  or (kolekcja = 'progress' and id = auth.uid()::text)
  or (kolekcja in ('materials','materialContent','materialSources','materialSimple','quizWhy',
                   'tasks','meta','announcements','exams','examBank','glossary') and public.nauka_admin())
);

drop policy if exists "nauka zmien" on public.nauka_docs;
create policy "nauka zmien" on public.nauka_docs for update to authenticated
  using (
       (kolekcja = 'deadlines' and (created_by = auth.uid() or public.nauka_admin()))
    or (kolekcja = 'progress'  and id = auth.uid()::text)
    or (kolekcja in ('materials','materialContent','materialSources','materialSimple','quizWhy',
                     'tasks','meta','announcements','reports','exams','examBank','glossary') and public.nauka_admin())
  )
  with check (
       (kolekcja = 'deadlines' and (created_by = auth.uid() or public.nauka_admin()))
    or (kolekcja = 'progress'  and id = auth.uid()::text)
    or (kolekcja in ('materials','materialContent','materialSources','materialSimple','quizWhy',
                     'tasks','meta','announcements','reports','exams','examBank','glossary') and public.nauka_admin())
  );

drop policy if exists "nauka usun" on public.nauka_docs;
create policy "nauka usun" on public.nauka_docs for delete to authenticated using (
     (kolekcja = 'deadlines' and (created_by = auth.uid() or public.nauka_admin()))
  or (kolekcja = 'progress'  and id = auth.uid()::text)
  or (kolekcja in ('materials','materialContent','materialSources','materialSimple','quizWhy',
                   'tasks','meta','announcements','reports','exams','examBank','glossary') and public.nauka_admin())
);
