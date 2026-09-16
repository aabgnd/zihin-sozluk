import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { firstParam } from "@/lib/text";
import { getViewer } from "@/lib/viewer";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "giriş" };

const NOTICES: Record<string, string> = {
  ban: "bu hesap stoa adabına uymadığı için uçuruldu.",
  onay: "onay bağlantısı geçersiz ya da süresi dolmuş. bağlantıyı kayıt olduğun tarayıcıda açtığından emin ol.",
};

export default async function LoginPage({ searchParams }: PageProps<"/giris">) {
  if (await getViewer()) redirect("/");
  const notice = NOTICES[firstParam((await searchParams).hata) ?? ""];

  return (
    <section className="mx-auto max-w-sm rounded-xl border border-line bg-surface p-5 shadow-sm">
      <h1 className="mb-5 text-xl font-bold">giriş</h1>
      {notice && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-danger px-3 py-2 text-sm text-danger"
        >
          {notice}
        </p>
      )}
      <LoginForm />
      <p className="mt-6 text-sm text-muted">
        hesabın yok mu?{" "}
        <Link
          href="/kayit"
          className="font-semibold text-gold-ink hover:underline"
        >
          kaydol
        </Link>
      </p>
    </section>
  );
}
