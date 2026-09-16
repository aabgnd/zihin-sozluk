import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { PublicProfile, Viewer } from "@/lib/types";

export const PROFILE_COLUMNS =
  "id, username, avatar_url, role, status, generation, title, is_banned, is_frozen, allow_messages, created_at";

type AccountRow = {
  status: string;
  muted_until: string | null;
  review_entry_count: number;
  writer_threshold: number;
};

export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profileData }, { data: accountData }] = await Promise.all([
    supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", user.id)
      .maybeSingle(),
    supabase.rpc("my_account"),
  ]);

  const profile = profileData as PublicProfile | null;
  if (!profile) return null;

  const account = (
    Array.isArray(accountData) ? accountData[0] : accountData
  ) as AccountRow | undefined;
  const mutedUntil = account?.muted_until ?? null;
  const isStaff = profile.role === "admin" || profile.role === "mod";

  return {
    ...profile,
    mutedUntil,
    isMuted: Boolean(mutedUntil && new Date(mutedUntil) > new Date()),
    isWriter: profile.status === "yazar" || isStaff,
    isStaff,
    reviewEntryCount: account?.review_entry_count ?? 0,
    writerThreshold: account?.writer_threshold ?? 5,
  };
});
