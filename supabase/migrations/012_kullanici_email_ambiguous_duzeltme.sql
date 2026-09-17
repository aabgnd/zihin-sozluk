-- 012: kullanici_email fonksiyonundaki "ambiguous column" hatasi
--
-- 011'de fonksiyonun parametresi "kullanici", giris_deneme tablosunun kolonu
-- da "kullanici". Bu yuzden
--
--     insert ... on conflict (kullanici) do update ...
--
-- satirinda Postgres hangisinin kastedildigini bilemiyordu:
--     42702: column reference "kullanici" is ambiguous
--
-- Etkisi: dogru sifreyle giris calisiyordu (o yol insert'e hic ugramiyor),
-- ama YANLIS sifrede fonksiyon hata donuyordu. Kullanici "e-posta ya da
-- sifre hatali" yerine sistem hatasi goruyordu ve 5 deneme kilidi hic
-- devreye girmiyordu.
--
-- Cozum: on conflict yerine once UPDATE, satir yoksa INSERT. Boylece
-- belirsiz kolon referansi kalmiyor ve fonksiyon imzasi degismedigi icin
-- DROP gerekmiyor; create or replace yeterli.
--
-- Bu dosya yalnizca fonksiyon govdesini degistirir. Tablo, kolon, veri ve
-- yetkiler oldugu gibi kalir.

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
  select ceil(extract(epoch from (g.kilit_bitis - now())))::integer
    into kalan
    from public.giris_deneme g
   where g.kullanici = ad;

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
    delete from public.giris_deneme g where g.kullanici = ad;
    return hedef.email;
  end if;

  -- Yanlis deneme: once var olan satiri artir, yoksa olustur.
  update public.giris_deneme g
     set hatali_sayi = g.hatali_sayi + 1
   where g.kullanici = ad
  returning g.hatali_sayi into yeni_sayi;

  if not found then
    insert into public.giris_deneme (kullanici, hatali_sayi) values (ad, 1);
    yeni_sayi := 1;
  end if;

  if yeni_sayi >= 5 then
    update public.giris_deneme g
       set kilit_bitis = now() + interval '5 minutes',
           hatali_sayi = 0
     where g.kullanici = ad;
  end if;

  return null;
end;
$$;
