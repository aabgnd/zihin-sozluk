import Link from "next/link";
import { notFound } from "next/navigation";
import { blockUser, unblockUser } from "@/app/ayarlar/actions";
import Avatar from "@/components/Avatar";
import BadgeList from "@/components/BadgeList";
import EntryCard from "@/components/EntryCard";
import FollowButton from "@/components/FollowButton";
import TitleBadge from "@/components/TitleBadge";
import UserList, { type UserListItem } from "@/components/UserList";
import ZihinOzet, { type SummaryRow } from "@/components/ZihinOzet";
import { ENTRY_SELECT, getViewerEntryState } from "@/lib/entries";
import { createClient } from "@/lib/supabase/server";
import { firstParam, formatDate, safeDecode } from "@/lib/text";
import type { EntryRow, PublicProfile } from "@/lib/types";
import { getViewer, PROFILE_COLUMNS } from "@/lib/viewer";

const outlineButton =
  "flex h-10 items-center rounded-lg border border-line px-4 text-sm font-semibold hover:bg-page";

const TABS = ["entryler", "favoriler", "takipciler", "takipedilenler"] as const;
type TabKey = (typeof TABS)[number];

type Stats = {
  entry_count: number;
  upvote_total: number;
  follower_count: number;
  following_count: number;
};

export default async function AuthorPage({
  params,
  searchParams,
}: PageProps<"/yazar/[username]">) {
  const username = safeDecode((await params).username);
  const query = await searchParams;
  const tabParam = firstParam(query.sekme) ?? "";
  const tab: TabKey = (TABS as readonly string[]).includes(tabParam)
    ? (tabParam as TabKey)
    : "entryler";
  const period = firstParam(query.ozet) === "yil" ? "yil" : "ay";

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

  const [statsResult, badgeResult, summaryResult, followResult, blockResult] =
    await Promise.all([
      supabase.rpc("profile_stats", { target: profile.id }),
      supabase.from("user_badges").select("badge").eq("user_id", profile.id),
      supabase.rpc("profile_summary", { target: profile.id, period }),
      viewer && !isOwnProfile
        ? supabase
            .from("follows")
            .select("follower_id")
            .eq("follower_id", viewer.id)
            .eq("following_id", profile.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      viewer && !isOwnProfile
        ? supabase
            .from("blocks")
            .select("id")
            .eq("blocker_id", viewer.id)
            .eq("blocked_id", profile.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const stats = (
    Array.isArray(statsResult.data) ? statsResult.data[0] : statsResult.data
  ) as Stats | undefined;
  const badges = ((badgeResult.data ?? []) as { badge: string }[]).map(
    (row) => row.badge,
  );
  const summary = (
    Array.isArray(summaryResult.data)
      ? summaryResult.data[0]
      : summaryResult.data
  ) as SummaryRow | undefined;
  const isFollowing = Boolean(followResult.data);
  const isBlocked = Boolean(blockResult.data);

  const profileHref = `/yazar/${encodeURIComponent(profile.username)}`;
  const tabHref = (key: TabKey) =>
    key === "entryler" ? profileHref : `${profileHref}?sekme=${key}`;
  const tabClass = (active: boolean) =>
    `flex h-11 items-center border-b-2 px-3 text-sm ${
      active
        ? "border-gold font-bold text-ink"
        : "border-transparent text-muted hover:text-ink"
    }`;

  return (
    <section className="space-y-3">
      <header className="rounded-xl border border-line bg-surface shadow-sm">
        <div className="flex items-start gap-4 p-4">
          <Avatar
            username={profile.username}
            url={profile.avatar_url}
            size="lg"
          />
          <div className="min-w-0 space-y-1.5">
            <h1 className="break-words text-xl font-bold">
              {profile.username}
              {profile.status === "caylak" && (
                <span className="ml-2 align-middle text-xs font-normal text-muted">
                  çaylak
                </span>
              )}
            </h1>
            <div className="flex flex-wrap items-center gap-1.5">
              <TitleBadge
                generation={profile.generation}
                title={profile.title}
              />
              <BadgeList badges={badges} />
            </div>
            <p className="text-sm text-muted">
              {stats?.entry_count ?? 0} entry · {stats?.upvote_total ?? 0} artı
              oy · {stats?.follower_count ?? 0} takipçi · katılım{" "}
              {formatDate(profile.created_at)}
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
                {!isBlocked && (
                  <FollowButton
                    targetId={profile.id}
                    isFollowing={isFollowing}
                  />
                )}
                {!viewer.isWriter ? (
                  <p className="text-sm text-muted">
                    yazar olduğunda yeni başlık açabilir ve mesaj
                    gönderebilirsin.
                  </p>
                ) : profile.allow_messages ? (
                  <Link
                    href={`/mesajlar/${encodeURIComponent(profile.username)}`}
                    className="flex h-10 items-center rounded-lg border border-line px-4 text-sm font-semibold hover:bg-page"
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
          className="flex flex-wrap border-t border-line px-2"
        >
          <Link
            href={tabHref("entryler")}
            aria-current={tab === "entryler" ? "page" : undefined}
            className={tabClass(tab === "entryler")}
          >
            {`entry'leri (${stats?.entry_count ?? 0})`}
          </Link>
          <Link
            href={tabHref("favoriler")}
            aria-current={tab === "favoriler" ? "page" : undefined}
            className={tabClass(tab === "favoriler")}
          >
            favorileri
          </Link>
          <Link
            href={tabHref("takipciler")}
            aria-current={tab === "takipciler" ? "page" : undefined}
            className={tabClass(tab === "takipciler")}
          >
            {`takipçiler (${stats?.follower_count ?? 0})`}
          </Link>
          <Link
            href={tabHref("takipedilenler")}
            aria-current={tab === "takipedilenler" ? "page" : undefined}
            className={tabClass(tab === "takipedilenler")}
          >
            {`takip edilenler (${stats?.following_count ?? 0})`}
          </Link>
        </nav>
      </header>

      <ZihinOzet
        summary={summary ?? null}
        period={period}
        basePath={profileHref}
      />

      {tab === "takipciler" || tab === "takipedilenler" ? (
        <FollowListSection profileId={profile.id} tab={tab} />
      ) : (
        <EntryListSection
          profileId={profile.id}
          showFavorites={tab === "favoriler"}
        />
      )}
    </section>
  );

  async function FollowListSection({
    profileId,
    tab,
  }: {
    profileId: string;
    tab: TabKey;
  }) {
    const showFollowers = tab === "takipciler";
    const { data: rows } = showFollowers
      ? await supabase
          .from("follows")
          .select(
            "profil:profiles!follows_follower_id_fkey(username, avatar_url, status)",
          )
          .eq("following_id", profileId)
          .order("created_at", { ascending: false })
          .limit(100)
      : await supabase
          .from("follows")
          .select(
            "profil:profiles!follows_following_id_fkey(username, avatar_url, status)",
          )
          .eq("follower_id", profileId)
          .order("created_at", { ascending: false })
          .limit(100);

    const users = (
      (rows ?? []) as unknown as { profil: UserListItem | null }[]
    ).flatMap((row) => (row.profil ? [row.profil] : []));

    return (
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        <UserList
          users={users}
          empty={
            showFollowers
              ? "henüz takipçisi yok."
              : "henüz kimseyi takip etmiyor."
          }
        />
      </div>
    );
  }

  async function EntryListSection({
    profileId,
    showFavorites,
  }: {
    profileId: string;
    showFavorites: boolean;
  }) {
    const { data: rows } = showFavorites
      ? await supabase
          .from("favorites")
          .select(
            `entry:entries!favorites_entry_id_fkey!inner(${ENTRY_SELECT})`,
          )
          .eq("user_id", profileId)
          .is("entry.deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(20)
      : await supabase
          .from("entries")
          .select(ENTRY_SELECT)
          .eq("user_id", profileId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(20);

    const entries = (
      showFavorites
        ? ((rows ?? []) as unknown as { entry: EntryRow | null }[]).flatMap(
            (row) => (row.entry ? [row.entry] : []),
          )
        : ((rows ?? []) as unknown as EntryRow[])
    ) as EntryRow[];

    const { votes, favorites } = await getViewerEntryState(
      viewer?.id ?? null,
      entries.map((entry) => entry.id),
    );

    if (entries.length === 0) {
      return (
        <p className="rounded-xl border border-line bg-surface p-4 text-muted shadow-sm">
          {showFavorites
            ? "henüz favorilediği entry yok."
            : "henüz entry girmemiş."}
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            viewerId={viewer?.id ?? null}
            isStaff={viewer?.isStaff ?? false}
            myVote={votes.get(entry.id)}
            favorited={favorites.has(entry.id)}
            showTopic
          />
        ))}
      </div>
    );
  }
}
