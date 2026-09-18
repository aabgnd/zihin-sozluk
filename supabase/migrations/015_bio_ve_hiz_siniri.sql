-- 015: Profil bio'su ve gonderim hiz siniri
--
-- Bu dosya yalnizca EKLER: yeni kolon, yeni kisit, yeni fonksiyon ve
-- tetikleyici, yeni grant. Mevcut veri degismez, kolon silinmez.
-- Tekrar calistirilabilir (if not exists / create or replace).


-- 1) Profil bio'su ----------------------------------------------------

alter table public.profiles
  add column if not exists bio text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_bio_uzunluk'
  ) then
    alter table public.profiles
      add constraint profiles_bio_uzunluk
      check (bio is null or char_length(bio) <= 300);
  end if;
end;
$$;

-- profiles tablosunda okuma ve yazma KOLON bazli acik; yeni kolon ayrica
-- izin ister. Guncelleme politikasi zaten kisiyi kendi satiriyla
-- sinirliyor, burada yalnizca kolon eklenir.
grant select (bio) on public.profiles to anon, authenticated;
grant update (bio) on public.profiles to authenticated;


-- 2) Gonderim hiz siniri ----------------------------------------------
--
-- Siniri sunucu eyleminde tutmak yetmez: oturumu olan biri Supabase
-- REST'e dogrudan insert atarak eylemi atlayabilir. Tetikleyici her
-- yoldan gelen insert'i yakalar.
--
-- ZS429 ozel hata kodudur; uygulama bunu taniyip Turkce mesaj gosterir.

create or replace function public.mesaj_hiz_siniri()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(*) from public.messages
    where sender_id = new.sender_id
      and created_at > now() - interval '1 hour'
  ) >= 50 then
    raise exception 'son bir saatte çok fazla mesaj gönderdin, biraz bekleyip tekrar dene.'
      using errcode = 'ZS429';
  end if;
  return new;
end;
$$;

create or replace trigger mesaj_hiz_siniri
  before insert on public.messages
  for each row execute function public.mesaj_hiz_siniri();


-- Admin ve modlar muaf: toplu icerik girerken sinira takilmasinlar.
create or replace function public.entry_hiz_siniri()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.profiles
    where id = new.user_id and role in ('admin', 'mod')
  ) then
    return new;
  end if;

  if (
    select count(*) from public.entries
    where user_id = new.user_id
      and created_at > now() - interval '1 hour'
  ) >= 30 then
    raise exception 'son bir saatte çok fazla entry girdin, biraz bekleyip tekrar dene.'
      using errcode = 'ZS429';
  end if;
  return new;
end;
$$;

create or replace trigger entry_hiz_siniri
  before insert on public.entries
  for each row execute function public.entry_hiz_siniri();
