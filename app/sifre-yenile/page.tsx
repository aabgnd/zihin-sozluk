import type { Metadata } from "next";
import Link from "next/link";
import { getViewer } from "@/lib/viewer";
import NewPasswordForm from "./NewPasswordForm";

export const metadata: Metadata = {
  title: "şifre yenile",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  // Buraya yalnızca yenileme bağlantısıyla açılan oturumla gelinir.
  const viewer = await getViewer();

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
      <h1 className="mb-5 text-2xl font-bold">şifre yenile</h1>
      <p className="mb-4 text-sm leading-relaxed text-muted">
        <span className="font-semibold text-ink">{viewer.username}</span> için
        yeni bir şifre belirle.
      </p>
      <NewPasswordForm />
    </section>
  );
}
