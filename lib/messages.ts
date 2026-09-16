import { createClient } from "@/lib/supabase/server";
import { isPermanentMute } from "@/lib/moderation";
import { formatDateTime } from "@/lib/text";
import type { PublicProfile, Viewer } from "@/lib/types";

export const MESSAGE_COLUMNS =
  "id, sender_id, receiver_id, content, is_read, created_at";

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
