import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * E-posta onay bağlantısını karşılar.
 *
 * İki akışı da kabul eder, çünkü Supabase'deki mail şablonuna göre bağlantı
 * farklı parametrelerle gelir:
 *  - token_hash + type → verifyOtp. Cihazdan bağımsızdır; mail masaüstünde
 *    kayıt olup telefonda açılsa bile onaylar. Tercih edilen yol budur.
 *  - code → exchangeCodeForSession (PKCE). Yalnızca kayıt olunan tarayıcıda
 *    geçerlidir, çünkü doğrulayıcı çerez orada durur.
 */
export async function confirmEmail(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const istenenHedef = params.get("next");
  const varisYeri =
    istenenHedef?.startsWith("/") && !istenenHedef.startsWith("//")
      ? istenenHedef
      : "/";

  // Supabase bağlantıyı kendi tarafında reddettiyse (süresi dolmuş, kullanılmış)
  // denemeye gerek yok.
  if (!params.get("error") && !params.get("error_code")) {
    const tokenHash = params.get("token_hash");
    const code = params.get("code");
    const supabase = await createClient();

    if (tokenHash) {
      const type = (params.get("type") as EmailOtpType | null) ?? "email";
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });
      if (!error) return NextResponse.redirect(new URL(varisYeri, request.url));
    }

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(varisYeri, request.url));
    }
  }

  return NextResponse.redirect(new URL("/giris?hata=onay", request.url));
}
