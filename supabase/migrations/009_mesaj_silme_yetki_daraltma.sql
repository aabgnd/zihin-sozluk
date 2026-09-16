-- 009: Mesaj silme fonksiyonlarindan anon yetkisini al
--
-- 007'de "revoke all ... from public" yazilmisti ama Supabase, public
-- semasinda olusturulan fonksiyonlar icin anon / authenticated / service_role
-- rollerine ALTER DEFAULT PRIVILEGES ile ayrica execute veriyor. PUBLIC'ten
-- alinan yetki bu acik grant'i kaldirmadigi icin fonksiyon oturumsuz da
-- cagrilabiliyordu (401 yerine 204 donuyordu).
--
-- Veri riski yoktu: her iki fonksiyon da auth.uid() ile filtreliyor, oturumsuz
-- cagrida hicbir satir eslesmiyor. Yine de yuzey daraltiliyor.
--
-- Bu dosya yalnizca YETKI ALIR. Tablo, kolon, veri ve politika degismez.

revoke execute on function public.delete_message(bigint) from anon;
revoke execute on function public.delete_conversation(uuid) from anon;

-- Giris yapmis kullanicilar icin yetki aynen duruyor.
grant execute on function public.delete_message(bigint) to authenticated;
grant execute on function public.delete_conversation(uuid) to authenticated;

-- Kontrol: asagidaki sorgu her iki fonksiyon icin de anon = false,
-- authenticated = true vermeli.
--
-- select p.proname,
--        has_function_privilege('anon',          p.oid, 'execute') as anon,
--        has_function_privilege('authenticated', p.oid, 'execute') as authenticated
--   from pg_proc p
--   join pg_namespace n on n.oid = p.pronamespace
--  where n.nspname = 'public'
--    and p.proname in ('delete_message', 'delete_conversation');
