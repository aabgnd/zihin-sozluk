import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import ConfirmButton from "@/components/ConfirmButton";
import {
  isPermanentMute,
  MOD_ACTION_LABELS,
  MUTE_OPTIONS,
  REASON_LABELS,
} from "@/lib/moderation";
import { createClient } from "@/lib/supabase/server";
import { firstParam, formatDate, formatDateTime } from "@/lib/text";
import type {
  ModLogRow,
  ModUser,
  PendingWriter,
  ReportRow,
  Role,
  TrashRow,
} from "@/lib/types";
import { getViewer } from "@/lib/viewer";
import {
  modDeclineWriter,
  modDeleteEntry,
  modHandleReport,
  modMuteForm,
  modPurgeEntry,
  modPurgeTopic,
  modRestoreEntry,
  modRestoreTopic,
  modSetAccount,
  modSetRole,
  modSetStatus,
  modUnmute,
} from "./actions";

export const metadata: Metadata = {
  title: "yönetim",
  robots: { index: false, follow: false },
};

const TABS = {
  sikayetler: "şikayetler",
  yazarlik: "yazarlık onayı",
  kullanicilar: "kullanıcılar",
  cop: "çöp kutusu",
  kayit: "işlem kaydı",
} as const;

type TabKey = keyof typeof TABS;

type UserEntry = {
  id: number;
  content: string;
  topic_title: string;
  topic_slug: string;
  created_at: string;
};

const card = "rounded-xl border border-line bg-surface p-4 shadow-sm";
const smallButton =
  "h-9 rounded-lg border border-line px-3 text-xs font-semibold hover:bg-page";
const dangerButton =
  "h-9 rounded-lg border border-danger px-3 text-xs font-semibold text-danger hover:bg-page";

export default async function ModerationPage({
  searchParams,
}: PageProps<"/yonetim">) {
  const viewer = await getViewer();
  if (!viewer || viewer.is_banned || !viewer.isStaff) redirect("/");

  const params = await searchParams;
  const tabParam = firstParam(params.sekme) ?? "";
  const tab: TabKey = tabParam in TABS ? (tabParam as TabKey) : "sikayetler";
  const search = (firstParam(params.q) ?? "").trim();
  const errorMessage = firstParam(params.hata);

  return (
    <section className="space-y-3">
      <header className={card}>
        <h1 className="text-xl font-bold">yönetim</h1>
        <p className="mt-1 text-sm text-muted">
          yetkin:{" "}
          <span className="font-semibold text-gold-ink">{viewer.role}</span>
        </p>
        {errorMessage && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-danger px-3 py-2 text-sm text-danger"
          >
            {errorMessage}
          </p>
        )}
        <nav
          aria-label="yönetim sekmeleri"
          className="mt-3 flex flex-wrap gap-2 text-sm"
        >
          {(Object.keys(TABS) as TabKey[]).map((key) => (
            <Link
              key={key}
              href={`/yonetim?sekme=${key}`}
              aria-current={tab === key ? "page" : undefined}
              className={`flex h-9 items-center rounded-full border px-3 ${
                tab === key
                  ? "border-gold bg-gold font-bold text-on-gold"
                  : "border-line text-muted hover:text-ink"
              }`}
            >
              {TABS[key]}
            </Link>
          ))}
        </nav>
      </header>

      {tab === "sikayetler" && <ReportsTab />}
      {tab === "yazarlik" && <PendingWritersTab />}
      {tab === "kullanicilar" && (
        <UsersTab search={search} viewerRole={viewer.role} />
      )}
      {tab === "cop" && <TrashTab isAdmin={viewer.role === "admin"} />}
      {tab === "kayit" && <LogTab />}
    </section>
  );
}

async function ReportsTab() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("mod_list_reports", {
    report_status: "acik",
  });
  const reports = (data ?? []) as ReportRow[];

  if (reports.length === 0) {
    return <p className={`${card} text-muted`}>açık şikayet yok.</p>;
  }

  return (
    <ul className="space-y-3">
      {reports.map((report) => (
        <li key={report.entry_id} className={card}>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <Link
              href={`/baslik/${report.topic_slug}#entry-${report.entry_id}`}
              className="font-semibold text-gold-ink hover:underline"
            >
              {report.topic_title}
            </Link>
            <span>·</span>
            <Link
              href={`/yazar/${encodeURIComponent(report.author_username)}`}
              className="font-semibold hover:underline"
            >
              {report.author_username}
            </Link>
            {report.author_status === "caylak" && <span>(çaylak)</span>}
            <span>·</span>
            <time dateTime={report.last_report_at}>
              {formatDateTime(report.last_report_at)}
            </time>
            <span className="rounded-full bg-alert px-2 py-px font-bold text-on-alert">
              {report.report_count} şikayet
            </span>
            {report.entry_deleted && (
              <span className="font-semibold">silinmiş</span>
            )}
          </div>

          <p className="mt-2 whitespace-pre-line break-words text-[15px] leading-7">
            {report.content}
          </p>

          <p className="mt-2 text-xs text-muted">
            sebep:{" "}
            {report.reasons
              .map((reason) => REASON_LABELS[reason] ?? reason)
              .join(", ")}
          </p>
          {report.notes.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-xs text-muted">
              {report.notes.map((note, index) => (
                <li key={index}>“{note}”</li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!report.entry_deleted && (
              <ConfirmButton
                action={modDeleteEntry.bind(null, report.entry_id)}
                label="entry'yi sil"
                title="entry silinsin mi?"
                description="çöp kutusuna taşınır, geri yüklenebilir."
                className={dangerButton}
              />
            )}
            <MuteForm userId={report.author_id} />
            <ActionButton
              action={modSetStatus.bind(null, report.author_id, "caylak")}
            >
              çaylaklığa düşür
            </ActionButton>
            <ActionButton
              action={modSetAccount.bind(null, report.author_id, false, true)}
            >
              hesabı dondur
            </ActionButton>
            <ActionButton
              action={modHandleReport.bind(null, report.entry_id, "reddedildi")}
            >
              şikayeti reddet
            </ActionButton>
          </div>
        </li>
      ))}
    </ul>
  );
}

async function PendingWritersTab() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("mod_pending_writers");
  const pending = (data ?? []) as PendingWriter[];

  if (pending.length === 0) {
    return <p className={`${card} text-muted`}>yazarlık onayı bekleyen yok.</p>;
  }

  const entryLists = await Promise.all(
    pending.map((writer) =>
      supabase.rpc("mod_user_entries", { target: writer.id }),
    ),
  );

  return (
    <ul className="space-y-3">
      {pending.map((writer, index) => {
        const entries = (entryLists[index].data ?? []) as UserEntry[];

        return (
          <li key={writer.id} className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link
                  href={`/yazar/${encodeURIComponent(writer.username)}`}
                  className="font-bold text-gold-ink hover:underline"
                >
                  {writer.username}
                </Link>
                <p className="text-xs text-muted">
                  {writer.entry_count} entry · katılım{" "}
                  {formatDate(writer.created_at)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  action={modSetStatus.bind(null, writer.id, "yazar")}
                >
                  yazar yap
                </ActionButton>
                <ActionButton action={modDeclineWriter.bind(null, writer.id)}>
                  çaylak kalsın
                </ActionButton>
              </div>
            </div>

            <ul className="mt-3 space-y-2">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-lg border border-line bg-page p-3"
                >
                  <Link
                    href={`/baslik/${entry.topic_slug}#entry-${entry.id}`}
                    className="text-xs font-semibold text-gold-ink hover:underline"
                  >
                    {entry.topic_title}
                  </Link>
                  <p className="mt-1 whitespace-pre-line break-words text-sm leading-6">
                    {entry.content}
                  </p>
                  <time
                    dateTime={entry.created_at}
                    className="mt-1 block text-xs text-muted"
                  >
                    {formatDateTime(entry.created_at)}
                  </time>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

async function UsersTab({
  search,
  viewerRole,
}: {
  search: string;
  viewerRole: Role;
}) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("mod_list_users", { search });
  const users = (data ?? []) as ModUser[];

  return (
    <div className="space-y-3">
      <form action="/yonetim" role="search" className={`${card} flex gap-2`}>
        <input type="hidden" name="sekme" value="kullanicilar" />
        <label htmlFor="yonetim-q" className="sr-only">
          kullanıcı ara
        </label>
        <input
          id="yonetim-q"
          name="q"
          type="search"
          defaultValue={search}
          placeholder="kullanıcı adı ya da e-posta"
          className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-page px-3 text-base placeholder:text-muted focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          className="h-11 rounded-lg bg-gold px-4 text-sm font-bold text-on-gold hover:brightness-95"
        >
          ara
        </button>
      </form>

      {users.length === 0 ? (
        <p className={`${card} text-muted`}>kullanıcı bulunamadı.</p>
      ) : (
        <ul className="space-y-3">
          {users.map((user) => {
            const muted = Boolean(
              user.muted_until && new Date(user.muted_until) > new Date(),
            );
            return (
              <li key={user.id} className={card}>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/yazar/${encodeURIComponent(user.username)}`}
                    className="font-bold text-gold-ink hover:underline"
                  >
                    {user.username}
                  </Link>
                  <Chip>{user.status}</Chip>
                  {user.role !== "user" && <Chip>{user.role}</Chip>}
                  {user.is_banned && <Chip tone="danger">uçuruldu</Chip>}
                  {user.is_frozen && <Chip>donduruldu</Chip>}
                  {muted && user.muted_until && (
                    <Chip tone="danger">
                      {isPermanentMute(user.muted_until)
                        ? "süresiz susturuldu"
                        : `susturuldu: ${formatDateTime(user.muted_until)}`}
                    </Chip>
                  )}
                </div>
                <p className="mt-0.5 break-all text-xs text-muted">
                  {user.email} · {user.entry_count} entry · katılım{" "}
                  {formatDate(user.created_at)}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <MuteForm userId={user.id} />
                  {muted && (
                    <ActionButton action={modUnmute.bind(null, user.id)}>
                      susturmayı kaldır
                    </ActionButton>
                  )}
                  <ActionButton
                    action={modSetStatus.bind(
                      null,
                      user.id,
                      user.status === "yazar" ? "caylak" : "yazar",
                    )}
                  >
                    {user.status === "yazar" ? "çaylaklığa düşür" : "yazar yap"}
                  </ActionButton>
                  <ActionButton
                    action={modSetAccount.bind(
                      null,
                      user.id,
                      user.is_banned,
                      !user.is_frozen,
                    )}
                  >
                    {user.is_frozen ? "hesabı aç" : "dondur"}
                  </ActionButton>
                  <ActionButton
                    action={modSetAccount.bind(
                      null,
                      user.id,
                      !user.is_banned,
                      user.is_frozen,
                    )}
                    danger={!user.is_banned}
                  >
                    {user.is_banned ? "banı kaldır" : "uçur"}
                  </ActionButton>
                  {viewerRole === "admin" && user.role !== "admin" && (
                    <ActionButton
                      action={modSetRole.bind(
                        null,
                        user.id,
                        user.role === "mod" ? "user" : "mod",
                      )}
                    >
                      {user.role === "mod" ? "modluğu al" : "mod yap"}
                    </ActionButton>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

async function TrashTab({ isAdmin }: { isAdmin: boolean }) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("mod_trash");
  const rows = (data ?? []) as TrashRow[];

  if (rows.length === 0) {
    return <p className={`${card} text-muted`}>çöp kutusu boş.</p>;
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={`${row.kind}-${row.id}`} className={card}>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <Chip>{row.kind === "baslik" ? "başlık" : "entry"}</Chip>
            <span className="font-semibold">{row.title}</span>
            {row.author_username && <span>· {row.author_username}</span>}
            <span>· silen: {row.deleted_by_username ?? "bilinmiyor"}</span>
            <time dateTime={row.deleted_at}>
              {formatDateTime(row.deleted_at)}
            </time>
          </div>
          {row.content && (
            <p className="mt-2 whitespace-pre-line break-words text-sm leading-6">
              {row.content}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionButton
              action={
                row.kind === "baslik"
                  ? modRestoreTopic.bind(null, row.id)
                  : modRestoreEntry.bind(null, row.id)
              }
            >
              geri yükle
            </ActionButton>
            {isAdmin && (
              <ConfirmButton
                action={
                  row.kind === "baslik"
                    ? modPurgeTopic.bind(null, row.id)
                    : modPurgeEntry.bind(null, row.id)
                }
                label="kalıcı olarak sil"
                title="kalıcı olarak silinsin mi?"
                description="bu işlem geri alınamaz."
                className={dangerButton}
              />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

async function LogTab() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("mod_log_list");
  const rows = (data ?? []) as ModLogRow[];

  if (rows.length === 0) {
    return <p className={`${card} text-muted`}>henüz işlem kaydı yok.</p>;
  }

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      {rows.map((row) => (
        <li key={row.id} className="px-4 py-3 text-sm">
          <span className="font-semibold">
            {row.actor_username ?? "bilinmiyor"}
          </span>{" "}
          <span className="text-muted">
            {MOD_ACTION_LABELS[row.action] ?? row.action}
          </span>
          {row.target_username && <span> · {row.target_username}</span>}
          {row.detail && <span className="text-muted"> · {row.detail}</span>}
          <time
            dateTime={row.created_at}
            className="mt-0.5 block text-xs text-muted"
          >
            {formatDateTime(row.created_at)}
          </time>
        </li>
      ))}
    </ul>
  );
}

function MuteForm({ userId }: { userId: string }) {
  return (
    <form
      action={modMuteForm.bind(null, userId)}
      className="flex items-center gap-1.5"
    >
      <label htmlFor={`sure-${userId}`} className="sr-only">
        susturma süresi
      </label>
      <select
        id={`sure-${userId}`}
        name="sure"
        className="h-9 rounded-lg border border-line bg-page px-2 text-xs"
      >
        {MUTE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button type="submit" className={smallButton}>
        sustur
      </button>
    </form>
  );
}

function ActionButton({
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
      <button type="submit" className={danger ? dangerButton : smallButton}>
        {children}
      </button>
    </form>
  );
}

function Chip({
  tone = "muted",
  children,
}: {
  tone?: "muted" | "danger";
  children: ReactNode;
}) {
  return (
    <span
      className={`rounded-md border px-1.5 py-px text-[11px] font-semibold ${
        tone === "danger"
          ? "border-danger text-danger"
          : "border-line text-muted"
      }`}
    >
      {children}
    </span>
  );
}
