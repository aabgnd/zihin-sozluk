import type { Metadata } from "next";
import Link from "next/link";
import { firstParam } from "@/lib/text";
import ResetRequestForm from "./ResetRequestForm";

export const metadata: Metadata = { title: "şifremi unuttum" };

export default async function ForgotPasswordPage({
  searchParams,
}: PageProps<"/sifremi-unuttum">) {
  const hata = firstParam((await searchParams).hata);

  return (
    <section className="mx-auto max-w-sm py-4">
      <h1 className="mb-5 text-2xl font-bold">şifremi unuttum</h1>

      {hata === "link" && (
        <p
          role="alert"
          className="mb-4 rounded-md border border-danger px-3 py-2 text-sm leading-relaxed text-danger"
        >
          şifre yenileme bağlantısı geçersiz ya da süresi dolmuş. aşağıdan yeni
          bir bağlantı isteyebilirsin.
        </p>
      )}

      <p className="mb-4 text-sm leading-relaxed text-muted">
        e-posta adresini yaz, şifreni yenileyebileceğin bir bağlantı gönderelim.
      </p>

      <ResetRequestForm />

      <p className="mt-6 text-sm text-muted">
        şifreni hatırladın mı?{" "}
        <Link
          href="/giris"
          className="font-semibold text-gold-ink hover:underline"
        >
          giriş yap
        </Link>
      </p>
    </section>
  );
}
