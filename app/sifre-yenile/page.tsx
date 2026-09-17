import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { YENILEME_COOKIE } from "@/lib/recovery";
import { firstParam } from "@/lib/text";
import { getViewer } from "@/lib/viewer";
import NewPasswordForm from "./NewPasswordForm";

export const metadata: Metadata = {
  title: "şifre yenile",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/sifre-yenile">) {
  const viewer = await getViewer();
  const cookieStore = await cookies();
  // Yalnızca sunucuda yazılan httpOnly çerez sayılır.
  const yenilemeIzni = cookieStore.get(YENILEME_COOKIE)?.value === "1";

  // Ayarlardan gelen kişi şifresini biliyordur; yenileme çerezi hâlâ geçerli
  // olsa bile mevcut şifre sorulur. Bu alan yalnızca kontrolü sıkılaştırır.
  const ayarlardan = firstParam((await searchParams).kaynak) === "ayarlar";
  const mevcutGerekli = ayarlardan || !yenilemeIzni;

  if (!viewer) {
    return (
      <section className="mx-auto max-w-sm py-4">
        <h1 className="mb-5 text-2xl font-bold">şifre yenile</h1>
        <p
          role="alert"
          className="mb-4 rounded-md border border-danger px-3 py-2 text-sm leading-relaxed text-danger"
        >
          bu bağlantı geçersiz ya da süresi dolmuş.
        </p>
        <Link
          href="/sifremi-unuttum"
          className="flex h-11 w-full items-center justify-center rounded-md bg-gold text-sm font-semibold text-on-gold hover:brightness-95"
        >
          yeni bağlantı iste
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-sm py-4">
      <h1 className="mb-5 text-2xl font-bold">
        {mevcutGerekli ? "şifreni değiştir" : "şifre yenile"}
      </h1>
      <p className="mb-4 text-sm leading-relaxed text-muted">
        <span className="font-semibold text-ink">{viewer.username}</span> için
        yeni bir şifre belirle.
        {mevcutGerekli && " güvenlik için önce mevcut şifreni yaz."}
      </p>
      <NewPasswordForm mevcutGerekli={mevcutGerekli} />
      <p className="mt-6 text-sm text-muted">
        şifreni hatırlamıyor musun?{" "}
        <Link
          href="/sifremi-unuttum"
          className="font-semibold text-gold-ink hover:underline"
        >
          e-postana bağlantı gönderelim
        </Link>
      </p>
    </section>
  );
}
