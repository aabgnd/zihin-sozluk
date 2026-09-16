import Link from "next/link";
import { RULES_TEXT, RULES_TITLE } from "@/lib/text";
import { getViewer } from "@/lib/viewer";

export default async function RightRail() {
  const viewer = await getViewer();

  return (
    <div className="space-y-6 text-sm">
      {!viewer && (
        <section>
          <h2 className="font-semibold text-ink">aramıza katıl</h2>
          <p className="mt-1 leading-relaxed text-muted">
            stoa, psikoloji ve zihinsel dayanıklılık üzerine sen de yaz.
          </p>
          <Link
            href="/kayit"
            className="mt-3 inline-flex h-10 items-center rounded-md bg-gold px-4 text-sm font-semibold text-on-gold hover:brightness-95"
          >
            kaydol
          </Link>
        </section>
      )}

      <section className="border-t border-line pt-5">
        <h2 className="font-semibold text-ink">{RULES_TITLE}</h2>
        <p className="mt-1 leading-relaxed text-muted">{RULES_TEXT}</p>
      </section>
    </div>
  );
}
