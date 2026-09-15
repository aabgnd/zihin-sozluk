import Link from "next/link";
import { RULES_TEXT, RULES_TITLE } from "@/lib/text";
import { getViewer } from "@/lib/viewer";

export default async function RightRail() {
  const viewer = await getViewer();

  return (
    <div className="sticky top-0 space-y-4 py-4">
      {!viewer && (
        <section className="rounded-sm border border-line bg-surface p-4">
          <h2 className="font-bold">aramıza katıl</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            stoa, psikoloji ve zihinsel dayanıklılık üzerine sen de yaz.
          </p>
          <Link
            href="/kayit"
            className="mt-3 inline-flex h-10 items-center rounded-sm bg-gold px-4 text-sm font-semibold text-on-gold hover:brightness-95"
          >
            kaydol
          </Link>
        </section>
      )}
      <section className="rounded-sm border border-line bg-surface p-4">
        <h2 className="font-bold text-gold-ink">{RULES_TITLE}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">{RULES_TEXT}</p>
      </section>
    </div>
  );
}
