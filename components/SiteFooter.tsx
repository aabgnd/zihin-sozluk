import { RULES_TEXT, RULES_TITLE } from "@/lib/text";

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-2xl px-4 py-6 text-sm lg:max-w-6xl">
        <h2 className="font-semibold text-gold-ink">{RULES_TITLE}</h2>
        <p className="mt-1 leading-relaxed text-muted">{RULES_TEXT}</p>
        <p className="mt-4 text-xs text-muted">
          zihin sözlük · stoa, psikoloji ve zihinsel dayanıklılık platformu
        </p>
      </div>
    </footer>
  );
}
