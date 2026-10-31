-- Skrót BM v19: przykładowa lekcja dla gościa na ekranie logowania (index.html: window.skrotPokaz).
-- Jedna lekcja, OWI 1 w wersji „Prościej · PL” (materialSimple/owi-01-principles), jest do czytania bez logowania.
-- Osobna polityka (permissive): sumuje się z „nauka czytaj” i niczego innego nie otwiera.
-- Uruchom w Supabase → SQL Editor (po v18).

drop policy if exists "nauka pokaz" on public.nauka_docs;
create policy "nauka pokaz" on public.nauka_docs for select to anon, authenticated using (
  kolekcja = 'materialSimple' and id = 'owi-01-principles'
);
