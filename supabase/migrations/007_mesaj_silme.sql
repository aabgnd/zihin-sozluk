-- 007: Mesaj silme
--
-- Silme yalnizca silen kisinin tarafinda gecerlidir: gercek satir durur,
-- her kullanici icin ayri bir "silindi" damgasi tutulur. Karsi taraf kendi
-- kopyasini gormeye devam eder.
--
-- Bu dosya yalnizca EKLER: yeni kolon, yeni index, yeni fonksiyon.
-- Kolon silme, yeniden adlandirma ya da veri guncelleme yoktur.

alter table public.messages
  add column if not exists sender_deleted_at timestamptz,
  add column if not exists receiver_deleted_at timestamptz;

-- Mesaj kutusu ve sohbet sorgulari bu iki yonu tarar.
create index if not exists messages_sender_created_idx
  on public.messages (sender_id, created_at desc);

create index if not exists messages_receiver_created_idx
  on public.messages (receiver_id, created_at desc);

-- Tek mesaji, yalnizca cagiran kisinin tarafinda siler.
create or replace function public.delete_message(target bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.messages
     set sender_deleted_at =
           case when sender_id = auth.uid() then now() else sender_deleted_at end,
         receiver_deleted_at =
           case when receiver_id = auth.uid() then now() else receiver_deleted_at end
   where id = target
     and (sender_id = auth.uid() or receiver_id = auth.uid());
end;
$$;

-- Bir kisiyle olan tum yazismayi, yalnizca cagiran kisinin tarafinda siler.
create or replace function public.delete_conversation(other uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.messages
     set sender_deleted_at =
           case when sender_id = auth.uid() then now() else sender_deleted_at end,
         receiver_deleted_at =
           case when receiver_id = auth.uid() then now() else receiver_deleted_at end
   where (sender_id = auth.uid() and receiver_id = other)
      or (sender_id = other and receiver_id = auth.uid());
end;
$$;

revoke all on function public.delete_message(bigint) from public;
revoke all on function public.delete_conversation(uuid) from public;
grant execute on function public.delete_message(bigint) to authenticated;
grant execute on function public.delete_conversation(uuid) to authenticated;
