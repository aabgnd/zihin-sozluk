"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BIO_MAX } from "@/lib/bio-sabit";
import { createClient } from "@/lib/supabase/server";
import { syncOtherDevices } from "@/lib/sync";
import type { FormState } from "@/lib/types";
import { getViewer } from "@/lib/viewer";

const AVATAR_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

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
  if (file.size > MAX_AVATAR_BYTES) {
    const sizeInMb = (file.size / 1024 / 1024).toFixed(1);
    return {
      error: `görsel en fazla 2 mb olabilir. seçtiğin dosya ${sizeInMb} mb.`,
    };
  }

  const supabase = await createClient();
  const bucket = supabase.storage.from("avatars");
  const path = `${viewer.id}/avatar.${extension}`;

  // Sabit dosya adına üzerine yazılır: eski adres hiçbir an boşa düşmez.
  const { error: uploadError } = await bucket.upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: true,
  });
  if (uploadError) return { error: "görsel yüklenemedi, tekrar dene." };

  // Sürüm parametresi olmadan tarayıcı ve görsel önbelleği eski fotoğrafı göstermeye devam eder.
  const publicUrl = `${bucket.getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", viewer.id);
  if (error) return { error: "avatar kaydedilemedi, tekrar dene." };

  // Yeni adres kaydedildikten sonra eski dosyalar temizlenir.
  const { data: files } = await bucket.list(viewer.id);
  const stale = (files ?? [])
    .map((oldFile) => `${viewer.id}/${oldFile.name}`)
    .filter((oldPath) => oldPath !== path);
  if (stale.length > 0) await bucket.remove(stale);

  await syncOtherDevices(viewer.id);
  revalidatePath("/", "layout");
  return { message: "avatarın güncellendi." };
}

export async function removeAvatar() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const bucket = supabase.storage.from("avatars");

  await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", viewer.id);

  const { data: files } = await bucket.list(viewer.id);
  if (files && files.length > 0) {
    await bucket.remove(files.map((oldFile) => `${viewer.id}/${oldFile.name}`));
  }

  await syncOtherDevices(viewer.id);
  revalidatePath("/", "layout");
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

export async function updateBio(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const viewer = await requireViewer();
  const bio = String(formData.get("bio") ?? "").trim();
  if (bio.length > BIO_MAX) {
    return { error: `bio en fazla ${BIO_MAX} karakter olabilir.` };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ bio: bio || null })
    .eq("id", viewer.id);

  if (error) {
    // 015 migration'ı çalıştırılmadan kolon yoktur.
    if (error.code === "42703" || error.code === "PGRST204") {
      return { error: "bio özelliği henüz etkin değil." };
    }
    return { error: "bio kaydedilemedi, tekrar dene." };
  }

  revalidatePath("/", "layout");
  return { message: bio ? "bio kaydedildi." : "bio kaldırıldı." };
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
