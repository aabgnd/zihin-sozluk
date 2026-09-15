"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncOtherDevices } from "@/lib/sync";
import type { FormState } from "@/lib/types";
import { getViewer } from "@/lib/viewer";

const AVATAR_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_AVATAR_BYTES = 1024 * 1024;

async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");
  return viewer;
}

export async function updateAvatar(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const viewer = await requireViewer();
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0)
    return { error: "bir görsel seç." };

  const extension = AVATAR_EXTENSIONS[file.type];
  if (!extension)
    return { error: "sadece jpg, png ya da webp yükleyebilirsin." };
  if (file.size > MAX_AVATAR_BYTES)
    return { error: "görsel en fazla 1 mb olabilir." };

  const supabase = await createClient();
  const bucket = supabase.storage.from("avatars");

  const { data: oldFiles } = await bucket.list(viewer.id);
  const path = `${viewer.id}/avatar-${Date.now()}.${extension}`;
  const { error: uploadError } = await bucket.upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
  });
  if (uploadError) return { error: "görsel yüklenemedi, tekrar dene." };

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: bucket.getPublicUrl(path).data.publicUrl })
    .eq("id", viewer.id);
  if (error) return { error: "avatar kaydedilemedi, tekrar dene." };

  if (oldFiles && oldFiles.length > 0) {
    await bucket.remove(
      oldFiles.map((oldFile) => `${viewer.id}/${oldFile.name}`),
    );
  }

  await syncOtherDevices(viewer.id);
  revalidatePath("/", "layout");
  return { message: "avatarın güncellendi." };
}

export async function setAllowMessages(allow: boolean) {
  const viewer = await requireViewer();
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ allow_messages: Boolean(allow) })
    .eq("id", viewer.id);
  await syncOtherDevices(viewer.id);
  revalidatePath("/", "layout");
}

export async function blockUser(targetId: string) {
  const viewer = await requireViewer();
  if (targetId === viewer.id) return;

  const supabase = await createClient();
  await supabase
    .from("blocks")
    .insert({ blocker_id: viewer.id, blocked_id: targetId });
  await syncOtherDevices(viewer.id);
  revalidatePath("/", "layout");
}

export async function unblockUser(targetId: string) {
  const viewer = await requireViewer();
  const supabase = await createClient();
  await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", viewer.id)
    .eq("blocked_id", targetId);
  await syncOtherDevices(viewer.id);
  revalidatePath("/", "layout");
}
