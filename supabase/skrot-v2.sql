-- Skrót BM, nowy system materiałów (v2): tekst slajdów prowadzących nie jest dostępny dla studentów.
-- Opracowania powstają już bez zapisywania tekstu slajdów, a stare materiały przerabia Panel AI (kasuje wtedy ich tekst slajdów).
-- Ta reguła dodatkowo zamyka odczyt kolekcji materialSources: studenci widzą tylko sekcje sylabusa.
-- Wklej w Supabase → SQL Editor → Run. Można uruchamiać wielokrotnie. Wymaga wcześniej skrot-platnosci.sql.

-- Czy materiał o tym id jest opracowaniem z sylabusa (security definer: bez rekurencji w regułach tabeli).
create or replace function public.nauka_z_sylabusa(doc_id text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.nauka_docs s
                 where s.kolekcja = 'materials' and s.id = doc_id and s.data ->> 'source' = 'sylabus')
$$;
revoke all on function public.nauka_z_sylabusa(text) from public;
grant execute on function public.nauka_z_sylabusa(text) to anon, authenticated;

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
  or (kolekcja in ('tasks','meta','deadlines','announcements') and public.nauka_platny())
  or (kolekcja = 'reports'  and public.nauka_admin())
  or (kolekcja = 'progress' and id = auth.uid()::text)
);
