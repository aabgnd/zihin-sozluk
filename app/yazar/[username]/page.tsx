import Link from "next/link";
import { notFound } from "next/navigation";
import { blockUser, unblockUser } from "@/app/ayarlar/actions";
import Avatar from "@/components/Avatar";
import EntryCard from "@/components/EntryCard";
import TitleBadge from "@/components/TitleBadge";
import { ENTRY_SELECT, getViewerEntryState } from "@/lib/entries";
import { createClient } from "@/lib/supabase/server";
import { firstParam, formatDate, safeDecode } from "@/lib/text";
import type { EntryRow, PublicProfile } from "@/lib/types";
import { getViewer, PROFILE_COLUMNS } from "@/lib/viewer";

const outlineButton =
  "flex h-10 items-center rounded-lg border border-line px-4 text-sm font-semibold hover:bg-page";

export default async function AuthorPage({
  params,
  searchParams,
}: PageProps<"/yazar/[username]">) {
  const username = safeDecode((await params).username);
  const showFavorites = firstParam((await searchParams).sekme) === "favoriler";
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("username", username)
    .maybeSingle();
  const profile = data as PublicProfile | null;
  if (!profile) notFound();

  const viewer = await getViewer();
  const isOwnProfile = viewer?.id === profile.id;

  const [entryCountResult, favoriteCountResult, listResult, blockResult] =
    await Promise.all([
      supabase
        .from("entries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .is("deleted_at", null),
      supabase
        .from("favorites")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id),
      showFavorites
        ? supabase
            .from("favorites")
            .select(
              `entry:entries!favorites_entry_id_fkey!inner(${ENTRY_SELECT})`,
            )
            .eq("user_id", profile.id)
            .is("entry.deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(20)
        : supabase
            .from("entries")
            .select(ENTRY_SELECT)
            .eq("user_id", profile.id)
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(20),
      viewer && !isOwnProfile
        ? supabase
            .from("blocks")
            .select("id")
            .eq("blocker_id", viewer.id)
            .eq("blocked_id", profile.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const rows = (listResult.data ?? []) as unknown[];
  const entries = (
    showFavorites
      ? (rows as { entry: EntryRow | null }[]).flatMap((row) =>
          row.entry ? [row.entry] : [],
        )
      : rows
  ) as EntryRow[];
  const isBlocked = Boolean(blockResult.data);
  const { votes, favorites } = await getViewerEntryState(
    viewer?.id ?? null,
    entries.map((entry) => entry.id),
  );

  const profileHref = `/yazar/${encodeURIComponent(profile.username)}`;
  const tabClass = (active: boolean) =>
    `flex h-11 items-center border-b-2 px-3 text-sm ${
      active
        ? "border-gold font-bold text-ink"
        : "border-transparent text-muted hover:text-ink"
    }`;

  return (
    <section className="space-y-3">
      <header className="rounded-xl border border-line bg-surface shadow-sm">
        <div className="flex items-center gap-4 p-4">
          <Avatar
            username={profile.username}
            url={profile.avatar_url}
            size="lg"
          />
          <div className="min-w-0 space-y-1">
            <h1 className="break-words text-xl font-bold">
              {profile.username}
              {profile.status === "caylak" && (
                <span className="ml-2 align-middle text-xs font-normal text-muted">
                  çaylak
                </span>
              )}
            </h1>
            <div>
              <TitleBadge
                generation={profile.generation}
                title={profile.title}
              />
            </div>
            <p className="text-sm text-muted">
              katılım {formatDate(profile.created_at)}
            </p>
            {profile.is_banned && (
              <p className="text-sm font-semibold text-danger">
                bu yazar uçuruldu.
              </p>
            )}
            {!profile.is_banned && profile.is_frozen && (
              <p className="text-sm text-muted">
                bu yazarın hesabı donduruldu.
              </p>
            )}
          </div>
        </div>

        {viewer && (
          <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
            {isOwnProfile ? (
              <Link href="/ayarlar" className={outlineButton}>
                ayarlar
              </Link>
            ) : (
              <>
                {!viewer.isWriter ? (
                  <p className="text-sm text-muted">
                    yazar olduğunda yeni başlık açabilir ve mesaj
                    gönderebilirsin.
                  </p>
                ) : profile.allow_messages ? (
                  <Link
                    href={`/mesajlar/${encodeURIComponent(profile.username)}`}
                    className="flex h-10 items-center rounded-lg bg-gold px-4 text-sm font-bold text-on-gold hover:brightness-95"
                  >
                    mesaj at
                  </Link>
                ) : (
                  <p className="text-sm text-muted">
                    bu yazar özel mesajlarını kapattı.
                  </p>
                )}
                <form
                  action={(isBlocked ? unblockUser : blockUser).bind(
                    null,
                    profile.id,
                  )}
                >
                  <button type="submit" className={outlineButton}>
                    {isBlocked ? "engeli kaldır" : "engelle"}
                  </button>
                </form>
              </>
            )}
          </div>
        )}

        <nav
          aria-label="profil sekmeleri"
          className="flex border-t border-line px-2"
        >
          <Link
            href={profileHref}
            aria-current={showFavorites ? undefined : "page"}
            className={tabClass(!showFavorites)}
          >
            {`entry'leri (${entryCountResult.count ?? 0})`}
          </Link>
          <Link
            href={`${profileHref}?sekme=favoriler`}
            aria-current={showFavorites ? "page" : undefined}
            className={tabClass(showFavorites)}
          >
            {`favorileri (${favoriteCountResult.count ?? 0})`}
          </Link>
        </nav>
      </header>

      {entries.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-4 text-muted shadow-sm">
          {showFavorites
            ? "henüz favorilediği entry yok."
            : "henüz entry girmemiş."}
        </p>
      ) : (
        entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            viewerId={viewer?.id ?? null}
            isStaff={viewer?.isStaff ?? false}
            myVote={votes.get(entry.id)}
            favorited={favorites.has(entry.id)}
            showTopic
          />
        ))
      )}
    </section>
  );
}
