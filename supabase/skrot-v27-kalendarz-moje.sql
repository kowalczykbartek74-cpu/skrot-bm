-- Skrót BM v27: kalendarz w telefonie z własnymi wpisami, własnymi datami zaliczeń i dniami planu nauki.
-- Wklej w Supabase → SQL Editor → Run, po v26. Można uruchamiać wielokrotnie (nie kasuje danych).
-- Potem wdroż ponownie funkcję „kalendarz” (supabase/functions/kalendarz/index.ts), bo to ona rysuje te wpisy.
--
-- Nadpisuje nauka_kalendarz_dane z v16 (dostęp jak wcześniej: opłacone konto, okres próbny albo starosta).
-- Nowe pola odpowiedzi (wszystkie z dokumentu postępu osoby, nauka_docs / progress):
--   moje       = progress.myEvents   (Twoje wpisy z Kalendarza: { title, date, time, kind, sid, note })
--   zaliczenia = progress.exams      (tylko części z własną datą „Inna data u Ciebie?”: [{ k: "<przedmiot>-<część>", date }])
--   plan       = progress.planDays   (dni planu „Przygotuj się”, które strona sama zapisuje: [{ date, sid, part, title, min }])
-- Bez dostępu (wygasł) te pola są puste, tak jak terminy.

create or replace function public.nauka_kalendarz_dane(p_token text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare k public.nauka_kalendarz; prog jsonb; ok boolean;
begin
  select * into k from public.nauka_kalendarz where token = p_token;
  if not found then return null; end if;
  update public.nauka_kalendarz set uzyty_at = now() where user_id = k.user_id;
  ok := exists (select 1 from public.nauka_admini a where a.email = k.email)
     or ((exists (select 1 from public.nauka_dostep d
                 where d.do_kiedy >= current_date and (d.user_id = k.user_id or (k.email <> '' and d.email = k.email)))
             or exists (select 1 from public.nauka_proby p where p.user_id = k.user_id and p.do_kiedy > now()))
         and not exists (select 1 from public.nauka_konta b where b.user_id = k.user_id and b.zablokowane));
  select d.data into prog from public.nauka_docs d where d.kolekcja = 'progress' and d.id = k.user_id::text;
  return jsonb_build_object(
    'platny', ok,
    'grupa', prog ->> 'group',
    'podgrupa', prog ->> 'sub',
    'terminy', case when ok then coalesce((select jsonb_agg(d.data || jsonb_build_object('id', d.id))
                                            from public.nauka_docs d where d.kolekcja = 'deadlines'), '[]'::jsonb)
                    else '[]'::jsonb end,
    'moje', case when ok and jsonb_typeof(prog -> 'myEvents') = 'array'
                 then coalesce((select jsonb_agg(e) from (select e from jsonb_array_elements(prog -> 'myEvents') e
                                where jsonb_typeof(e) = 'object' limit 400) x), '[]'::jsonb)
                 else '[]'::jsonb end,
    'zaliczenia', case when ok and jsonb_typeof(prog -> 'exams') = 'object'
                       then coalesce((select jsonb_agg(jsonb_build_object('k', x.key, 'date', x.value ->> 'date'))
                                        from jsonb_each(prog -> 'exams') x
                                       where jsonb_typeof(x.value) = 'object' and (x.value ->> 'date') ~ '^\d{4}-\d{2}-\d{2}$'), '[]'::jsonb)
                       else '[]'::jsonb end,
    'plan', case when ok and jsonb_typeof(prog -> 'planDays') = 'array'
                 then coalesce((select jsonb_agg(e) from (select e from jsonb_array_elements(prog -> 'planDays') e
                                where jsonb_typeof(e) = 'object' limit 200) x), '[]'::jsonb)
                 else '[]'::jsonb end
  );
end $$;
revoke all on function public.nauka_kalendarz_dane(text) from public, anon, authenticated;
grant execute on function public.nauka_kalendarz_dane(text) to service_role;

notify pgrst, 'reload schema';
