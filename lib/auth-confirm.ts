import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { YENILEME_COOKIE, YENILEME_SURESI } from "@/lib/recovery";

type Cerez = { name: string; value: string; options: Record<string, unknown> };

type Secenekler = {
  /** Adresteki type ne olursa olsun bu tür varsayılır. */
  zorunluTip?: EmailOtpType;
  /** Doğrulama başarılıysa next'e bakılmaksızın buraya gidilir. */
  zorunluHedef?: string;
};

/**
 * Parametreyi adres çubuğundan okur.
 *
 * Mail şablonlarında "&" karakteri "&amp;" olarak kaçışlanabiliyor. O zaman
 * ilk parametre dışındakiler "amp;type", "amp;next" adıyla gelir ve normal
 * okuma boş döner. İkinci adı da denemek bu bozuk bağlantıları kurtarır.
 */
function oku(params: URLSearchParams, ad: string) {
  return params.get(ad) ?? params.get(`amp;${ad}`);
}

/**
 * E-posta bağlantılarını (kayıt onayı, şifre yenileme) karşılar.
 *
 * İki akışı da kabul eder:
 *  - token_hash + type → verifyOtp. Cihazdan bağımsızdır.
 *  - code → exchangeCodeForSession (PKCE). Yalnızca kayıt olunan tarayıcıda.
 *
 * Oturum çerezleri döndürülen yönlendirme yanıtına elle yazılır: next/headers
 * üzerinden yazılan çerezler, route handler kendi NextResponse nesnesini
 * döndürdüğünde yanıta iliştirilmez.
 */
export async function confirmEmail(
  request: NextRequest,
  { zorunluTip, zorunluHedef }: Secenekler = {},
) {
  const params = request.nextUrl.searchParams;

  const istenenHedef = zorunluHedef ?? oku(params, "next");
  const varisYeri =
    istenenHedef?.startsWith("/") && !istenenHedef.startsWith("//")
      ? istenenHedef
      : "/";

  const type =
    zorunluTip ?? ((oku(params, "type") as EmailOtpType | null) ?? "email");
  const yenileme = type === "recovery";

  // Şifre yenileme bağlantısı ölüyse kullanıcıyı giriş sayfasına değil, yeni
  // bağlantı isteyebileceği sayfaya gönder.
  const hataHedefi = yenileme
    ? "/sifremi-unuttum?hata=link"
    : "/giris?hata=onay";

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

  // Supabase bağlantıyı kendi tarafında reddettiyse denemeye gerek yok.
  if (!oku(params, "error") && !oku(params, "error_code")) {
    const tokenHash = oku(params, "token_hash");
    const code = oku(params, "code");

    if (tokenHash) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });
      if (!error) return yonlendir(varisYeri, yenileme);
    }

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return yonlendir(varisYeri, yenileme);

      // Buraya code ile gelindiyse Supabase e-postayı zaten onaylamıştır:
      // /auth/v1/verify önce doğrular, sonra bu adrese yönlendirir. Başarısız
      // olan tek şey bu tarayıcıda oturum açmak; doğrulayıcı çerez kayıt
      // olunan cihazda kaldı. Bu mantık yalnızca kayıt onayı için geçerli.
      return yonlendir(yenileme ? hataHedefi : "/giris?onay=tamam");
    }
  }

  return yonlendir(hataHedefi);
}
