-- =====================================================================
-- ZİHİN SÖZLÜK · Göç 003 · Çaylak sistemi, şikayet, moderasyon paneli
-- ÖNKOŞUL: 002_entry_duzenleme_silme_gundem.sql çalıştırılmış olmalı.
-- Supabase Dashboard > SQL Editor > New query içine yapıştırıp çalıştır.
-- Tekrar çalıştırılabilir (idempotent) yazıldı.
-- =====================================================================


-- 1) Profil: statü, susturma, yazarlık incelemesi -----------------------

alter table public.profiles
  add column if not exists status text not null default 'caylak',
  add column if not exists muted_until timestamptz,
  add column if not exists promoted_at timestamptz,
  add column if not exists promotion_baseline integer not null default 0;

do $$
begin
  alter table public.profiles
    add constraint profiles_status_check check (status in ('caylak', 'yazar'));
exception
  when duplicate_object then null;
end
$$;

-- Site yeni: mevcut üyelerin hepsi yazar sayılır.
update public.profiles
set status = 'yazar', promoted_at = coalesce(promoted_at, now())
where status <> 'yazar';

-- Statü herkese açık (entry'de "çaylak" etiketi için).
-- muted_until ve promotion_baseline kimseye açılmaz; sadece fonksiyonlarla okunur.
grant select (status) on public.profiles to anon, authenticated;

-- Yazarlık barajı tek yerde durur.
create or replace function public.writer_entry_threshold() returns integer
language sql immutable set search_path = '' as $$
  select 5;
$$;
grant execute on function public.writer_entry_threshold() to anon, authenticated;


-- 2) Yetki yardımcıları -------------------------------------------------

-- Yazma izni: banlı, dondurulmuş ve susturulmuş hesaplar yazamaz.
create or replace function public.can_write(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = uid
      and not is_banned
      and not is_frozen
      and (muted_until is null or muted_until <= now())
  );
$$;

-- Yazar yetkisi: çaylaklar başlık açamaz ve mesaj gönderemez.
create or replace function public.is_writer(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = uid
      and not is_banned
      and (status = 'yazar' or role in ('admin', 'mod'))
  );
$$;

-- Kendi hesabının durumu (susturma bilgisi dışarı sızmasın diye fonksiyonla).
create or replace function public.my_account()
returns table (
  status text,
  muted_until timestamptz,
  promoted_at timestamptz,
  review_entry_count integer,
  writer_threshold integer
)
language sql stable security definer set search_path = '' as $$
  select
    p.status,
    p.muted_until,
    p.promoted_at,
    greatest(
      (select count(*)::integer from public.entries e where e.user_id = p.id and e.deleted_at is null)
        - p.promotion_baseline,
      0
    ),
    public.writer_entry_threshold()
  from public.profiles p
  where p.id = auth.uid();
$$;
grant execute on function public.my_account() to authenticated;


-- 3) Başlıklarda yumuşak silme -----------------------------------------

alter table public.topics
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles (id) on delete set null;

drop policy if exists "başlıklar herkese açık" on public.topics;
create policy "başlıklar herkese açık" on public.topics
  for select to anon, authenticated
  using (deleted_at is null or public.is_staff((select auth.uid())));


-- 4) Şikayetler ve moderasyon kaydı ------------------------------------

create table if not exists public.reports (
  id bigint generated always as identity primary key,
  entry_id bigint not null references public.entries (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (reason in ('kufur_hakaret', 'spam_reklam', 'tehdit', 'kural_disi', 'diger')),
  note text check (note is null or char_length(note) <= 300),
  status text not null default 'acik' check (status in ('acik', 'islem_yapildi', 'reddedildi')),
  handled_by uuid references public.profiles (id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  unique (entry_id, reporter_id)
);
create index if not exists reports_status_idx on public.reports (status, created_at desc);

create table if not exists public.mod_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_user_id uuid references public.profiles (id) on delete set null,
  target_entry_id bigint,
  target_topic_id bigint,
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists mod_log_created_idx on public.mod_log (created_at desc);

alter table public.reports enable row level security;
alter table public.mod_log enable row level security;

-- Bu iki tabloya doğrudan erişim yok; her şey aşağıdaki fonksiyonlardan geçer.
revoke all on public.reports from anon, authenticated;
revoke all on public.mod_log from anon, authenticated;

-- Yazarlık onayı bildirimi için yeni bildirim tipi.
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in ('upvote', 'favorite', 'reply', 'message', 'yazarlik'));


-- 5) Moderasyon altyapısı ----------------------------------------------

create or replace function public.require_staff() returns text
language plpgsql stable security definer set search_path = '' as $$
declare
  actor_role text;
begin
  select role into actor_role from public.profiles where id = auth.uid() and not is_banned;
  if actor_role is null or actor_role not in ('admin', 'mod') then
    raise exception 'bu işlem için yetkin yok';
  end if;
  return actor_role;
end;
$$;

create or replace function public.write_mod_log(
  action text,
  target_user uuid,
  target_entry bigint,
  target_topic bigint,
  detail text
) returns void
language sql security definer set search_path = '' as $$
  insert into public.mod_log (actor_id, action, target_user_id, target_entry_id, target_topic_id, detail)
  values (auth.uid(), action, target_user, target_entry, target_topic, detail);
$$;

-- Moderatör; admin'e, kendine ve diğer moderatörlere işlem yapamaz.
create or replace function public.mod_guard_target(target uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  actor_role text := public.require_staff();
  target_role text;
begin
  select role into target_role from public.profiles where id = target;
  if target_role is null then
    raise exception 'kullanıcı bulunamadı';
  end if;
  if target = auth.uid() or target_role = 'admin' or (actor_role = 'mod' and target_role = 'mod') then
    raise exception 'bu hesap üzerinde işlem yapamazsın';
  end if;
end;
$$;

revoke execute on function public.require_staff() from public, anon, authenticated;
revoke execute on function public.write_mod_log(text, uuid, bigint, bigint, text) from public, anon, authenticated;
revoke execute on function public.mod_guard_target(uuid) from public, anon, authenticated;


-- 6) Şikayet gönderme ---------------------------------------------------

create or replace function public.report_entry(
  target_entry bigint,
  report_reason text,
  report_note text default null
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  author uuid;
begin
  if uid is null then raise exception 'giriş yapmalısın'; end if;
  if not public.is_active(uid) then raise exception 'bu işlem için yetkin yok'; end if;

  select user_id into author from public.entries where id = target_entry and deleted_at is null;
  if author is null then raise exception 'entry bulunamadı'; end if;
  if author = uid then raise exception 'kendi entryni şikayet edemezsin'; end if;

  insert into public.reports (entry_id, reporter_id, reason, note)
  values (target_entry, uid, report_reason, nullif(trim(coalesce(report_note, '')), ''));
end;
$$;
revoke execute on function public.report_entry(bigint, text, text) from public, anon;
grant execute on function public.report_entry(bigint, text, text) to authenticated;


-- 7) Entry ve başlık moderasyonu ---------------------------------------

create or replace function public.mod_delete_entry(target_entry bigint, detail text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_staff();
  update public.entries
  set deleted_at = now(), deleted_by = auth.uid()
  where id = target_entry and deleted_at is null;

  update public.reports
  set status = 'islem_yapildi', handled_by = auth.uid(), handled_at = now()
  where entry_id = target_entry and status = 'acik';

  perform public.write_mod_log('entry_silindi', null, target_entry, null, detail);
end;
$$;

create or replace function public.mod_restore_entry(target_entry bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_staff();
  update public.entries set deleted_at = null, deleted_by = null where id = target_entry;
  perform public.write_mod_log('entry_geri_yuklendi', null, target_entry, null, null);
end;
$$;

create or replace function public.mod_purge_entry(target_entry bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if public.require_staff() <> 'admin' then
    raise exception 'kalıcı silme sadece admin yetkisinde';
  end if;
  delete from public.entries where id = target_entry;
  perform public.write_mod_log('entry_kalici_silindi', null, target_entry, null, null);
end;
$$;

create or replace function public.mod_delete_topic(target_topic bigint, detail text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_staff();
  update public.topics
  set deleted_at = now(), deleted_by = auth.uid()
  where id = target_topic and deleted_at is null;
  perform public.write_mod_log('baslik_silindi', null, null, target_topic, detail);
end;
$$;

create or replace function public.mod_restore_topic(target_topic bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_staff();
  update public.topics set deleted_at = null, deleted_by = null where id = target_topic;
  perform public.write_mod_log('baslik_geri_yuklendi', null, null, target_topic, null);
end;
$$;

create or replace function public.mod_purge_topic(target_topic bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if public.require_staff() <> 'admin' then
    raise exception 'kalıcı silme sadece admin yetkisinde';
  end if;
  delete from public.topics where id = target_topic;
  perform public.write_mod_log('baslik_kalici_silindi', null, null, target_topic, null);
end;
$$;


-- 8) Kullanıcı moderasyonu ---------------------------------------------

create or replace function public.mod_mute(target uuid, until timestamptz)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.mod_guard_target(target);
  update public.profiles set muted_until = until where id = target;
  perform public.write_mod_log('susturuldu', target, null, null, coalesce(until::text, 'süresiz'));
end;
$$;

create or replace function public.mod_unmute(target uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.mod_guard_target(target);
  update public.profiles set muted_until = null where id = target;
  perform public.write_mod_log('susturma_kaldirildi', target, null, null, null);
end;
$$;

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
  end if;

  perform public.write_mod_log(
    case when new_status = 'yazar' then 'yazar_yapildi' else 'caylaga_dusuruldu' end,
    target, null, null, null
  );
end;
$$;

-- "Çaylak kalsın": sayaç sıfırlanır, 5 yeni entry sonra tekrar listeye düşer.
create or replace function public.mod_decline_writer(target uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  active_entries integer;
begin
  perform public.mod_guard_target(target);
  select count(*)::integer into active_entries
  from public.entries where user_id = target and deleted_at is null;

  update public.profiles set promotion_baseline = active_entries where id = target;
  perform public.write_mod_log('yazarlik_ertelendi', target, null, null, null);
end;
$$;

-- Mevcut ban/dondurma fonksiyonuna kayıt tutma eklendi.
create or replace function public.admin_set_status(target uuid, banned boolean, frozen boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.mod_guard_target(target);
  update public.profiles set is_banned = banned, is_frozen = frozen where id = target;
  perform public.write_mod_log(
    'hesap_durumu',
    target, null, null,
    'banlı=' || banned::text || ' donduruldu=' || frozen::text
  );
end;
$$;


-- 9) Panel listeleri ----------------------------------------------------

create or replace function public.mod_list_reports(report_status text default 'acik')
returns table (
  entry_id bigint,
  topic_title text,
  topic_slug text,
  author_id uuid,
  author_username text,
  author_status text,
  content text,
  entry_deleted boolean,
  report_count integer,
  reasons text[],
  notes text[],
  last_report_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_staff();
  return query
    select
      e.id,
      t.title,
      t.slug,
      p.id,
      p.username,
      p.status,
      e.content,
      e.deleted_at is not null,
      count(*)::integer,
      array_agg(distinct r.reason),
      array_remove(array_agg(r.note), null),
      max(r.created_at)
    from public.reports r
    join public.entries e on e.id = r.entry_id
    join public.topics t on t.id = e.topic_id
    join public.profiles p on p.id = e.user_id
    where r.status = report_status
    group by e.id, t.title, t.slug, p.id, p.username, p.status, e.content, e.deleted_at
    order by max(r.created_at) desc
    limit 100;
end;
$$;

create or replace function public.mod_handle_report(target_entry bigint, decision text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.require_staff();
  if decision not in ('islem_yapildi', 'reddedildi') then
    raise exception 'geçersiz karar';
  end if;

  update public.reports
  set status = decision, handled_by = auth.uid(), handled_at = now()
  where entry_id = target_entry and status = 'acik';

  perform public.write_mod_log('sikayet_' || decision, null, target_entry, null, null);
end;
$$;

create or replace function public.mod_pending_writers()
returns table (id uuid, username text, entry_count integer, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_staff();
  return query
    select p.id, p.username, count(e.id)::integer, p.created_at
    from public.profiles p
    join public.entries e on e.user_id = p.id and e.deleted_at is null
    where p.status = 'caylak' and not p.is_banned
    group by p.id, p.username, p.created_at, p.promotion_baseline
    having count(e.id) - p.promotion_baseline >= public.writer_entry_threshold()
    order by max(e.created_at);
end;
$$;

create or replace function public.mod_user_entries(target uuid)
returns table (id bigint, content text, topic_title text, topic_slug text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_staff();
  return query
    select e.id, e.content, t.title, t.slug, e.created_at
    from public.entries e
    join public.topics t on t.id = e.topic_id
    where e.user_id = target and e.deleted_at is null
    order by e.created_at desc
    limit 50;
end;
$$;

create or replace function public.mod_list_users(search text default '')
returns table (
  id uuid,
  username text,
  email text,
  role text,
  status text,
  is_banned boolean,
  is_frozen boolean,
  muted_until timestamptz,
  entry_count integer,
  created_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_staff();
  return query
    select
      p.id, p.username, p.email, p.role, p.status, p.is_banned, p.is_frozen, p.muted_until,
      (select count(*)::integer from public.entries e where e.user_id = p.id and e.deleted_at is null),
      p.created_at
    from public.profiles p
    where search = '' or p.username ilike '%' || search || '%' or p.email ilike '%' || search || '%'
    order by p.created_at desc
    limit 200;
end;
$$;

create or replace function public.mod_trash()
returns table (
  kind text,
  id bigint,
  title text,
  slug text,
  content text,
  author_username text,
  deleted_at timestamptz,
  deleted_by_username text
)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_staff();
  return query
    select
      'baslik'::text, t.id, t.title, t.slug, null::text, null::text, t.deleted_at, d.username
    from public.topics t
    left join public.profiles d on d.id = t.deleted_by
    where t.deleted_at is not null
    union all
    select
      'entry'::text, e.id, t.title, t.slug, e.content, p.username, e.deleted_at, d.username
    from public.entries e
    join public.topics t on t.id = e.topic_id
    join public.profiles p on p.id = e.user_id
    left join public.profiles d on d.id = e.deleted_by
    where e.deleted_at is not null and e.deleted_by is not null and e.deleted_by <> e.user_id
    order by 7 desc
    limit 200;
end;
$$;

create or replace function public.mod_log_list()
returns table (
  id bigint,
  actor_username text,
  action text,
  target_username text,
  target_entry_id bigint,
  target_topic_id bigint,
  detail text,
  created_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.require_staff();
  return query
    select l.id, a.username, l.action, t.username, l.target_entry_id, l.target_topic_id, l.detail, l.created_at
    from public.mod_log l
    left join public.profiles a on a.id = l.actor_id
    left join public.profiles t on t.id = l.target_user_id
    order by l.created_at desc
    limit 200;
end;
$$;

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.mod_delete_entry(bigint, text)',
    'public.mod_restore_entry(bigint)',
    'public.mod_purge_entry(bigint)',
    'public.mod_delete_topic(bigint, text)',
    'public.mod_restore_topic(bigint)',
    'public.mod_purge_topic(bigint)',
    'public.mod_mute(uuid, timestamptz)',
    'public.mod_unmute(uuid)',
    'public.mod_set_status(uuid, text)',
    'public.mod_decline_writer(uuid)',
    'public.mod_list_reports(text)',
    'public.mod_handle_report(bigint, text)',
    'public.mod_pending_writers()',
    'public.mod_user_entries(uuid)',
    'public.mod_list_users(text)',
    'public.mod_trash()',
    'public.mod_log_list()'
  ] loop
    execute format('revoke execute on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end
$$;


-- 10) Çaylak kuralları: başlık açma, mesaj, gündem ---------------------

create or replace function public.create_topic_with_entry(
  topic_title text,
  topic_slug text,
  entry_content text
)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  target_topic bigint;
  topic_deleted timestamptz;
begin
  if uid is null or not public.can_write(uid) then
    raise exception 'bu işlem için yazma iznin yok';
  end if;
  if not public.is_writer(uid) then
    raise exception 'çaylaklar yeni başlık açamaz';
  end if;
  if topic_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'geçersiz başlık';
  end if;

  select id, deleted_at into target_topic, topic_deleted
  from public.topics where slug = topic_slug;

  if target_topic is not null and topic_deleted is not null then
    raise exception 'bu başlık yönetim tarafından kaldırıldı';
  end if;

  if target_topic is null then
    insert into public.topics (title, slug, created_by)
    values (topic_title, topic_slug, uid)
    returning id into target_topic;
  end if;

  insert into public.entries (topic_id, user_id, content)
  values (target_topic, uid, entry_content);

  return topic_slug;
end;
$$;

revoke execute on function public.create_topic_with_entry(text, text, text) from public, anon;
grant execute on function public.create_topic_with_entry(text, text, text) to authenticated;

-- Çaylaklar mesaj gönderemez.
drop policy if exists "mesaj gönder" on public.messages;
create policy "mesaj gönder" on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and public.can_write(sender_id)
    and public.is_writer(sender_id)
    and exists (select 1 from public.profiles r where r.id = receiver_id and r.allow_messages and not r.is_banned)
    and not public.is_blocked_between(sender_id, receiver_id)
  );

-- Çaylak entry'si başlığı gündemde yukarı taşımaz.
create or replace function public.bump_topic_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_writer(new.user_id) then
    return null;
  end if;

  update public.topics
  set last_entry_at = greatest(coalesce(last_entry_at, new.created_at), new.created_at)
  where id = new.topic_id;
  return null;
end;
$$;


-- 11) Listelerden silinmiş başlıkları çıkar ----------------------------

drop view if exists public.topic_stats;
create view public.topic_stats with (security_invoker = true) as
select
  t.id,
  t.title,
  t.slug,
  t.created_at,
  t.last_entry_at,
  count(e.id)::integer as entry_count,
  count(e.id) filter (
    where (e.created_at at time zone 'Europe/Istanbul')::date
      = (now() at time zone 'Europe/Istanbul')::date
  )::integer as today_count
from public.topics t
left join public.entries e on e.topic_id = t.id and e.deleted_at is null
where t.deleted_at is null
group by t.id;

create or replace function public.topics_for_day(day date)
returns table (title text, slug text, entry_count integer)
language sql stable set search_path = '' as $$
  select t.title, t.slug, count(*)::integer
  from public.entries e
  join public.topics t on t.id = e.topic_id
  where e.deleted_at is null
    and t.deleted_at is null
    and (e.created_at at time zone 'Europe/Istanbul')::date = day
  group by t.id, t.title, t.slug
  order by max(e.created_at) desc
  limit 100;
$$;

create or replace function public.random_topic_slug()
returns text
language sql volatile set search_path = '' as $$
  select t.slug
  from public.topics t
  where t.deleted_at is null
    and exists (select 1 from public.entries e where e.topic_id = t.id and e.deleted_at is null)
  order by random()
  limit 1;
$$;

create or replace function public.top_entries_yesterday()
returns table (
  entry_id bigint,
  topic_title text,
  topic_slug text,
  snippet text,
  upvotes integer
)
language sql stable set search_path = '' as $$
  select e.id, t.title, t.slug, left(e.content, 100), e.upvotes
  from public.entries e
  join public.topics t on t.id = e.topic_id
  where e.deleted_at is null
    and t.deleted_at is null
    and (e.created_at at time zone 'Europe/Istanbul')::date
      = ((now() at time zone 'Europe/Istanbul')::date - 1)
    and e.upvotes > 0
  order by e.upvotes desc, e.created_at desc
  limit 20;
$$;
