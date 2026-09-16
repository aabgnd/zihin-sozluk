import Link from "next/link";
import Avatar from "./Avatar";

export type UserListItem = {
  username: string;
  avatar_url: string | null;
  status: string;
};

export default function UserList({
  users,
  empty,
}: {
  users: UserListItem[];
  empty: string;
}) {
  if (users.length === 0) {
    return <p className="px-4 py-4 text-muted">{empty}</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {users.map((user) => (
        <li key={user.username}>
          <Link
            href={`/yazar/${encodeURIComponent(user.username)}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-page"
          >
            <Avatar username={user.username} url={user.avatar_url} size="md" />
            <span className="break-words font-semibold">{user.username}</span>
            {user.status === "caylak" && (
              <span className="text-xs text-muted">çaylak</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
