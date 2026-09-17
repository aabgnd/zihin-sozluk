-- 011: Kullanici adiyla giris
--
-- signInWithPassword yalnizca e-posta kabul eder. Kullanici adiyla giris icin
-- once e-postaya ulasmak gerekir, ama e-postalar gizlidir: kullanici adindan
-- e-posta donduren acik bir fonksiyon, herkesin e-postasini toplamaya yarardi.
--
-- Bu yuzden fonksiyon e-postayi YALNIZCA sifre dogruysa dondurur. Sifreyi
-- bilmeyen biri hicbir sey ogrenemez. Ayrica art arda 5 yanlis denemede
-- kullanici adi 5 dakika kilitlenir; aksi halde bu fonksiyon, GoTrue'nun
-- hiz sinirlarini atlayan bir sifre deneme kapisi olurdu.
--
-- Bu dosya yalnizca EKLER: yeni tablo, yeni fonksiyon.

create table if not exists public.giris_deneme (
  kullanici text primary key,
  hatali_sayi integer not null default 0,
  kilit_bitis timestamptz
);

alter table public.giris_deneme enable row level security;

-- Tabloya dogrudan erisim yok; yalnizca asagidaki fonksiyon uzerinden.
revoke all on table public.giris_deneme from anon, authenticated;

create or replace function public.kullanici_email(kullanici text, sifre text)
returns text
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  ad text;
  hedef record;
  kalan integer;
  yeni_sayi integer;
begin
  ad := lower(btrim(coalesce(kullanici, '')));
  if ad = '' or coalesce(sifre, '') = '' then
    return null;
  end if;

  -- Kilitliyse hic denemeden cik.
  select ceil(extract(epoch from (kilit_bitis - now())))::integer
    into kalan
    from public.giris_deneme
   where public.giris_deneme.kullanici = ad;

  if kalan is not null and kalan > 0 then
    return null;
  end if;

  select u.email, u.encrypted_password
    into hedef
    from public.profiles p
    join auth.users u on u.id = p.id
   where lower(p.username) = ad;

  if found
     and hedef.encrypted_password is not null
     and hedef.encrypted_password = extensions.crypt(sifre, hedef.encrypted_password)
  then
    delete from public.giris_deneme where public.giris_deneme.kullanici = ad;
    return hedef.email;
  end if;

  -- Yanlis deneme: sayaci artir, 5'te kilitle.
  insert into public.giris_deneme (kullanici, hatali_sayi)
       values (ad, 1)
  on conflict (kullanici) do update
          set hatali_sayi = public.giris_deneme.hatali_sayi + 1
    returning hatali_sayi into yeni_sayi;

  if yeni_sayi >= 5 then
    update public.giris_deneme
       set kilit_bitis = now() + interval '5 minutes',
           hatali_sayi = 0
     where public.giris_deneme.kullanici = ad;
  end if;

  return null;
end;
$$;

revoke all on function public.kullanici_email(text, text) from public;
grant execute on function public.kullanici_email(text, text) to anon, authenticated;
