import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { firstParam } from "@/lib/text";
import { getViewer } from "@/lib/viewer";
import HashNotice from "./HashNotice";
import LoginForm from "./LoginForm";
import ResendForm from "./ResendForm";

export const metadata: Metadata = { title: "giriş" };

const NOTICES: Record<string, string> = {
  ban: "bu hesap stoa adabına uymadığı için uçuruldu.",
  onay: "hesabını açamadık.",
};

export default async function LoginPage({ searchParams }: PageProps<"/giris">) {
  if (await getViewer()) redirect("/");
  const params = await searchParams;
  const hata = firstParam(params.hata) ?? "";
  const notice = NOTICES[hata];
  const onaylandi = firstParam(params.onay) === "tamam";

  return (
    <section className="mx-auto max-w-sm py-4">
      <h1 className="mb-5 text-2xl font-bold">giriş</h1>
      {onaylandi && (
        <p
          role="status"
          className="mb-4 rounded-md border border-gold px-3 py-2 text-sm leading-relaxed"
        >
          <span className="font-semibold">hesabın onaylandı.</span> şimdi
          e-postan ve şifrenle giriş yapabilirsin.
        </p>
      )}
      {notice && (
        <p
          role="alert"
          className="mb-4 rounded-md border border-danger px-3 py-2 text-sm leading-relaxed text-danger"
        >
          {notice}
          {hata === "onay" && <HashNotice />}
        </p>
      )}
      {hata === "onay" && (
        <div className="mb-6 border-b border-line pb-6">
          <ResendForm />
        </div>
      )}
      <LoginForm />
      <p className="mt-4 text-sm">
        <Link
          href="/sifremi-unuttum"
          className="font-semibold text-gold-ink hover:underline"
        >
          şifremi unuttum
        </Link>
      </p>
      <p className="mt-2 text-sm text-muted">
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
