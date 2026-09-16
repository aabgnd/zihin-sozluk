"use server";

import type { AuthError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { onayAdresi } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/types";

const USERNAME_PATTERN = /^[a-z0-9çğıöşü._ -]{3,30}$/;

const AUTH_ERRORS: Record<string, string> = {
  invalid_credentials: "e-posta ya da şifre hatalı.",
  email_not_confirmed:
    "e-posta adresini henüz onaylamamışsın. gelen kutunu kontrol et.",
  user_already_exists: "bu e-posta ile zaten kayıt olunmuş.",
  weak_password: "şifre çok zayıf, daha güçlü bir şifre seç.",
  over_email_send_rate_limit:
    "çok fazla deneme yapıldı. biraz bekleyip tekrar dene.",
  over_request_rate_limit:
    "çok fazla deneme yapıldı. biraz bekleyip tekrar dene.",
};

function authError(error: AuthError): FormState {
  return {
    error:
      (error.code && AUTH_ERRORS[error.code]) ||
      `bir şeyler ters gitti: ${error.message}`,
  };
}

export async function signUp(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const username = String(formData.get("username") ?? "")
    .toLocaleLowerCase("tr")
    .replace(/\s+/g, " ")
    .trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!USERNAME_PATTERN.test(username)) {
    return {
      error:
        "kullanıcı adı 3-30 karakter olmalı; harf, rakam, boşluk, nokta, alt çizgi ve tire kullanabilirsin.",
    };
  }
  if (password.length < 8) return { error: "şifre en az 8 karakter olmalı." };
  if (formData.get("rules") !== "on") {
    return { error: "kayıt olmak için stoa adabını kabul etmelisin." };
  }

  const supabase = await createClient();
  const { data: taken, error: lookupError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (lookupError) {
    return {
      error: "veritabanına ulaşılamadı. supabase/schema.sql çalıştırıldı mı?",
    };
  }
  if (taken) return { error: "bu kullanıcı adı alınmış." };

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username }, emailRedirectTo: await onayAdresi() },
  });
  if (error) return authError(error);

  return {
    message: `onay bağlantısı ${email} adresine gönderildi. bağlantıya tıkladığında hesabın açılacak.`,
  };
}

export async function signIn(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return error.code === "email_not_confirmed"
      ? { ...authError(error), unconfirmedEmail: email }
      : authError(error);
  }

  redirect("/");
}

export async function resendConfirmation(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "e-posta adresi eksik." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: await onayAdresi() },
  });
  if (error) return authError(error);

  return {
    message: "onay e-postası tekrar gönderildi. gelen kutunu kontrol et.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
