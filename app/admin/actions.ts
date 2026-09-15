"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";

async function requireStaff() {
  const viewer = await getViewer();
  if (!viewer || (viewer.role !== "admin" && viewer.role !== "mod"))
    redirect("/");
  return viewer;
}

function fail(message: string): never {
  redirect(`/admin?hata=${encodeURIComponent(message)}`);
}

export async function setStatus(
  targetId: string,
  banned: boolean,
  frozen: boolean,
) {
  await requireStaff();

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_status", {
    target: targetId,
    banned: Boolean(banned),
    frozen: Boolean(frozen),
  });
  if (error) fail(error.message);

  revalidatePath("/", "layout");
}

export async function setRole(targetId: string, role: "mod" | "user") {
  const viewer = await requireStaff();
  if (viewer.role !== "admin") fail("yetki atamayı sadece admin yapabilir.");
  if (role !== "mod" && role !== "user") fail("geçersiz yetki.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_role", {
    target: targetId,
    new_role: role,
  });
  if (error) fail(error.message);

  revalidatePath("/", "layout");
}
