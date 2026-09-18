import { createClient } from "@/lib/supabase/server";

/**
 * Profil bio'su.
 *
 * Bilerek ayrı sorgu: bio kolonu 015 migration'ı çalıştırılmadan yoktur ve
 * PROFILE_COLUMNS'a eklenirse migration'dan önce tüm profil sayfaları
 * kırılırdı. Kolon yokken null döner, sayfa bio'suz görünür.
 */
export async function getBio(profileId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("bio")
    .eq("id", profileId)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { bio: string | null }).bio;
}
