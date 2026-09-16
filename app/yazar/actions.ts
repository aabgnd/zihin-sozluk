"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";

async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");
  return viewer;
}

export async function followUser(targetId: string) {
  const viewer = await requireViewer();
  if (targetId === viewer.id) return;

  const supabase = await createClient();
  await supabase
    .from("follows")
    .insert({ follower_id: viewer.id, following_id: targetId });

  revalidatePath("/", "layout");
}

export async function unfollowUser(targetId: string) {
  const viewer = await requireViewer();

  const supabase = await createClient();
  await supabase
    .from("follows")
    .delete()
    .eq("follower_id", viewer.id)
    .eq("following_id", targetId);

  revalidatePath("/", "layout");
}
