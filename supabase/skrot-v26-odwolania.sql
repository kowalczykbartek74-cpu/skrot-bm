-- Skrót BM v26: odwołania z ogłoszeń w Teams dla planu zajęć (plan.skrotbm.pl) i kalendarza w telefonie.
-- Wklej w Supabase → SQL Editor → Run, po v25. Można uruchamiać wielokrotnie (nie kasuje danych).
--
-- Starosta zatwierdza w Skrócie (Narzędzia starosty → Odwołania z Teams) odwołanie albo przeniesienie zajęć z ogłoszenia
-- w Teams. Zapis: nauka_docs, kolekcja meta, id odwolania (czytają osoby z dostępem, zapisuje starosta; bez zmian w regułach).
-- Plan zajęć jest darmowy i publiczny, więc automat planu (plan-bm/scripts/dziekanat.mjs, GitHub Actions) musi te wpisy
-- przeczytać bez logowania. Ta funkcja oddaje tylko to, co i tak pokazuje plan: dla każdego zatwierdzenia tytuł ogłoszenia,
-- nazwę zespołu, datę i gotowe wpisy dla grup. Bez listy odrzuconych, bez identyfikatora starosty i bez treści ogłoszenia.

create or replace function public.nauka_odwolania_publiczne() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('items', coalesce((
    select jsonb_object_agg(e.key, jsonb_build_object(
             'id', e.key, 'tid', e.value->'tid', 'kind', e.value->'kind', 'title', left(coalesce(e.value->>'title', ''), 200),
             'team', left(coalesce(e.value->>'team', ''), 120), 'pub', e.value->'pub', 'z', coalesce(e.value->'z', '{}'::jsonb)))
      from public.nauka_docs d, jsonb_each(coalesce(d.data->'items', '{}'::jsonb)) e
     where d.kolekcja = 'meta' and d.id = 'odwolania' and jsonb_typeof(e.value) = 'object'), '{}'::jsonb))
$$;
revoke all on function public.nauka_odwolania_publiczne() from public;
grant execute on function public.nauka_odwolania_publiczne() to anon, authenticated;

notify pgrst, 'reload schema';
