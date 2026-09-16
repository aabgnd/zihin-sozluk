import Link from "next/link";
import { RULES_TEXT, RULES_TITLE } from "@/lib/text";
import { getViewer } from "@/lib/viewer";

export default async function RightRail() {
  const viewer = await getViewer();

  return (
    <div className="space-y-4">
      {!viewer && (
        <section className="rounded-xl border border-line bg-surface p-4 shadow-sm">
          <h2 className="font-bold">aramıza katıl</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            stoa, psikoloji ve zihinsel dayanıklılık üzerine sen de yaz.
          </p>
          <Link
            href="/kayit"
            className="mt-3 inline-flex h-10 items-center rounded-lg bg-gold px-4 text-sm font-bold text-on-gold hover:brightness-95"
          >
            kaydol
          </Link>
        </section>
      )}
      <section className="rounded-xl border border-line bg-surface p-4 shadow-sm">
        <h2 className="text-sm font-bold">{RULES_TITLE}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">{RULES_TEXT}</p>
      </section>
    </div>
  );
}
