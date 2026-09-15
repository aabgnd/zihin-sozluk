import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import SignupForm from "./SignupForm";

export const metadata: Metadata = { title: "kaydol" };

export default async function SignupPage() {
  if (await getViewer()) redirect("/");

  return (
    <section className="mx-auto max-w-sm px-4 py-8">
      <h1 className="mb-6 text-xl font-bold">kaydol</h1>
      <SignupForm />
      <p className="mt-6 text-sm text-muted">
        zaten hesabın var mı?{" "}
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
