"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeTitle, slugify } from "@/lib/text";
import type { FormState, Viewer } from "@/lib/types";
import { getViewer } from "@/lib/viewer";

async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");
  return viewer;
}

function readEntry(
  viewer: Viewer,
  formData: FormData,
): { content: string } | { error: string } {
  if (viewer.isMuted) return { error: "susturuldun, şu an entry yazamazsın." };
  if (viewer.is_frozen)
    return { error: "hesabın dondurulmuş, şu an entry yazamazsın." };
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "boş entry gönderilemez." };
  if (content.length > 10000)
    return { error: "entry en fazla 10.000 karakter olabilir." };
  return { content };
}

export async function createEntry(
  topicId: number,
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const viewer = await requireViewer();
  const entry = readEntry(viewer, formData);
  if ("error" in entry) return entry;

  const supabase = await createClient();
  const { error } = await supabase
    .from("entries")
    .insert({ topic_id: topicId, user_id: viewer.id, content: entry.content });
  if (error) {
    // Hız sınırı tetikleyicisi (015) kendi Türkçe mesajıyla gelir.
    if (error.code === "ZS429") return { error: error.message };
    return { error: "entry kaydedilemedi, tekrar dene." };
  }

  revalidatePath("/", "layout");
  redirect(`/baslik/${slug}?sayfa=son`);
}

export async function createTopicWithEntry(
  rawTitle: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const viewer = await requireViewer();
  if (!viewer.isWriter) {
    return {
      error: "yazar olduğunda yeni başlık açabilir ve mesaj gönderebilirsin.",
    };
  }
  const entry = readEntry(viewer, formData);
  if ("error" in entry) return entry;

  const title = normalizeTitle(rawTitle).slice(0, 100).trim();
  const slug = slugify(title);
  if (!slug) return { error: "başlıkta en az bir harf ya da rakam olmalı." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_topic_with_entry", {
    topic_title: title,
    topic_slug: slug,
    entry_content: entry.content,
  });
  if (error) {
    if (error.code === "ZS429") return { error: error.message };
    if (error.message.includes("çaylak")) {
      return {
        error: "yazar olduğunda yeni başlık açabilir ve mesaj gönderebilirsin.",
      };
    }
    if (error.message.includes("kaldırıldı")) {
      return { error: "bu başlık yönetim tarafından kaldırıldı." };
    }
    return { error: "entry kaydedilemedi, tekrar dene." };
  }

  revalidatePath("/", "layout");
  redirect(`/baslik/${slug}?sayfa=son`);
}

export async function updateEntry(
  entryId: number,
  slug: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const viewer = await requireViewer();
  const entry = readEntry(viewer, formData);
  if ("error" in entry) return entry;

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("entries")
    .select("content")
    .eq("id", entryId)
    .eq("user_id", viewer.id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!current) return { error: "bu entry düzenlenemiyor." };

  if (current.content !== entry.content) {
    const { error } = await supabase
      .from("entries")
      .update({ content: entry.content, edited_at: new Date().toISOString() })
      .eq("id", entryId)
      .eq("user_id", viewer.id);
    if (error) return { error: "entry güncellenemedi, tekrar dene." };
    revalidatePath("/", "layout");
  }

  redirect(`/baslik/${slug}`);
}

export async function deleteEntry(entryId: number) {
  const viewer = await requireViewer();

  const supabase = await createClient();
  await supabase
    .from("entries")
    .update({ deleted_at: new Date().toISOString(), deleted_by: viewer.id })
    .eq("id", entryId)
    .eq("user_id", viewer.id)
    .is("deleted_at", null);

  revalidatePath("/", "layout");
}

export async function reportEntry(
  entryId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireViewer();
  const reason = String(formData.get("reason") ?? "");
  const note = String(formData.get("note") ?? "")
    .trim()
    .slice(0, 300);

  const supabase = await createClient();
  const { error } = await supabase.rpc("report_entry", {
    target_entry: entryId,
    report_reason: reason,
    report_note: note || null,
  });
  if (error) {
    if (error.code === "23505")
      return { error: "bu entry'yi zaten bildirdin." };
    return { error: "şikayet gönderilemedi, tekrar dene." };
  }

  return { message: "şikayetin moderasyona iletildi." };
}

export async function vote(entryId: number, value: 1 | -1) {
  if (value !== 1 && value !== -1) return;
  const viewer = await requireViewer();
  if (viewer.is_frozen || viewer.isMuted) return;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("entry_votes")
    .select("value")
    .eq("user_id", viewer.id)
    .eq("entry_id", entryId)
    .maybeSingle();

  if (existing?.value === value) {
    await supabase
      .from("entry_votes")
      .delete()
      .eq("user_id", viewer.id)
      .eq("entry_id", entryId);
  } else {
    await supabase
      .from("entry_votes")
      .upsert({ user_id: viewer.id, entry_id: entryId, value });
  }

  revalidatePath("/", "layout");
}

export async function toggleFavorite(entryId: number) {
  const viewer = await requireViewer();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", viewer.id)
    .eq("entry_id", entryId)
    .maybeSingle();

  if (existing) {
    await supabase.from("favorites").delete().eq("id", existing.id);
  } else {
    await supabase
      .from("favorites")
      .insert({ user_id: viewer.id, entry_id: entryId });
  }

  revalidatePath("/", "layout");
}
