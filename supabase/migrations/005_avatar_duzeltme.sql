-- =====================================================================
-- ZİHİN SÖZLÜK · Göç 005 · Avatar düzeltmesi
-- Bucket sınırı 2 MB'a çıkarılır, Storage kuralları yeniden kurulur.
-- Supabase Dashboard > SQL Editor > New query içine yapıştırıp çalıştır.
-- Tekrar çalıştırılabilir (idempotent) yazıldı.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = true,
    file_size_limit = 2097152,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];


-- Kurallar: herkes avatarları görebilir, herkes sadece kendi klasörüne
-- (avatars/<kullanıcı id>/...) yazabilir, güncelleyebilir ve silebilir.

drop policy if exists "avatarlar herkese açık" on storage.objects;
create policy "avatarlar herkese açık" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "kendi avatarını yükle" on storage.objects;
create policy "kendi avatarını yükle" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "kendi avatarını güncelle" on storage.objects;
create policy "kendi avatarını güncelle" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "kendi avatarını sil" on storage.objects;
create policy "kendi avatarını sil" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
