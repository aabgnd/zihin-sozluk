"use server";

import type { AuthError } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { YENILEME_COOKIE } from "@/lib/recovery";
import { onayAdresi, siteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/types";

const USERNAME_PATTERN = /^[a-z0-9çğıöşü._ -]{3,30}$/;

const AUTH_ERRORS: Record<string, string> = {
  invalid_credentials: "e-posta ya da şifre hatalı.",
  email_not_confirmed:
    "e-posta adresini henüz onaylamamışsın. gelen kutunu kontrol et.",
  user_already_exists: "bu e-posta ile zaten kayıt olunmuş.",
  weak_password: "şifre çok zayıf, daha güçlü bir şifre seç.",
  same_password: "yeni şifren eskisiyle aynı. farklı bir şifre seç.",
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
  const kimlik = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  let email = kimlik;

  // İçinde @ yoksa kullanıcı adı sayılır. E-posta sunucuda çözülür ve
  // yalnızca şifre doğruysa döner; aksi hâlde kullanıcı adlarını tarayıp
  // herkesin e-postasını toplamak mümkün olurdu.
  if (kimlik && !kimlik.includes("@")) {
    const { data, error: rpcHatasi } = await supabase.rpc("kullanici_email", {
      kullanici: kimlik.toLocaleLowerCase("tr"),
      sifre: password,
    });
    if (rpcHatasi) {
      return {
        error: "kullanıcı adıyla giriş şu an yapılamıyor. e-postanla dene.",
      };
    }
    if (!data) return { error: AUTH_ERRORS.invalid_credentials };
    email = String(data);
  }

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

/**
 * Şifre yenileme bağlantısı ister.
 *
 * Adres kayıtlı olsun olmasın aynı cevabı döner; aksi hâlde form, hangi
 * e-postaların sitede kayıtlı olduğunu öğrenmek için kullanılabilirdi.
 */
export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const ayniCevap = {
    message: "bu adres kayıtlıysa şifre yenileme bağlantısı gönderdik.",
  };
  if (!email) return { error: "e-posta adresini yaz." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    // Hedef adresin kendisinde; sorgu parametresine güvenilmiyor.
    redirectTo: `${await siteUrl()}/auth/sifre-yenile`,
  });

  return ayniCevap;
}

export async function updatePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const tekrar = String(formData.get("password_tekrar") ?? "");

  if (password.length < 8) return { error: "şifre en az 8 karakter olmalı." };
  if (password !== tekrar) return { error: "şifreler birbirini tutmuyor." };

  const cookieStore = await cookies();
  // İzin yalnızca sunucuda yazılan httpOnly çerezden okunur; adres
  // parametresi ya da tarayıcı deposu gibi değiştirilebilir bir kaynaktan değil.
  const yenilemeIzni = cookieStore.get(YENILEME_COOKIE)?.value === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { error: "bağlantının süresi dolmuş. yeni bir bağlantı iste." };
  }

  // Bağlantıyla gelmeyen herkes mevcut şifresini bilmek zorunda: açık kalmış
  // bir oturumu ele geçiren kişi şifreyi değiştirememeli. Ayarlardan gelen
  // form ayrıca mevcut şifreyi açıkça ister; bu alan kontrolü yalnızca
  // sıkılaştırabilir, gevşetemez.
  const mevcutIstendi = String(formData.get("mevcut_istendi") ?? "") === "1";
  if (!yenilemeIzni || mevcutIstendi) {
    const { data: kalan } = await supabase.rpc("sifre_kilit_kalan");
    if (typeof kalan === "number" && kalan > 0) {
      const dakika = Math.ceil(kalan / 60);
      return {
        error: `çok fazla yanlış deneme yaptın. ${dakika} dakika sonra tekrar dene.`,
      };
    }

    const mevcut = String(formData.get("mevcut_sifre") ?? "");
    if (!mevcut) return { error: "mevcut şifreni yaz." };

    const { error: dogrulama } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: mevcut,
    });
    if (dogrulama) {
      await supabase.rpc("sifre_deneme_basarisiz");
      return { error: "mevcut şifren hatalı." };
    }

    await supabase.rpc("sifre_deneme_sifirla");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return authError(error);

  // Şifre değişti: diğer cihazlardaki oturumlar kapansın.
  await supabase.auth.signOut({ scope: "others" });
  // İzin tek kullanımlık.
  cookieStore.delete(YENILEME_COOKIE);

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
