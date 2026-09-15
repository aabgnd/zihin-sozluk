import Link from "next/link";
import { toggleFavorite, vote } from "@/app/baslik/actions";
import { formatDateTime } from "@/lib/text";
import type { EntryRow } from "@/lib/types";
import Avatar from "./Avatar";
import { ChevronDownIcon, ChevronUpIcon, HeartIcon } from "./icons";
import TitleBadge from "./TitleBadge";

type Props = {
  entry: EntryRow;
  viewerId?: string | null;
  myVote?: number;
  favorited?: boolean;
  showTopic?: boolean;
};

const actionButton =
  "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-sm px-2 hover:bg-surface hover:text-ink";

export default function EntryCard({
  entry,
  viewerId = null,
  myVote = 0,
  favorited = false,
  showTopic = false,
}: Props) {
  const favoriteCount = entry.favorites[0]?.count ?? 0;
  const { author } = entry;
  const showMessageAction = Boolean(
    viewerId && author && author.id !== viewerId,
  );

  return (
    <article className="border-b border-line px-3 py-4">
      {showTopic && entry.topic && (
        <h3 className="mb-1.5 text-base font-bold">
          <Link
            href={`/baslik/${entry.topic.slug}`}
            className="hover:text-gold-ink"
          >
            {entry.topic.title}
          </Link>
        </h3>
      )}

      <p className="whitespace-pre-line break-words text-[15px] leading-7">
        {entry.content}
      </p>

      <footer className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted">
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
          {showMessageAction &&
            author &&
            (author.allow_messages ? (
              <Link
                href={`/mesajlar/${encodeURIComponent(author.username)}`}
                className={`${actionButton} font-semibold`}
              >
                mesaj at
              </Link>
            ) : (
              <span className="px-2 text-[11px]">
                bu yazar özel mesajlarını kapattı
              </span>
            ))}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 lg:flex-col lg:items-end lg:gap-0.5">
            <time dateTime={entry.created_at} className="lg:order-last">
              {formatDateTime(entry.created_at)}
            </time>
            {author && (
              <>
                <Link
                  href={`/yazar/${encodeURIComponent(author.username)}`}
                  className="inline-flex items-center gap-1.5 font-semibold text-gold-ink hover:underline lg:text-sm"
                >
                  <span className="lg:hidden">
                    <Avatar
                      username={author.username}
                      url={author.avatar_url}
                    />
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
            <span className="hidden lg:block">
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
