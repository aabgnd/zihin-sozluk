"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/types";
import { getViewer } from "@/lib/viewer";

export async function sendMessage(
  receiverId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");
  if (viewer.is_frozen)
    return { error: "hesabın dondurulduğu için şu an mesaj gönderemezsin." };
  if (receiverId === viewer.id) return { error: "kendine mesaj atamazsın." };

  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "boş mesaj gönderilemez." };
  if (content.length > 5000)
    return { error: "mesaj en fazla 5.000 karakter olabilir." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("messages")
    .insert({ sender_id: viewer.id, receiver_id: receiverId, content });
  if (error) {
    return {
      error:
        error.code === "42501"
          ? "bu yazara şu an mesaj gönderemezsin."
          : "mesaj gönderilemedi, tekrar dene.",
    };
  }

  revalidatePath("/", "layout");
  return {};
}

export async function markConversationRead(otherId: string) {
  const viewer = await getViewer();
  if (!viewer) return;

  const supabase = await createClient();
  await Promise.all([
    supabase
      .from("messages")
      .update({ is_read: true })
      .eq("receiver_id", viewer.id)
      .eq("sender_id", otherId)
      .eq("is_read", false),
    supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", viewer.id)
      .eq("actor_id", otherId)
      .eq("type", "message")
      .eq("is_read", false),
  ]);

  revalidatePath("/", "layout");
}
