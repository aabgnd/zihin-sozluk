import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { PublicProfile } from "@/lib/types";

export const PROFILE_COLUMNS =
  "id, username, avatar_url, role, generation, title, is_banned, is_frozen, allow_messages, created_at";

export const getViewer = cache(async (): Promise<PublicProfile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();

  return data as PublicProfile | null;
});
