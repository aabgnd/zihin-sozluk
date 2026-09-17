-- 010: Sifre degistirmede "mevcut sifre" deneme sinirlamasi
--
-- Art arda 5 yanlis denemede hesap birkac dakika beklemeye alinir.
-- Sayac sunucuda tutulur: cerezde tutulsaydi, oturumu ele geciren kisi
-- cerezi silip sinirsiz deneme yapabilirdi.
--
-- Bu dosya yalnizca EKLER: yeni tablo, yeni fonksiyon.
-- Kolon silme, yeniden adlandirma ya da veri guncelleme yoktur.

create table if not exists public.sifre_deneme (
  user_id uuid primary key references auth.users (id) on delete cascade,
  hatali_sayi integer not null default 0,
  kilit_bitis timestamptz
);

alter table public.sifre_deneme enable row level security;

-- Tabloya dogrudan erisim yok; yalnizca asagidaki fonksiyonlar uzerinden.
revoke all on table public.sifre_deneme from anon, authenticated;

-- Kalan kilit suresi (saniye). Kilit yoksa 0.
create or replace function public.sifre_kilit_kalan()
returns integer
language sql
security definer
set search_path = public
as $$
  select greatest(
    0,
    coalesce(
      (select ceil(extract(epoch from (kilit_bitis - now())))::integer
         from public.sifre_deneme
        where user_id = auth.uid()),
      0
    )
  );
$$;

-- Yanlis deneme kaydeder; 5'e ulasinca 5 dakika kilitler.
create or replace function public.sifre_deneme_basarisiz()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  yeni_sayi integer;
begin
  insert into public.sifre_deneme (user_id, hatali_sayi)
       values (auth.uid(), 1)
  on conflict (user_id) do update
          set hatali_sayi = public.sifre_deneme.hatali_sayi + 1
    returning hatali_sayi into yeni_sayi;

  if yeni_sayi >= 5 then
    update public.sifre_deneme
       set kilit_bitis = now() + interval '5 minutes',
           hatali_sayi = 0
     where user_id = auth.uid();
  end if;

  return yeni_sayi;
end;
$$;

-- Dogru sifre girilince sayaci sifirlar.
create or replace function public.sifre_deneme_sifirla()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.sifre_deneme where user_id = auth.uid();
$$;

revoke all on function public.sifre_kilit_kalan() from public, anon;
revoke all on function public.sifre_deneme_basarisiz() from public, anon;
revoke all on function public.sifre_deneme_sifirla() from public, anon;

grant execute on function public.sifre_kilit_kalan() to authenticated;
grant execute on function public.sifre_deneme_basarisiz() to authenticated;
grant execute on function public.sifre_deneme_sifirla() to authenticated;
