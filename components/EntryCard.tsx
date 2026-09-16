import Link from "next/link";
import { deleteEntry, toggleFavorite, vote } from "@/app/baslik/actions";
import { modDeleteEntry } from "@/app/yonetim/actions";
import LocalTime from "./LocalTime";
import type { EntryRow } from "@/lib/types";
import Avatar from "./Avatar";
import ConfirmButton from "./ConfirmButton";
import EntryMenu from "./EntryMenu";
import EntryText from "./EntryText";
import ExpandableText from "./ExpandableText";
import { ChevronDownIcon, ChevronUpIcon, HeartIcon, ShareIcon } from "./icons";
import RankBadge from "./RankBadge";
import ReportButton from "./ReportButton";

type Props = {
  entry: EntryRow;
  viewerId?: string | null;
  isStaff?: boolean;
  myVote?: number;
  favorited?: boolean;
  showTopic?: boolean;
  authorEntryCount?: number | null;
};

const groupButton =
  "inline-flex h-9 items-center gap-1 px-2.5 text-sm text-muted hover:bg-surface-2 hover:text-ink";
const entryMenuItem =
  "flex h-11 w-full items-center px-4 text-left text-sm hover:bg-surface-2";

export default function EntryCard({
  entry,
  viewerId = null,
  isStaff = false,
  myVote = 0,
  favorited = false,
  showTopic = false,
  authorEntryCount = null,
}: Props) {
  const favoriteCount = entry.favorites[0]?.count ?? 0;
  const { author } = entry;
  const isOwnEntry = Boolean(viewerId && author && author.id === viewerId);
  const otherUsersEntry = Boolean(viewerId && author && author.id !== viewerId);
  const entryHref = entry.topic
    ? `/baslik/${entry.topic.slug}#entry-${entry.id}`
    : "";

  return (
    <article
      id={`entry-${entry.id}`}
      className="scroll-mt-6 border-b border-line py-6"
    >
      {showTopic && entry.topic && (
        <h3 className="mb-2 text-base font-bold">
          <Link
            href={`/baslik/${entry.topic.slug}`}
            className="text-gold-ink hover:opacity-80"
          >
            {entry.topic.title}
          </Link>
        </h3>
      )}

      <ExpandableText>
        <EntryText content={entry.content} />
      </ExpandableText>

      {entry.edited_at && (
        <p className="mt-1 text-xs text-muted">
          düzenlendi: <LocalTime iso={entry.edited_at} />
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="inline-flex divide-x divide-line overflow-hidden rounded-md border border-line">
          <form action={vote.bind(null, entry.id, 1)}>
            <button
              type="submit"
              aria-label="artı oy"
              aria-pressed={myVote === 1}
              className={`${groupButton} ${myVote === 1 ? "text-gold-ink" : ""}`}
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
              className={`${groupButton} ${myVote === -1 ? "text-gold-ink" : ""}`}
            >
              <ChevronDownIcon className="size-4" />
            </button>
          </form>
          <form action={toggleFavorite.bind(null, entry.id)}>
            <button
              type="submit"
              aria-label={favorited ? "favorilerden çıkar" : "favorile"}
              aria-pressed={favorited}
              className={`${groupButton} ${favorited ? "text-gold-ink" : ""}`}
            >
              <HeartIcon filled={favorited} className="size-4" />
              {favoriteCount > 0 && favoriteCount}
            </button>
          </form>
        </div>

        <div className="flex items-center gap-1">
          {entryHref && (
            <Link
              href={entryHref}
              aria-label="entry bağlantısı"
              className="grid size-9 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
            >
              <ShareIcon className="size-4" />
            </Link>
          )}

          <EntryMenu entryHref={entryHref}>
            {otherUsersEntry && (
              <ReportButton entryId={entry.id} className={entryMenuItem} />
            )}
            {isOwnEntry && entry.topic && (
              <>
                <Link
                  href={`/baslik/${entry.topic.slug}?duzenle=${entry.id}`}
                  role="menuitem"
                  className={entryMenuItem}
                >
                  düzenle
                </Link>
                <ConfirmButton
                  action={deleteEntry.bind(null, entry.id)}
                  label="sil"
                  title="bu entry silinsin mi?"
                  description="bu işlem geri alınamaz."
                  className={entryMenuItem}
                />
              </>
            )}
            {isStaff && !isOwnEntry && (
              <ConfirmButton
                action={modDeleteEntry.bind(null, entry.id)}
                label="moderasyon sil"
                title="bu entry moderasyon tarafından silinsin mi?"
                description="entry çöp kutusuna taşınır, geri yüklenebilir."
                className={`${entryMenuItem} text-danger`}
              />
            )}
            {otherUsersEntry && author?.allow_messages && (
              <Link
                href={`/mesajlar/${encodeURIComponent(author.username)}`}
                role="menuitem"
                className={entryMenuItem}
              >
                mesaj at
              </Link>
            )}
          </EntryMenu>
        </div>
      </div>

      {author && (
        <div className="mt-3 flex items-center justify-end gap-2.5">
          <div className="min-w-0 text-right">
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              <Link
                href={`/yazar/${encodeURIComponent(author.username)}`}
                className="text-sm font-semibold text-gold-ink hover:underline"
              >
                {author.username}
              </Link>
              {authorEntryCount !== null && (
                <RankBadge entryCount={authorEntryCount} />
              )}
            </div>
            <LocalTime
              iso={entry.created_at}
              className="mt-0.5 block text-xs text-muted"
            />
          </div>
          <Link
            href={`/yazar/${encodeURIComponent(author.username)}`}
            aria-hidden="true"
            tabIndex={-1}
          >
            <Avatar
              username={author.username}
              url={author.avatar_url}
              size="md"
            />
          </Link>
        </div>
      )}
    </article>
  );
}
