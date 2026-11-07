-- Strażnik kodowania: polskie litery wpisane wprost muszą być równe tym samym literom zapisanym kodami (same znaki ASCII).
-- Gdy plik przeszedł przez Terminal albo zły schowek, litery z pierwszej strony się psują („Ňā”, „√≥”), a kody nie,
-- więc warunek nie przechodzi i plik zatrzymuje się na pierwszej instrukcji, zanim cokolwiek zmieni.
-- Ten blok wklejamy na sam początek każdej nowej migracji (od v44); pilnuje tego tests/migracje.test.js.
do $$ begin
  if 'ąćęłńóśźż' <> U&'\0105\0107\0119\0142\0144\00F3\015B\017A\017C' then
    raise exception 'Polskie znaki doszły zepsute. Skopiuj plik z github.com (Raw), nie przez Terminal.';
  end if;
end $$;
