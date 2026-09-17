-- 013: Mod yetki sinirlari
--
-- Iki kural eklenir. Ikisi de sunucuda zorunlu: arayuzden dugme kaldirmak
-- yetmez, cunku istek dogrudan da atilabilir.
--
-- 1) Mod, bir uyeyi yazarlik esigi dolmadan yazar yapamaz. Esik
--    writer_entry_threshold() (5) ve promotion_baseline dikkate alinarak
--    hesaplanir, yani caylakliga dusurulmus biri icin sayac sifirdan baslar.
--    Admin bu kuraldan muaftir.
--
-- 2) Mod, admin hesabinin entry'lerini silemez. mod_guard_target admin
--    hesabinin KENDISINI koruyordu (ban, sustur, statu, yetki), ama
--    mod_delete_entry yalnizca require_staff() cagiriyordu; bir mod admin'in
--    entry'sini silebiliyordu.
--
-- Bu dosya yalnizca iki fonksiyonun govdesini degistirir. Tablo, kolon,
-- veri ve yetkiler oldugu gibi kalir. Imzalar degismedigi icin DROP yok.

create or replace function public.mod_set_status(target uuid, new_status text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor_role text;
  active_entries integer;
  baseline integer;
  esik integer := public.writer_entry_threshold();
  sayilan integer;
begin
  actor_role := public.require_staff();
  perform public.mod_guard_target(target);

  if new_status not in ('caylak', 'yazar') then
    raise exception 'geçersiz statü';
  end if;

  select count(*)::integer into active_entries
  from public.entries where user_id = target and deleted_at is null;

  select promotion_baseline into baseline
  from public.profiles where id = target;

  sayilan := greatest(active_entries - coalesce(baseline, 0), 0);

  -- Esik dolmadan yazarlik yalnizca admin yetkisinde.
  if new_status = 'yazar' and actor_role <> 'admin' and sayilan < esik then
    raise exception
      'yazar yapmak için en az % entry gerekiyor, bu üyede % var. eşik dolmadan yalnızca admin yazar yapabilir.',
      esik, sayilan;
  end if;

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

create or replace function public.mod_delete_entry(target_entry bigint, detail text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor_role text;
begin
  actor_role := public.require_staff();

  -- Modlar admin hesabinin entry'lerine dokunamaz.
  if actor_role <> 'admin' and exists (
    select 1
    from public.entries e
    join public.profiles p on p.id = e.user_id
    where e.id = target_entry and p.role = 'admin'
  ) then
    raise exception 'admin hesabının entryleri üzerinde işlem yapamazsın';
  end if;

  update public.entries
  set deleted_at = now(), deleted_by = auth.uid()
  where id = target_entry and deleted_at is null;

  update public.reports
  set status = 'islem_yapildi', handled_by = auth.uid(), handled_at = now()
  where entry_id = target_entry and status = 'acik';

  perform public.write_mod_log('entry_silindi', null, target_entry, null, detail);
end;
$$;
