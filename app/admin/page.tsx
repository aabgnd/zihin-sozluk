import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { firstParam, formatDate } from "@/lib/text";
import type { Role } from "@/lib/types";
import { getViewer } from "@/lib/viewer";
import { setRole, setStatus } from "./actions";

export const metadata: Metadata = {
  title: "yönetim",
  robots: { index: false, follow: false },
};

type AdminUser = {
  id: string;
  username: string;
  email: string | null;
  role: Role;
  is_banned: boolean;
  is_frozen: boolean;
  created_at: string;
};

const FILTERS = {
  hepsi: "hepsi",
  ucurulan: "uçurulanlar",
  donuk: "dondurulanlar",
  yetkili: "yetkililer",
} as const;

type FilterKey = keyof typeof FILTERS;

function matchesFilter(user: AdminUser, filter: FilterKey) {
  if (filter === "ucurulan") return user.is_banned;
  if (filter === "donuk") return user.is_frozen;
  if (filter === "yetkili") return user.role !== "user";
  return true;
}

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const viewer = await getViewer();
  if (
    !viewer ||
    viewer.is_banned ||
    (viewer.role !== "admin" && viewer.role !== "mod")
  ) {
    notFound();
  }

  const params = await searchParams;
  const query = (firstParam(params.q) ?? "").trim().toLocaleLowerCase("tr");
  const filterParam = firstParam(params.filtre) ?? "";
  const filter: FilterKey =
    filterParam in FILTERS ? (filterParam as FilterKey) : "hepsi";
  const errorMessage = firstParam(params.hata);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_users");
  const allUsers = (data ?? []) as AdminUser[];
  const users = allUsers.filter(
    (user) =>
      matchesFilter(user, filter) &&
      (!query ||
        user.username.includes(query) ||
        (user.email ?? "").toLocaleLowerCase("tr").includes(query)),
  );

  const filterHref = (key: FilterKey) =>
    `/admin?filtre=${key}${query ? `&q=${encodeURIComponent(query)}` : ""}`;

  return (
    <section>
      <header className="px-3 pb-3 pt-4">
        <h1 className="text-xl font-bold">yönetim</h1>
        <p className="mt-1 text-sm text-muted">
          {allUsers.length} yazar ·{" "}
          {allUsers.filter((user) => user.is_banned).length} uçurulmuş ·{" "}
          {allUsers.filter((user) => user.is_frozen).length} dondurulmuş ·
          yetkin:{" "}
          <span className="font-semibold text-gold-ink">{viewer.role}</span>
        </p>
      </header>

      {(errorMessage || error) && (
        <p
          role="alert"
          className="mx-3 mb-3 rounded-sm border border-danger px-3 py-2 text-sm text-danger"
        >
          {errorMessage ?? "kullanıcı listesi alınamadı."}
        </p>
      )}

      <form action="/admin" role="search" className="flex gap-2 px-3 pb-3">
        <input type="hidden" name="filtre" value={filter} />
        <label htmlFor="admin-q" className="sr-only">
          yazar ara
        </label>
        <input
          id="admin-q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="kullanıcı adı ya da e-posta"
          className="h-10 min-w-0 flex-1 rounded-sm border border-line bg-surface px-3 text-base placeholder:text-muted focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          className="h-10 rounded-sm bg-gold px-4 text-sm font-semibold text-on-gold hover:brightness-95"
        >
          ara
        </button>
      </form>

      <nav
        aria-label="filtreler"
        className="flex flex-wrap gap-2 px-3 pb-3 text-sm"
      >
        {(Object.keys(FILTERS) as FilterKey[]).map((key) => (
          <Link
            key={key}
            href={filterHref(key)}
            aria-current={filter === key ? "page" : undefined}
            className={`flex h-9 items-center rounded-full border px-3 ${
              filter === key
                ? "border-gold bg-gold font-semibold text-on-gold"
                : "border-line text-muted hover:text-ink"
            }`}
          >
            {FILTERS[key]}
          </Link>
        ))}
      </nav>

      {users.length === 0 ? (
        <p className="border-t border-line px-3 py-6 text-muted">
          bu filtrede yazar yok.
        </p>
      ) : (
        <ul className="border-t border-line">
          {users.map((user) => (
            <AdminUserRow
              key={user.id}
              user={user}
              viewerId={viewer.id}
              viewerRole={viewer.role}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function AdminUserRow({
  user,
  viewerId,
  viewerRole,
}: {
  user: AdminUser;
  viewerId: string;
  viewerRole: Role;
}) {
  const isSelf = user.id === viewerId;
  const locked =
    isSelf ||
    user.role === "admin" ||
    (viewerRole === "mod" && user.role === "mod");

  return (
    <li className="border-b border-line bg-surface px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/yazar/${encodeURIComponent(user.username)}`}
              className="break-words font-semibold text-gold-ink hover:underline"
            >
              {user.username}
            </Link>
            {user.role !== "user" && <Badge tone="gold">{user.role}</Badge>}
            {user.is_banned && <Badge tone="danger">uçuruldu</Badge>}
            {user.is_frozen && <Badge tone="muted">donduruldu</Badge>}
          </div>
          <p className="mt-0.5 break-all text-xs text-muted">
            {user.email} · katılım {formatDate(user.created_at)}
          </p>
        </div>
      </div>

      {locked ? (
        <p className="mt-2 text-xs text-muted">
          {isSelf ? "kendi hesabın" : "bu hesap üzerinde işlem yapamazsın"}
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          <AdminButton
            action={setStatus.bind(
              null,
              user.id,
              !user.is_banned,
              user.is_frozen,
            )}
            danger={!user.is_banned}
          >
            {user.is_banned ? "banı kaldır" : "uçur"}
          </AdminButton>
          <AdminButton
            action={setStatus.bind(
              null,
              user.id,
              user.is_banned,
              !user.is_frozen,
            )}
          >
            {user.is_frozen ? "hesabı aç" : "dondur"}
          </AdminButton>
          {viewerRole === "admin" && (
            <AdminButton
              action={setRole.bind(
                null,
                user.id,
                user.role === "mod" ? "user" : "mod",
              )}
            >
              {user.role === "mod" ? "modluğu al" : "mod yap"}
            </AdminButton>
          )}
        </div>
      )}
    </li>
  );
}

function AdminButton({
  action,
  danger = false,
  children,
}: {
  action: () => Promise<void>;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <form action={action}>
      <button
        type="submit"
        className={`h-9 rounded-sm border px-3 text-sm font-semibold hover:bg-page ${
          danger ? "border-danger text-danger" : "border-line text-ink"
        }`}
      >
        {children}
      </button>
    </form>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "gold" | "danger" | "muted";
  children: ReactNode;
}) {
  const tones = {
    gold: "border-gold text-gold-ink",
    danger: "border-danger text-danger",
    muted: "border-line text-muted",
  };
  return (
    <span
      className={`rounded-sm border px-1.5 py-px text-[11px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
