-- =====================================================================
-- ZİHİN SÖZLÜK · Göç 002 · Entry düzenleme/silme, dinamik gündem, dünün en beğenilenleri
-- Supabase Dashboard > SQL Editor > New query içine yapıştırıp bir kez çalıştır.
-- Tekrar çalıştırılabilir (idempotent) yazıldı.
-- =====================================================================


-- 1) Entry: düzenleme ve yumuşak silme alanları ------------------------

alter table public.entries
  add column if not exists edited_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles (id) on delete set null;

create index if not exists entries_active_idx
  on public.entries (topic_id, created_at)
  where deleted_at is null;

-- Sahibi kendi entry'sinin metnini düzenleyebilir ve silebilir.
grant update (content, edited_at, deleted_at, deleted_by) on public.entries to authenticated;

-- Silinen entry'ler kimseye görünmez; sadece yetkililer (çöp kutusu için) görebilir.
drop policy if exists "entryler herkese açık" on public.entries;
create policy "entryler herkese açık" on public.entries
  for select to anon, authenticated
  using (deleted_at is null or public.is_staff((select auth.uid())));


-- 2) Başlıklarda son entry zamanı --------------------------------------

alter table public.topics add column if not exists last_entry_at timestamptz;

create index if not exists topics_last_entry_idx
  on public.topics (last_entry_at desc nulls last);

-- Mevcut başlıklar için geçmişe dönük doldur.
update public.topics t
set last_entry_at = (
  select max(e.created_at) from public.entries e
  where e.topic_id = t.id and e.deleted_at is null
)
where t.last_entry_at is null;

-- Yeni entry başlığı gündemde en üste taşır.
create or replace function public.bump_topic_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- TUR 3 NOTU: çaylak yazarların entry'leri gündemi tetiklemeyecek.
  -- O kural geldiğinde buraya "if yazar çaylaksa return null; end if;" eklenecek.
  update public.topics
  set last_entry_at = greatest(coalesce(last_entry_at, new.created_at), new.created_at)
  where id = new.topic_id;
  return null;
end;
$$;

drop trigger if exists entries_bump_topic on public.entries;
create trigger entries_bump_topic
after insert on public.entries
for each row execute function public.bump_topic_activity();

-- Entry silinince (yumuşak ya da kalıcı) başlığın son entry zamanı yeniden hesaplanır.
create or replace function public.recalc_topic_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  target_topic bigint := coalesce(new.topic_id, old.topic_id);
begin
  update public.topics
  set last_entry_at = (
    select max(e.created_at) from public.entries e
    where e.topic_id = target_topic and e.deleted_at is null
  )
  where id = target_topic;
  return null;
end;
$$;

drop trigger if exists entries_recalc_topic on public.entries;
create trigger entries_recalc_topic
after update of deleted_at or delete on public.entries
for each row execute function public.recalc_topic_activity();


-- 3) Listeler: silinen entry'leri ve boş başlıkları dışarıda bırak -----

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
group by t.id;

create or replace function public.topics_for_day(day date)
returns table (title text, slug text, entry_count integer)
language sql stable set search_path = '' as $$
  select t.title, t.slug, count(*)::integer
  from public.entries e
  join public.topics t on t.id = e.topic_id
  where e.deleted_at is null
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
  where exists (select 1 from public.entries e where e.topic_id = t.id and e.deleted_at is null)
  order by random()
  limit 1;
$$;


-- 4) Dünün en beğenilenleri --------------------------------------------

create or replace function public.top_entries_yesterday()
returns table (
  entry_id bigint,
  topic_title text,
  topic_slug text,
  snippet text,
  upvotes integer
)
language sql stable set search_path = '' as $$
  select
    e.id,
    t.title,
    t.slug,
    left(e.content, 100),
    e.upvotes
  from public.entries e
  join public.topics t on t.id = e.topic_id
  where e.deleted_at is null
    and (e.created_at at time zone 'Europe/Istanbul')::date
      = ((now() at time zone 'Europe/Istanbul')::date - 1)
    and e.upvotes > 0
  order by e.upvotes desc, e.created_at desc
  limit 20;
$$;

grant execute on function public.top_entries_yesterday() to anon, authenticated;
