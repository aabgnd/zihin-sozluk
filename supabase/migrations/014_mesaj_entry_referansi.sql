-- 014: Mesajlarda entry referansi
--
-- Referans mesajin kendi verisinde durur, metnine yazilmaz. Boylece entry
-- sonradan duzenlense de referans bozulmaz ve hem gonderen hem alan ayni
-- karti gorur.
--
-- on delete set null: entry KALICI silinirse (mod_purge_entry) referans
-- bosa duser, mesaj kaybolmaz. Normal silmede satir durdugu icin referans
-- cozulmeye devam eder ve arayuz "entry silinmis" yazar.
--
-- Yetki notu: messages tablosunda insert kisitlanmamis (yalnizca update
-- kolon bazli kisitli), bu yuzden yeni kolon icin ek grant gerekmiyor.
--
-- Bu dosya yalnizca EKLER: yeni kolon, yeni index.

alter table public.messages
  add column if not exists entry_id bigint
    references public.entries (id) on delete set null;

create index if not exists messages_entry_idx
  on public.messages (entry_id)
  where entry_id is not null;
