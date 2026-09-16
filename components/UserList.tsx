import Link from "next/link";
import Avatar from "./Avatar";
import FollowButton from "./FollowButton";
import RankBadge from "./RankBadge";

export type UserListItem = {
  id: string;
  username: string;
  avatar_url: string | null;
  entry_count: number | null;
};

export default function UserList({
  users,
  empty,
  viewerId = null,
  followingIds,
}: {
  users: UserListItem[];
  empty: string;
  viewerId?: string | null;
  followingIds?: Set<string>;
}) {
  if (users.length === 0) {
    return <p className="px-4 py-4 text-muted">{empty}</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {users.map((user) => (
        <li key={user.id} className="flex items-center gap-3 px-4 py-3">
          <Link
            href={`/yazar/${encodeURIComponent(user.username)}`}
            className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-90"
          >
            <Avatar username={user.username} url={user.avatar_url} size="md" />
            <span className="min-w-0">
              <span className="block break-words font-semibold">{user.username}</span>
              {user.entry_count !== null && (
                <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
                  <RankBadge entryCount={user.entry_count} />
                  <span>· {user.entry_count} entry</span>
                </span>
              )}
            </span>
          </Link>

          {viewerId && viewerId !== user.id && (
            <div className="shrink-0">
              {followingIds?.has(user.id) ? (
                <span className="text-[13px] font-semibold text-muted">takip ediliyor</span>
              ) : (
                <FollowButton targetId={user.id} isFollowing={false} size="sm" />
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
