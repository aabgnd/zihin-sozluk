import Link from "next/link";
import { deleteEntry, toggleFavorite, vote } from "@/app/baslik/actions";
import { modDeleteEntry } from "@/app/yonetim/actions";
import { formatDateTime } from "@/lib/text";
import type { EntryRow } from "@/lib/types";
import Avatar from "./Avatar";
import ConfirmButton from "./ConfirmButton";
import EntryText from "./EntryText";
import { ChevronDownIcon, ChevronUpIcon, HeartIcon } from "./icons";
import ReportButton from "./ReportButton";
import TitleBadge from "./TitleBadge";

type Props = {
  entry: EntryRow;
  viewerId?: string | null;
  isStaff?: boolean;
  myVote?: number;
  favorited?: boolean;
  showTopic?: boolean;
};

const actionButton =
  "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg px-2 text-muted hover:bg-page hover:text-ink";

export default function EntryCard({
  entry,
  viewerId = null,
  isStaff = false,
  myVote = 0,
  favorited = false,
  showTopic = false,
}: Props) {
  const favoriteCount = entry.favorites[0]?.count ?? 0;
  const { author } = entry;
  const isOwnEntry = Boolean(viewerId && author && author.id === viewerId);
  const otherUsersEntry = Boolean(viewerId && author && author.id !== viewerId);

  return (
    <article
      id={`entry-${entry.id}`}
      className="scroll-mt-4 rounded-xl border border-line bg-surface p-4 shadow-sm"
    >
      {showTopic && entry.topic && (
        <h3 className="mb-2 text-base font-bold">
          <Link
            href={`/baslik/${entry.topic.slug}`}
            className="hover:text-gold-ink"
          >
            {entry.topic.title}
          </Link>
        </h3>
      )}

      <EntryText content={entry.content} />

      {entry.edited_at && (
        <p className="mt-1 text-xs text-muted">
          düzenlendi: {formatDateTime(entry.edited_at)}
        </p>
      )}

      <footer className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs">
        <div className="-ml-2 flex flex-wrap items-center">
          <form action={vote.bind(null, entry.id, 1)}>
            <button
              type="submit"
              aria-label="artı oy"
              aria-pressed={myVote === 1}
              className={`${actionButton} ${myVote === 1 ? "text-gold-ink" : ""}`}
            >
              <ChevronUpIcon className="size-4" />
              {entry.upvotes}
            </button>
          </form>
          <form action={vote.bind(null, entry.id, -1)}>
            <button
              type="submit"
              aria-label="eksi oy"
              aria-pressed={myVote === -1}
              className={`${actionButton} ${myVote === -1 ? "text-gold-ink" : ""}`}
            >
              <ChevronDownIcon className="size-4" />
            </button>
          </form>
          <form action={toggleFavorite.bind(null, entry.id)}>
            <button
              type="submit"
              aria-label={favorited ? "favorilerden çıkar" : "favorile"}
              aria-pressed={favorited}
              className={`${actionButton} ${favorited ? "text-gold-ink" : ""}`}
            >
              <HeartIcon filled={favorited} className="size-4" />
              {favoriteCount > 0 && favoriteCount}
            </button>
          </form>

          {isOwnEntry && entry.topic && (
            <>
              <Link
                href={`/baslik/${entry.topic.slug}?duzenle=${entry.id}`}
                className={`${actionButton} font-semibold`}
              >
                düzenle
              </Link>
              <ConfirmButton
                action={deleteEntry.bind(null, entry.id)}
                label="sil"
                title="bu entry silinsin mi?"
                description="bu işlem geri alınamaz."
                className={`${actionButton} font-semibold`}
              />
            </>
          )}

          {otherUsersEntry && (
            <ReportButton entryId={entry.id} className={actionButton} />
          )}

          {isStaff && !isOwnEntry && (
            <ConfirmButton
              action={modDeleteEntry.bind(null, entry.id)}
              label="moderasyon sil"
              title="bu entry moderasyon tarafından silinsin mi?"
              description="entry çöp kutusuna taşınır, geri yüklenebilir."
              className={`${actionButton} font-semibold text-danger`}
            />
          )}

          {otherUsersEntry &&
            author &&
            (author.allow_messages ? (
              <Link
                href={`/mesajlar/${encodeURIComponent(author.username)}`}
                className={`${actionButton} font-semibold`}
              >
                mesaj at
              </Link>
            ) : (
              <span className="px-2 text-[11px] text-muted">
                bu yazar özel mesajlarını kapattı
              </span>
            ))}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted sm:flex-col sm:items-end sm:gap-0.5">
            <time dateTime={entry.created_at} className="sm:order-last">
              {formatDateTime(entry.created_at)}
            </time>
            {author && (
              <>
                <Link
                  href={`/yazar/${encodeURIComponent(author.username)}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-ink hover:underline"
                >
                  <span className="sm:hidden">
                    <Avatar username={author.username} url={author.avatar_url} />
                  </span>
                  {author.username}
                </Link>
                <TitleBadge
                  generation={author.generation}
                  title={author.title}
                />
              </>
            )}
          </div>
          {author && (
            <span className="hidden sm:block">
              <Avatar
                username={author.username}
                url={author.avatar_url}
                size="md"
              />
            </span>
          )}
        </div>
      </footer>
    </article>
  );
}
