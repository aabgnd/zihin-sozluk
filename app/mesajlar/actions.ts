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

  // Referans mesajın kendi verisinde durur, metnine yazılmaz; entry
  // sonradan düzenlense de bozulmaz.
  const ham = String(formData.get("entry_id") ?? "").trim();
  const entryId = ham ? Math.trunc(Number(ham)) : null;
  if (ham && (!Number.isSafeInteger(entryId) || (entryId ?? 0) < 1)) {
    return { error: "entry referansı geçersiz." };
  }

  const supabase = await createClient();
  const temel = { sender_id: viewer.id, receiver_id: receiverId, content };
  let { error } = await supabase
    .from("messages")
    .insert({ ...temel, entry_id: entryId });

  // 014 migration'ı çalıştırılmadıysa entry_id kolonu yoktur. Mesajın
  // gitmemesi yerine referanssız gönderilir.
  if (error?.code === "42703") {
    ({ error } = await supabase.from("messages").insert(temel));
  }

  if (error) {
    if (error.code === "23503") {
      return { error: "referans verilen entry bulunamadı." };
    }
    return {
      error:
        error.code === "42501"
          ? "bu yazara şu an mesaj gönderemezsin."
          : "mesaj gönderilemedi, tekrar dene.",
    };
  }

  revalidatePath("/", "layout");
  return { sent: true };
}


/** Bir kisiyle olan tum yazismayi yalnizca silen kisinin tarafinda gizler. */
export async function deleteConversation(otherId: string) {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_conversation", {
    other: otherId,
  });
  if (error) throw new Error("konuşma silinemedi");

  revalidatePath("/", "layout");
}

/** Secilen konusmalari, yalnizca silen kisinin tarafinda gizler. */
export async function deleteConversations(otherIds: string[]) {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");
  if (otherIds.length === 0) return;

  const supabase = await createClient();
  const sonuclar = await Promise.all(
    otherIds.map((id) => supabase.rpc("delete_conversation", { other: id })),
  );
  if (sonuclar.some((sonuc) => sonuc.error)) {
    throw new Error("konuşmalar silinemedi");
  }

  revalidatePath("/", "layout");
}

/** Tum yazismalari, yalnizca silen kisinin tarafinda gizler. */
export async function deleteAllConversations() {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");

  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("sender_id, receiver_id")
    .or(
      `and(sender_id.eq.${viewer.id},sender_deleted_at.is.null),and(receiver_id.eq.${viewer.id},receiver_deleted_at.is.null)`,
    )
    .limit(2000);

  const partnerler = new Set<string>();
  for (const mesaj of (data ?? []) as {
    sender_id: string;
    receiver_id: string;
  }[]) {
    partnerler.add(
      mesaj.sender_id === viewer.id ? mesaj.receiver_id : mesaj.sender_id,
    );
  }
  if (partnerler.size === 0) return;

  const sonuclar = await Promise.all(
    [...partnerler].map((id) =>
      supabase.rpc("delete_conversation", { other: id }),
    ),
  );
  if (sonuclar.some((sonuc) => sonuc.error)) {
    throw new Error("mesajlar silinemedi");
  }

  revalidatePath("/", "layout");
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
