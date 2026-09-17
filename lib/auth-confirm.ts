import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { YENILEME_COOKIE, YENILEME_SURESI } from "@/lib/recovery";

type Cerez = { name: string; value: string; options: Record<string, unknown> };

/**
 * E-posta onay bağlantısını karşılar.
 *
 * İki akışı da kabul eder, çünkü Supabase'deki mail şablonuna göre bağlantı
 * farklı parametrelerle gelir:
 *  - token_hash + type → verifyOtp. Cihazdan bağımsızdır; mail masaüstünde
 *    kayıt olup telefonda açılsa bile oturum açar. Tercih edilen yol budur.
 *  - code → exchangeCodeForSession (PKCE). Yalnızca kayıt olunan tarayıcıda
 *    geçerlidir, çünkü doğrulayıcı çerez orada durur.
 *
 * Oturum çerezleri döndürülen yönlendirme yanıtına elle yazılır. Bu şart:
 * next/headers üzerinden yazılan çerezler, route handler kendi NextResponse
 * nesnesini döndürdüğünde yanıta iliştirilmez; kullanıcı onaylanmış ama
 * giriş yapmamış olarak siteye düşer.
 */
export async function confirmEmail(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const istenenHedef = params.get("next");
  const varisYeri =
    istenenHedef?.startsWith("/") && !istenenHedef.startsWith("//")
      ? istenenHedef
      : "/";

  const yazilacakCerezler: Cerez[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          yazilacakCerezler.push(...(cookies as Cerez[]));
        },
      },
    },
  );

  function yonlendir(hedef: string, yenilemeIzni = false) {
    const response = NextResponse.redirect(new URL(hedef, request.url));
    for (const { name, value, options } of yazilacakCerezler) {
      response.cookies.set(name, value, options);
    }
    // Yalnızca yenileme bağlantısıyla gelene "mevcut şifreyi sorma" izni ver.
    if (yenilemeIzni) {
      response.cookies.set(YENILEME_COOKIE, "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: YENILEME_SURESI,
      });
    }
    return response;
  }

  const type = (params.get("type") as EmailOtpType | null) ?? "email";

  // Şifre yenileme bağlantısı ölüyse kullanıcıyı giriş sayfasına değil, yeni
  // bağlantı isteyebileceği sayfaya gönder.
  const hataHedefi =
    type === "recovery" ? "/sifremi-unuttum?hata=link" : "/giris?hata=onay";

  // Supabase bağlantıyı kendi tarafında reddettiyse (süresi dolmuş, kullanılmış)
  // denemeye gerek yok.
  if (!params.get("error") && !params.get("error_code")) {
    const tokenHash = params.get("token_hash");
    const code = params.get("code");

    if (tokenHash) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });
      if (!error) return yonlendir(varisYeri, type === "recovery");
    }

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return yonlendir(varisYeri, type === "recovery");

      // Buraya code ile gelindiyse Supabase e-postayı zaten onaylamıştır:
      // /auth/v1/verify önce doğrular, sonra bu adrese yönlendirir. Başarısız
      // olan tek şey bu tarayıcıda oturum açmak; doğrulayıcı çerez kayıt
      // olunan cihazda kaldı. Kullanıcıya hata değil, giriş davetiyesi.
      // Bu mantık yalnızca kayıt onayı için geçerli, şifre yenileme için değil.
      return yonlendir(type === "recovery" ? hataHedefi : "/giris?onay=tamam");
    }
  }

  return yonlendir(hataHedefi);
}
