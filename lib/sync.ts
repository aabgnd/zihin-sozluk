import { createClient } from "@/lib/supabase/server";

// Aynı hesapla açık diğer cihazlara "sayfanı yenile" sinyali gönderir (header'daki LiveRefresh dinler).
export async function syncOtherDevices(userId: string) {
  const supabase = await createClient();
  await supabase
    .channel(`kullanici:${userId}`)
    .httpSend("sync", {})
    .catch(() => undefined);
}
