import { createClient } from "@/lib/supabase/server";
import { isPermanentMute } from "@/lib/moderation";
import { formatDateTime } from "@/lib/text";
import type { PublicProfile, Viewer } from "@/lib/types";

export const MESSAGE_COLUMNS =
  "id, sender_id, receiver_id, content, is_read, created_at";

/**
 * Mesaj → referans verilen entry eşlemesi.
 *
 * Bilerek ayrı sorgu: entry_id kolonu 014 migration'ı çalıştırılmadan
 * yoktur ve bu kolonu ana mesaj sorgusuna koymak, migration'dan önce tüm
 * mesaj sayfalarını kırardı. Kolon yokken burada sessizce boş harita döner,
 * mesajlar referanssız görünür.
 */
export async function getMessageEntryIds(messageIds: number[]) {
  const harita = new Map<number, number>();
  if (messageIds.length === 0) return harita;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, entry_id")
    .in("id", messageIds);
  if (error) return harita;

  for (const satir of (data ?? []) as {
    id: number;
    entry_id: number | null;
  }[]) {
    if (satir.entry_id) harita.set(satir.id, satir.entry_id);
  }
  return harita;
}

/** Mesajın üstünde gösterilen entry kartının verisi. */
export type MesajReferansi = {
  id: number;
  topicTitle: string | null;
  topicSlug: string | null;
  alinti: string;
  silinmis: boolean;
};

/**
 * Alıntı için ilk dolu satır.
 *
 * Spoiler içeriği alıntıya girmez: mesaj kartı, başlık sayfasında gizli
 * duran metni açığa çıkarmamalı.
 */
function alintiYap(content: string) {
  const temiz = content.replace(/\[spoiler\][\s\S]*?\[\/spoiler\]/gi, "…");
  const ilkSatir =
    temiz
      .split("\n")
      .map((satir) => satir.trim())
      .find(Boolean) ?? "";
  return ilkSatir.length > 90
    ? `${ilkSatir.slice(0, 90).trimEnd()}…`
    : ilkSatir;
}

/**
 * Referans verilen entry'leri tek sorguda getirir.
 *
 * Silinmiş entry'ler de gelir; kart "entry silinmiş" yazabilsin diye.
 * Bulunamayan numara için haritada kayıt olmaz.
 */
export async function getEntryRefs(ids: number[]) {
  const harita = new Map<number, MesajReferansi>();
  const tekil = [...new Set(ids.filter((id) => Number.isSafeInteger(id)))];
  if (tekil.length === 0) return harita;

  const supabase = await createClient();
  const { data } = await supabase
    .from("entries")
    .select(
      "id, content, deleted_at, topic:topics!entries_topic_id_fkey(title, slug, deleted_at)",
    )
    .in("id", tekil);

  type Satir = {
    id: number;
    content: string;
    deleted_at: string | null;
    topic: { title: string; slug: string; deleted_at: string | null } | null;
  };

  for (const satir of (data ?? []) as unknown as Satir[]) {
    const silinmis = Boolean(satir.deleted_at || satir.topic?.deleted_at);
    harita.set(satir.id, {
      id: satir.id,
      topicTitle: satir.topic?.title ?? null,
      topicSlug: silinmis ? null : (satir.topic?.slug ?? null),
      alinti: silinmis ? "" : alintiYap(satir.content),
      silinmis,
    });
  }

  return harita;
}

export async function getMessageBlocker(
  viewer: Viewer,
  other: PublicProfile,
): Promise<string | null> {
  if (viewer.isMuted && viewer.mutedUntil) {
    return isPermanentMute(viewer.mutedUntil)
      ? "moderasyon tarafından süresiz susturuldun."
      : `moderasyon tarafından ${formatDateTime(viewer.mutedUntil)} tarihine kadar susturuldun.`;
  }
  if (!viewer.isWriter) {
    return "yazar olduğunda yeni başlık açabilir ve mesaj gönderebilirsin.";
  }
  if (viewer.is_frozen)
    return "hesabın dondurulduğu için şu an mesaj gönderemezsin.";
  if (other.is_banned) return "bu yazar uçurulduğu için mesaj gönderilemez.";
  if (!other.allow_messages) {
    return "bu yazar özel mesajlarını kapattı. eski mesajlarınızı okumaya devam edebilirsin.";
  }

  const supabase = await createClient();
  const [{ data: ownBlock }, { data: blockedEitherWay }] = await Promise.all([
    supabase
      .from("blocks")
      .select("id")
      .eq("blocker_id", viewer.id)
      .eq("blocked_id", other.id)
      .maybeSingle(),
    supabase.rpc("is_blocked_between", { a: viewer.id, b: other.id }),
  ]);

  if (ownBlock)
    return "bu yazarı engelledin. mesaj atmak için önce engeli kaldır.";
  if (blockedEitherWay) return "bu yazara mesaj gönderemezsin.";
  return null;
}
