"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeTitle, slugify } from "@/lib/text";
import type { FormState, PublicProfile } from "@/lib/types";
import { getViewer } from "@/lib/viewer";

async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");
  return viewer;
}

function readEntry(
  viewer: PublicProfile,
  formData: FormData,
): { content: string } | { error: string } {
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
  if (error) return { error: "entry kaydedilemedi, tekrar dene." };

  revalidatePath("/", "layout");
  redirect(`/baslik/${slug}?sayfa=son`);
}

export async function createTopicWithEntry(
  rawTitle: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const viewer = await requireViewer();
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
    return {
      error:
        error.code === "PGRST202"
          ? "veritabanı güncellemesi eksik: supabase/guncelleme-01.sql çalıştırılmalı."
          : "entry kaydedilemedi, tekrar dene.",
    };
  }

  revalidatePath("/", "layout");
  redirect(`/baslik/${slug}?sayfa=son`);
}

export async function vote(entryId: number, value: 1 | -1) {
  if (value !== 1 && value !== -1) return;
  const viewer = await requireViewer();
  if (viewer.is_frozen) return;

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
