-- Skrót BM v9: limit „Moich materiałów” – 2 pliki dziennie na osobę (było 5).
-- Miesięczny limit (40) bez zmian. Starosta dalej bez limitu.
-- Dzień liczony po czasie polskim (od północy). Każde przetworzenie, także ponowna próba
-- i „Uzupełnij teraz”, zużywa jeden plik z dziennego limitu.
-- Uruchom raz w Supabase → SQL Editor. Można uruchamiać ponownie.

create or replace function public.nauka_moje_stan() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'dzien', (select count(*) from public.nauka_ai_bilety b where b.user_id = auth.uid()
              and b.created_at >= (date_trunc('day', now() at time zone 'Europe/Warsaw') at time zone 'Europe/Warsaw')),
    'miesiac', (select count(*) from public.nauka_ai_bilety b where b.user_id = auth.uid()
              and b.created_at >= (date_trunc('month', now() at time zone 'Europe/Warsaw') at time zone 'Europe/Warsaw')),
    'limit_dzien', 2,
    'limit_miesiac', 40,
    'admin', public.nauka_admin()
  )
$$;

revoke all on function public.nauka_moje_stan() from public, anon;
grant execute on function public.nauka_moje_stan() to authenticated;
