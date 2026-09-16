-- 008: Performans indexleri
--
-- Bu dosya yalnizca EKLER: yeni index. Veri, kolon ya da politika degismez.
-- Hepsi "if not exists" oldugu icin tekrar calistirilabilir.

-- Baslik sayfasi: entry'ler basliga gore, tarihe gore siralanir.
create index if not exists entries_topic_created_idx
  on public.entries (topic_id, created_at desc)
  where deleted_at is null;

-- Baslik sayfasinda "en begenilen" siralamasi.
create index if not exists entries_topic_upvotes_idx
  on public.entries (topic_id, upvotes desc)
  where deleted_at is null;

-- Profil sayfasi ve ana sayfadaki "son entry'ler".
create index if not exists entries_user_created_idx
  on public.entries (user_id, created_at desc)
  where deleted_at is null;

create index if not exists entries_created_idx
  on public.entries (created_at desc)
  where deleted_at is null;

-- Bildirim kutusu.
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

-- Okunmamis bildirim sayaci (header'da her sayfada calisir).
create index if not exists notifications_unread_idx
  on public.notifications (user_id)
  where is_read = false;

-- Okunmamis mesaj sayaci (header'da her sayfada calisir).
create index if not exists messages_unread_idx
  on public.messages (receiver_id)
  where is_read = false;

-- Favori sekmesi.
create index if not exists favorites_user_created_idx
  on public.favorites (user_id, created_at desc);

-- Takipci / takip edilen listeleri.
create index if not exists follows_following_idx
  on public.follows (following_id, created_at desc);

create index if not exists follows_follower_idx
  on public.follows (follower_id, created_at desc);
