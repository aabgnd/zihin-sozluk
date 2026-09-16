-- =====================================================================
-- ZİHİN SÖZLÜK · Göç 004 · Takip sistemi, rozetler, zihin özet, yeni bildirimler
-- ÖNKOŞUL: 002 ve 003 çalıştırılmış olmalı.
-- Supabase Dashboard > SQL Editor > New query içine yapıştırıp çalıştır.
-- Tekrar çalıştırılabilir (idempotent) yazıldı.
-- =====================================================================


-- 1) Yeni bildirim türleri ---------------------------------------------

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'upvote', 'favorite', 'reply', 'message', 'yazarlik',
    'takip', 'rozet', 'entry_silindi', 'susturma'
  ));


-- 2) Takip sistemi ------------------------------------------------------

create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists follows_following_idx on public.follows (following_id);

alter table public.follows enable row level security;

drop policy if exists "takipler herkese açık" on public.follows;
create policy "takipler herkese açık" on public.follows
  for select to anon, authenticated using (true);

-- Engelli kişiler birbirini takip edemez; banlı hesap takip edilemez.
drop policy if exists "takip et" on public.follows;
create policy "takip et" on public.follows
  for insert to authenticated
  with check (
    follower_id = (select auth.uid())
    and follower_id <> following_id
    and public.is_active(follower_id)
    and not public.is_blocked_between(follower_id, following_id)
    and exists (select 1 from public.profiles p where p.id = following_id and not p.is_banned)
  );

drop policy if exists "takipten çık" on public.follows;
create policy "takipten çık" on public.follows
  for delete to authenticated using (follower_id = (select auth.uid()));

-- Engelleme yapılınca aradaki takip iki yönde de kalkar.
create or replace function public.remove_follow_on_block() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.follows
  where (follower_id = new.blocker_id and following_id = new.blocked_id)
     or (follower_id = new.blocked_id and following_id = new.blocker_id);
  return null;
end;
$$;

drop trigger if exists blocks_remove_follow on public.blocks;
create trigger blocks_remove_follow
after insert on public.blocks
for each row execute function public.remove_follow_on_block();

create or replace function public.notify_follow() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, actor_id, type)
  values (new.following_id, new.follower_id, 'takip');
  return null;
end;
$$;

drop trigger if exists follows_notify on public.follows;
create trigger follows_notify
after insert on public.follows
for each row execute function public.notify_follow();


-- 3) Rozetler -----------------------------------------------------------

create table if not exists public.user_badges (
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge text not null check (badge in ('cirak', 'dusunur', 'bilge_yazar', 'ilk_nesil_filozof')),
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge)
);

alter table public.user_badges enable row level security;

drop policy if exists "rozetler herkese açık" on public.user_badges;
create policy "rozetler herkese açık" on public.user_badges
  for select to anon, authenticated using (true);

-- Rozet yazma yetkisi kimsede yok; sadece aşağıdaki fonksiyon dağıtır.
revoke insert, update, delete on public.user_badges from anon, authenticated;

-- TÜM EŞİKLER BURADA. Değiştirmek için sadece bu fonksiyonu güncelle.
create or replace function public.badge_config()
returns table (
  dusunur_entry integer,
  bilge_entry integer,
  bilge_upvote integer,
  ilk_nesil_limit integer
)
language sql immutable set search_path = '' as $$
  select 25, 100, 250, 1000;
$$;
grant execute on function public.badge_config() to anon, authenticated;

create or replace function public.award_badges(target uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  cfg record;
  entry_count integer;
  upvote_total integer;
  target_status text;
  join_rank integer;
begin
  if target is null then return; end if;
  select * into cfg from public.badge_config();

  select count(*)::integer, coalesce(sum(e.upvotes), 0)::integer
  into entry_count, upvote_total
  from public.entries e
  where e.user_id = target and e.deleted_at is null;

  select p.status into target_status from public.profiles p where p.id = target;
  if target_status is null then return; end if;

  -- Çırak: yazar statüsüne yükseltilenlere.
  if target_status = 'yazar' then
    insert into public.user_badges (user_id, badge) values (target, 'cirak')
    on conflict do nothing;
  end if;

  -- Düşünür
  if entry_count >= cfg.dusunur_entry then
    insert into public.user_badges (user_id, badge) values (target, 'dusunur')
    on conflict do nothing;
  end if;

  -- Bilge Yazar
  if entry_count >= cfg.bilge_entry and upvote_total >= cfg.bilge_upvote then
    insert into public.user_badges (user_id, badge) values (target, 'bilge_yazar')
    on conflict do nothing;
  end if;

  -- 1. Nesil Filozof: kayıt sırasına göre ilk N kişi.
  select count(*) + 1 into join_rank
  from public.profiles p2
  where p2.created_at < (select p3.created_at from public.profiles p3 where p3.id = target);

  if join_rank <= cfg.ilk_nesil_limit then
    insert into public.user_badges (user_id, badge) values (target, 'ilk_nesil_filozof')
    on conflict do nothing;
  end if;
end;
$$;

create or replace function public.notify_badge() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, actor_id, type)
  values (new.user_id, null, 'rozet');
  return null;
end;
$$;

drop trigger if exists user_badges_notify on public.user_badges;
create trigger user_badges_notify
after insert on public.user_badges
for each row execute function public.notify_badge();

-- Entry yazılınca ve oy sayısı değişince rozet kontrolü.
create or replace function public.award_badges_for_entry() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.award_badges(new.user_id);
  return null;
end;
$$;

drop trigger if exists entries_award_badges on public.entries;
create trigger entries_award_badges
after insert or update of upvotes, deleted_at on public.entries
for each row execute function public.award_badges_for_entry();

-- Kayıt olan yeni üyeye 1. Nesil Filozof rozetini ver.
create or replace function public.award_badges_for_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.award_badges(new.id);
  return null;
end;
$$;

drop trigger if exists profiles_award_badges on public.profiles;
create trigger profiles_award_badges
after insert on public.profiles
for each row execute function public.award_badges_for_profile();

-- Mevcut üyeler için bir kerelik doldurma.
do $$
declare
  member record;
begin
  for member in select id from public.profiles loop
    perform public.award_badges(member.id);
  end loop;
end
$$;


-- 4) Yazarlığa yükseltme rozeti + moderasyon bildirimleri --------------

create or replace function public.mod_set_status(target uuid, new_status text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  active_entries integer;
begin
  perform public.mod_guard_target(target);
  if new_status not in ('caylak', 'yazar') then
    raise exception 'geçersiz statü';
  end if;

  select count(*)::integer into active_entries
  from public.entries where user_id = target and deleted_at is null;

  update public.profiles
  set status = new_status,
      promoted_at = case when new_status = 'yazar' then now() else promoted_at end,
      promotion_baseline = case when new_status = 'caylak' then active_entries else promotion_baseline end
  where id = target;

  if new_status = 'yazar' then
    insert into public.notifications (user_id, actor_id, type)
    values (target, auth.uid(), 'yazarlik');
    perform public.award_badges(target);
  end if;

  perform public.write_mod_log(
    case when new_status = 'yazar' then 'yazar_yapildi' else 'caylaga_dusuruldu' end,
    target, null, null, null
  );
end;
$$;

-- Entry'si silinen kullanıcıya bildirim.
create or replace function public.mod_delete_entry(target_entry bigint, detail text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  entry_owner uuid;
begin
  perform public.require_staff();

  select user_id into entry_owner from public.entries where id = target_entry and deleted_at is null;

  update public.entries
  set deleted_at = now(), deleted_by = auth.uid()
  where id = target_entry and deleted_at is null;

  update public.reports
  set status = 'islem_yapildi', handled_by = auth.uid(), handled_at = now()
  where entry_id = target_entry and status = 'acik';

  if entry_owner is not null and entry_owner <> auth.uid() then
    insert into public.notifications (user_id, actor_id, type, entry_id)
    values (entry_owner, auth.uid(), 'entry_silindi', target_entry);
  end if;

  perform public.write_mod_log('entry_silindi', entry_owner, target_entry, null, detail);
end;
$$;

-- Susturulan kullanıcıya bildirim.
create or replace function public.mod_mute(target uuid, until timestamptz)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.mod_guard_target(target);
  update public.profiles set muted_until = until where id = target;

  insert into public.notifications (user_id, actor_id, type)
  values (target, auth.uid(), 'susturma');

  perform public.write_mod_log('susturuldu', target, null, null, coalesce(until::text, 'süresiz'));
end;
$$;


-- 5) Profil istatistikleri ve Zihin Özet -------------------------------

create or replace function public.profile_stats(target uuid)
returns table (
  entry_count integer,
  upvote_total integer,
  follower_count integer,
  following_count integer
)
language sql stable set search_path = '' as $$
  select
    (select count(*)::integer from public.entries e where e.user_id = target and e.deleted_at is null),
    (select coalesce(sum(e.upvotes), 0)::integer from public.entries e where e.user_id = target and e.deleted_at is null),
    (select count(*)::integer from public.follows f where f.following_id = target),
    (select count(*)::integer from public.follows f where f.follower_id = target);
$$;
grant execute on function public.profile_stats(uuid) to anon, authenticated;

-- period: 'ay' (bu ay) ya da 'yil' (bu yıl). Kategori alanı olmadığı için
-- "en çok yazdığı kategori" yerine "en çok entry yazdığı başlık" döner.
create or replace function public.profile_summary(target uuid, period text)
returns table (
  entry_count integer,
  top_entry_id bigint,
  top_entry_snippet text,
  top_entry_upvotes integer,
  top_entry_slug text,
  top_topic_title text,
  top_topic_slug text,
  top_topic_count integer
)
language plpgsql stable set search_path = '' as $$
declare
  since timestamptz;
begin
  since := case
    when period = 'yil' then date_trunc('year', (now() at time zone 'Europe/Istanbul'))
    else date_trunc('month', (now() at time zone 'Europe/Istanbul'))
  end at time zone 'Europe/Istanbul';

  return query
  with mine as (
    select e.id, e.content, e.upvotes, e.created_at, t.title as topic_title, t.slug as topic_slug
    from public.entries e
    join public.topics t on t.id = e.topic_id
    where e.user_id = target
      and e.deleted_at is null
      and t.deleted_at is null
      and e.created_at >= since
  ),
  top_entry as (
    select m.id, left(m.content, 150) as snippet, m.upvotes, m.topic_slug
    from mine m
    order by m.upvotes desc, m.created_at desc
    limit 1
  ),
  top_topic as (
    select m.topic_title, m.topic_slug, count(*)::integer as topic_count
    from mine m
    group by m.topic_title, m.topic_slug
    order by count(*) desc
    limit 1
  )
  select
    (select count(*)::integer from mine),
    te.id, te.snippet, te.upvotes, te.topic_slug,
    tt.topic_title, tt.topic_slug, tt.topic_count
  from (select 1) anchor
  left join top_entry te on true
  left join top_topic tt on true;
end;
$$;
grant execute on function public.profile_summary(uuid, text) to anon, authenticated;


-- 6) Takip ve rozet tabloları canlı yayına eklensin ---------------------

do $$
begin
  alter publication supabase_realtime add table public.follows;
exception when duplicate_object then null;
end
$$;

do $$
begin
  alter publication supabase_realtime add table public.user_badges;
exception when duplicate_object then null;
end
$$;
