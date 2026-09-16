import { BADGES } from "@/lib/badges";

export default function BadgeList({ badges }: { badges: string[] }) {
  if (badges.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-1.5">
      {badges.map((badge) => {
        const info = BADGES[badge];
        if (!info) return null;
        return (
          <li key={badge}>
            <span
              title={info.description}
              className="inline-block cursor-help rounded-md border border-gold bg-gold/15 px-1.5 py-px text-[11px] font-semibold text-gold-ink"
            >
              {info.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
