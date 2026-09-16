"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { muteUntilFromOption } from "@/lib/moderation";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";

async function requireStaff() {
  const viewer = await getViewer();
  if (!viewer || !viewer.isStaff) redirect("/");
  return viewer;
}

function fail(message: string): never {
  redirect(`/yonetim?hata=${encodeURIComponent(message)}`);
}

async function callModeration(name: string, args: Record<string, unknown>) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.rpc(name, args);
  if (error) fail(error.message);
  revalidatePath("/", "layout");
}

export async function modDeleteEntry(entryId: number) {
  await callModeration("mod_delete_entry", {
    target_entry: entryId,
    detail: null,
  });
}

export async function modRestoreEntry(entryId: number) {
  await callModeration("mod_restore_entry", { target_entry: entryId });
}

export async function modPurgeEntry(entryId: number) {
  await callModeration("mod_purge_entry", { target_entry: entryId });
}

export async function modDeleteTopic(topicId: number) {
  await callModeration("mod_delete_topic", {
    target_topic: topicId,
    detail: null,
  });
}

export async function modRestoreTopic(topicId: number) {
  await callModeration("mod_restore_topic", { target_topic: topicId });
}

export async function modPurgeTopic(topicId: number) {
  await callModeration("mod_purge_topic", { target_topic: topicId });
}

export async function modMuteForm(userId: string, formData: FormData) {
  const option = String(formData.get("sure") ?? "1");
  await callModeration("mod_mute", {
    target: userId,
    until: muteUntilFromOption(option),
  });
}

export async function modUnmute(userId: string) {
  await callModeration("mod_unmute", { target: userId });
}

export async function modSetStatus(userId: string, status: "caylak" | "yazar") {
  if (status !== "caylak" && status !== "yazar") fail("geçersiz statü.");
  await callModeration("mod_set_status", {
    target: userId,
    new_status: status,
  });
}

export async function modDeclineWriter(userId: string) {
  await callModeration("mod_decline_writer", { target: userId });
}

export async function modHandleReport(entryId: number, decision: string) {
  if (decision !== "islem_yapildi" && decision !== "reddedildi")
    fail("geçersiz karar.");
  await callModeration("mod_handle_report", {
    target_entry: entryId,
    decision,
  });
}

export async function modSetAccount(
  userId: string,
  banned: boolean,
  frozen: boolean,
) {
  await callModeration("admin_set_status", {
    target: userId,
    banned: Boolean(banned),
    frozen: Boolean(frozen),
  });
}

export async function modSetRole(userId: string, role: "mod" | "user") {
  const viewer = await requireStaff();
  if (viewer.role !== "admin") fail("yetki atamayı sadece admin yapabilir.");
  if (role !== "mod" && role !== "user") fail("geçersiz yetki.");
  await callModeration("admin_set_role", { target: userId, new_role: role });
}
