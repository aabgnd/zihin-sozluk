-- =====================================================================
-- ZİHİN SÖZLÜK · Güncelleme 01
-- schema.sql'i daha önce çalıştırdıysan bu dosyayı SQL Editor'da BİR KEZ çalıştır.
--   1) Başlık artık sadece ilk entry ile birlikte açılır; entry'siz başlık oluşamaz.
--   2) Yeni özel mesaj gelince alıcıya bildirim düşer.
--   3) Veritabanında entry'siz kalmış başlıklar silinir.
-- =====================================================================


-- 1) Boş başlık oluşmasını engelle -------------------------------------

drop policy if exists "başlık aç" on public.topics;
revoke insert on public.topics from anon, authenticated;

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


-- 2) Mesaj bildirimi -----------------------------------------------------

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in ('upvote', 'favorite', 'reply', 'message'));

create or replace function public.notify_message() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, actor_id, type)
  values (new.receiver_id, new.sender_id, 'message');
  return null;
end;
$$;

drop trigger if exists messages_notify on public.messages;
create trigger messages_notify
after insert on public.messages
for each row execute function public.notify_message();


-- 3) Entry'siz başlıkları temizle ---------------------------------------

delete from public.topics t
where not exists (select 1 from public.entries e where e.topic_id = t.id);
