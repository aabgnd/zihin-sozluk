-- =====================================================================
-- ZİHİN SÖZLÜK · Göç 006 · Kullanıcı entry sayıları (takipçi listeleri için)
-- SADECE EKLEYİCİ: yeni bir fonksiyon tanımlar. Tablo, kolon ya da veri
-- silmez, değiştirmez.
-- Takipçi / takip edilen kartlarında rütbe ve entry sayısı bunu kullanır.
-- =====================================================================

create or replace function public.user_entry_counts(ids uuid[])
returns table (user_id uuid, entry_count integer)
language sql stable set search_path = '' as $$
  select p.id, count(e.id)::integer
  from public.profiles p
  left join public.entries e on e.user_id = p.id and e.deleted_at is null
  where p.id = any(ids)
  group by p.id;
$$;

grant execute on function public.user_entry_counts(uuid[]) to anon, authenticated;
