"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";

export async function markNotificationsRead() {
  const viewer = await getViewer();
  if (!viewer) return;

  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", viewer.id)
    .eq("is_read", false);

  revalidatePath("/", "layout");
}
