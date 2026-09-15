-- =====================================================================
-- ZİHİN SÖZLÜK · Supabase veritabanı kurulumu
-- Supabase Dashboard > SQL Editor > New query içine yapıştır ve "Run" de.
-- Boş bir projede bir kez çalıştırılmak üzere yazıldı.
-- =====================================================================


-- ---------------------------------------------------------------------
-- TABLOLAR
-- ---------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  email text,
  avatar_url text,
  role text not null default 'user' check (role in ('admin', 'mod', 'user')),
  generation text,
  title text,
  is_banned boolean not null default false,
  is_frozen boolean not null default false,
  allow_messages boolean not null default true,
  created_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9çğıöşü._ -]{3,30}$')
);
create unique index profiles_username_key on public.profiles (lower(username));

create table public.topics (
  id bigint generated always as identity primary key,
  title text not null check (char_length(title) between 1 and 100),
  slug text not null unique,
  youtube_url text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.entries (
  id bigint generated always as identity primary key,
  topic_id bigint not null references public.topics (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 10000),
  upvotes integer not null default 0,
  downvotes integer not null default 0,
  created_at timestamptz not null default now()
);
create index entries_topic_idx on public.entries (topic_id, created_at);
create index entries_user_idx on public.entries (user_id, created_at);

-- Aynı kişinin bir entry'ye birden fazla oy vermesini engeller; sayaçlar tetikleyiciyle güncellenir.
create table public.entry_votes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  entry_id bigint not null references public.entries (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (user_id, entry_id)
);

create table public.messages (
  id bigint generated always as identity primary key,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 5000),
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);
create index messages_receiver_idx on public.messages (receiver_id, is_read);
create index messages_pair_idx on public.messages (sender_id, receiver_id, created_at);

create table public.blocks (
  id bigint generated always as identity primary key,
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.favorites (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  entry_id bigint not null references public.entries (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, entry_id)
);

create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  type text not null check (type in ('upvote', 'favorite', 'reply', 'message')),
  entry_id bigint references public.entries (id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, is_read);


-- ---------------------------------------------------------------------
-- YARDIMCI FONKSİYONLAR (RLS içinde kullanılır)
-- ---------------------------------------------------------------------

create function public.is_active(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = uid and not is_banned);
$$;

create function public.can_write(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = uid and not is_banned and not is_frozen);
$$;

create function public.is_staff(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = uid and role in ('admin', 'mod') and not is_banned);
$$;

create function public.is_blocked_between(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;


-- ---------------------------------------------------------------------
-- TETİKLEYİCİLER
-- ---------------------------------------------------------------------

-- Kayıtta profil oluşturur. İlk 100 üye "1. Nesil – Kurucu Filozof" olur.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  member_count integer;
begin
  select count(*) into member_count from public.profiles;
  insert into public.profiles (id, username, email, generation, title)
  values (
    new.id,
    lower(trim(new.raw_user_meta_data ->> 'username')),
    new.email,
    case when member_count < 100 then '1. Nesil' end,
    case when member_count < 100 then 'Kurucu Filozof' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create function public.sync_entry_votes() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update public.entries set
      upvotes = upvotes - (case when old.value = 1 then 1 else 0 end),
      downvotes = downvotes - (case when old.value = -1 then 1 else 0 end)
    where id = old.entry_id;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    update public.entries set
      upvotes = upvotes + (case when new.value = 1 then 1 else 0 end),
      downvotes = downvotes + (case when new.value = -1 then 1 else 0 end)
    where id = new.entry_id;

    if new.value = 1 then
      insert into public.notifications (user_id, actor_id, type, entry_id)
      select e.user_id, new.user_id, 'upvote', e.id
      from public.entries e
      where e.id = new.entry_id and e.user_id <> new.user_id;
    end if;
  end if;

  return null;
end;
$$;

create trigger entry_votes_sync
after insert or update or delete on public.entry_votes
for each row execute function public.sync_entry_votes();

create function public.notify_favorite() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, actor_id, type, entry_id)
  select e.user_id, new.user_id, 'favorite', e.id
  from public.entries e
  where e.id = new.entry_id and e.user_id <> new.user_id;
  return null;
end;
$$;

create trigger favorites_notify
after insert on public.favorites
for each row execute function public.notify_favorite();

-- Başlığı açan kişiye, başlığına başkası entry girdiğinde bildirim gider.
create function public.notify_reply() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, actor_id, type, entry_id)
  select t.created_by, new.user_id, 'reply', new.id
  from public.topics t
  where t.id = new.topic_id and t.created_by is not null and t.created_by <> new.user_id;
  return null;
end;
$$;

create trigger entries_notify_reply
after insert on public.entries
for each row execute function public.notify_reply();

create function public.notify_message() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, actor_id, type)
  values (new.receiver_id, new.sender_id, 'message');
  return null;
end;
$$;

create trigger messages_notify
after insert on public.messages
for each row execute function public.notify_message();


-- ---------------------------------------------------------------------
-- KOLON YETKİLERİ
-- E-posta, rol, ban ve sayaç kolonlarını kullanıcılar doğrudan okuyamaz/değiştiremez.
-- ---------------------------------------------------------------------

revoke all on public.profiles from anon, authenticated;
grant select (id, username, avatar_url, role, generation, title, is_banned, is_frozen, allow_messages, created_at)
  on public.profiles to anon, authenticated;
grant update (avatar_url, allow_messages) on public.profiles to authenticated;

-- Başlıklar sadece create_topic_with_entry ile, ilk entry'yle birlikte açılır.
revoke insert, update on public.topics from anon, authenticated;

revoke insert, update on public.entries from anon, authenticated;
grant insert (topic_id, user_id, content) on public.entries to authenticated;
grant update (content) on public.entries to authenticated;

revoke update on public.messages from anon, authenticated;
grant update (is_read) on public.messages to authenticated;

revoke insert, update on public.notifications from anon, authenticated;
grant update (is_read) on public.notifications to authenticated;


-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.topics enable row level security;
alter table public.entries enable row level security;
alter table public.entry_votes enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.favorites enable row level security;
alter table public.notifications enable row level security;

-- profiles
create policy "profiller herkese açık" on public.profiles
  for select to anon, authenticated using (true);
create policy "kendi profilini düzenle" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- topics
create policy "başlıklar herkese açık" on public.topics
  for select to anon, authenticated using (true);
create policy "yetkili başlık siler" on public.topics
  for delete to authenticated using (public.is_staff((select auth.uid())));

-- entries
create policy "entryler herkese açık" on public.entries
  for select to anon, authenticated using (true);
create policy "entry yaz" on public.entries
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.can_write((select auth.uid())));
create policy "kendi entrysini düzenle" on public.entries
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.can_write((select auth.uid())));
create policy "entry sil" on public.entries
  for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_staff((select auth.uid())));

-- entry_votes
create policy "kendi oylarını gör" on public.entry_votes
  for select to authenticated using (user_id = (select auth.uid()));
create policy "oy ver" on public.entry_votes
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.can_write((select auth.uid()))
    and not exists (select 1 from public.entries e where e.id = entry_id and e.user_id = (select auth.uid()))
  );
create policy "oyunu değiştir" on public.entry_votes
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.can_write((select auth.uid())));
create policy "oyunu geri al" on public.entry_votes
  for delete to authenticated using (user_id = (select auth.uid()));

-- favorites
create policy "favoriler herkese açık" on public.favorites
  for select to anon, authenticated using (true);
create policy "favorile" on public.favorites
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_active((select auth.uid())));
create policy "favoriden çıkar" on public.favorites
  for delete to authenticated using (user_id = (select auth.uid()));

-- blocks
create policy "kendi engellerini gör" on public.blocks
  for select to authenticated using (blocker_id = (select auth.uid()));
create policy "engelle" on public.blocks
  for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy "engeli kaldır" on public.blocks
  for delete to authenticated using (blocker_id = (select auth.uid()));

-- messages: gönderen banlı/dondurulmuşsa, alıcı mesajlarını kapattıysa ya da engel varsa reddedilir.
create policy "kendi mesajlarını gör" on public.messages
  for select to authenticated
  using (sender_id = (select auth.uid()) or receiver_id = (select auth.uid()));
create policy "mesaj gönder" on public.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and public.can_write(sender_id)
    and exists (select 1 from public.profiles r where r.id = receiver_id and r.allow_messages and not r.is_banned)
    and not public.is_blocked_between(sender_id, receiver_id)
  );
create policy "gelen mesajı okundu yap" on public.messages
  for update to authenticated
  using (receiver_id = (select auth.uid()))
  with check (receiver_id = (select auth.uid()));

-- notifications
create policy "kendi bildirimlerini gör" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "bildirimi okundu yap" on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));


-- ---------------------------------------------------------------------
-- BAŞLIK AÇMA: başlık ve ilk entry tek işlemde yazılır, boş başlık oluşamaz
-- ---------------------------------------------------------------------

create function public.create_topic_with_entry(
  topic_title text,
  topic_slug text,
  entry_content text
)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  target_topic bigint;
begin
  if uid is null or not public.can_write(uid) then
    raise exception 'bu işlem için yazma iznin yok';
  end if;
  if topic_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception 'geçersiz başlık';
  end if;

  select id into target_topic from public.topics where slug = topic_slug;
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


-- ---------------------------------------------------------------------
-- YÖNETİM FONKSİYONLARI (/admin paneli bunları çağırır)
-- ---------------------------------------------------------------------

create function public.admin_list_users()
returns table (
  id uuid,
  username text,
  email text,
  role text,
  is_banned boolean,
  is_frozen boolean,
  created_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'bu işlem için yetkin yok';
  end if;
  return query
    select p.id, p.username, p.email, p.role, p.is_banned, p.is_frozen, p.created_at
    from public.profiles p
    order by p.created_at;
end;
$$;

-- Ban / dondurma / hesap açma. Mod, admin'e ve diğer modlara işlem yapamaz.
create function public.admin_set_status(target uuid, banned boolean, frozen boolean)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  actor_role text;
  target_role text;
begin
  select role into actor_role from public.profiles where id = auth.uid() and not is_banned;
  if actor_role is null or actor_role not in ('admin', 'mod') then
    raise exception 'bu işlem için yetkin yok';
  end if;

  select role into target_role from public.profiles where id = target;
  if target_role is null then
    raise exception 'kullanıcı bulunamadı';
  end if;

  if target = auth.uid() or target_role = 'admin' or (actor_role = 'mod' and target_role = 'mod') then
    raise exception 'bu hesap üzerinde işlem yapamazsın';
  end if;

  update public.profiles set is_banned = banned, is_frozen = frozen where id = target;
end;
$$;

-- Sadece admin mod atayabilir / geri alabilir.
create function public.admin_set_role(target uuid, new_role text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and not is_banned) then
    raise exception 'bu işlem için admin olmalısın';
  end if;
  if new_role not in ('mod', 'user') then
    raise exception 'geçersiz yetki';
  end if;
  if exists (select 1 from public.profiles where id = target and role = 'admin') then
    raise exception 'admin hesabının yetkisi değiştirilemez';
  end if;
  update public.profiles set role = new_role where id = target;
end;
$$;

revoke execute on function public.admin_list_users() from public, anon;
revoke execute on function public.admin_set_status(uuid, boolean, boolean) from public, anon;
revoke execute on function public.admin_set_role(uuid, text) from public, anon;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_status(uuid, boolean, boolean) to authenticated;
grant execute on function public.admin_set_role(uuid, text) to authenticated;


-- ---------------------------------------------------------------------
-- LİSTELER (gündem, bugün, dün, rastgele)
-- ---------------------------------------------------------------------

create view public.topic_stats with (security_invoker = true) as
select
  t.id,
  t.title,
  t.slug,
  t.created_at,
  count(e.id)::integer as entry_count,
  max(e.created_at) as last_entry_at
from public.topics t
left join public.entries e on e.topic_id = t.id
group by t.id;

create function public.topics_for_day(day date)
returns table (title text, slug text, entry_count integer)
language sql stable set search_path = '' as $$
  select t.title, t.slug, count(*)::integer
  from public.entries e
  join public.topics t on t.id = e.topic_id
  where (e.created_at at time zone 'Europe/Istanbul')::date = day
  group by t.id, t.title, t.slug
  order by max(e.created_at) desc
  limit 100;
$$;

create function public.random_topic_slug()
returns text
language sql volatile set search_path = '' as $$
  select slug from public.topics order by random() limit 1;
$$;


-- ---------------------------------------------------------------------
-- STORAGE: avatarlar (her kullanıcı sadece kendi klasörüne yazar: avatars/<user_id>/...)
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "avatarlar herkese açık" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "kendi avatarını yükle" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "kendi avatarını güncelle" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "kendi avatarını sil" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);


-- ---------------------------------------------------------------------
-- REALTIME: sayfa yenilemeden güncellenecek tablolar
-- ---------------------------------------------------------------------

alter publication supabase_realtime add table public.messages, public.notifications, public.entries;


-- ---------------------------------------------------------------------
-- İLK ADMİN: siteye kayıt olduktan sonra aşağıdaki satırı kendi kullanıcı adınla ayrıca çalıştır.
-- update public.profiles set role = 'admin' where username = 'kullanici_adin';
-- ---------------------------------------------------------------------
