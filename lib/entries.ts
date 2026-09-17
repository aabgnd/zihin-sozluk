import { createClient } from "@/lib/supabase/server";

/** Başlık sayfasında bir sayfadaki entry sayısı. /entry/[no] da bunu kullanır. */
export const ENTRY_PAGE_SIZE = 10;

export const ENTRY_SELECT =
  "id, content, upvotes, downvotes, created_at, edited_at, author:profiles!entries_user_id_fkey(id, username, avatar_url, generation, title, allow_messages, status), topic:topics!entries_topic_id_fkey(title, slug), favorites(count)";

export async function getViewerEntryState(
  viewerId: string | null,
  entryIds: number[],
) {
  const votes = new Map<number, number>();
  const favorites = new Set<number>();
  if (!viewerId || entryIds.length === 0) return { votes, favorites };

  const supabase = await createClient();
  const [voteResult, favoriteResult] = await Promise.all([
    supabase
      .from("entry_votes")
      .select("entry_id, value")
      .eq("user_id", viewerId)
      .in("entry_id", entryIds),
    supabase
      .from("favorites")
      .select("entry_id")
      .eq("user_id", viewerId)
      .in("entry_id", entryIds),
  ]);

  for (const row of voteResult.data ?? []) votes.set(row.entry_id, row.value);
  for (const row of favoriteResult.data ?? []) favorites.add(row.entry_id);

  return { votes, favorites };
}
