import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Avatar from "@/components/Avatar";
import LiveRefresh from "@/components/LiveRefresh";
import MarkRead from "@/components/MarkRead";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/text";
import { getViewer } from "@/lib/viewer";
import { markNotificationsRead } from "./actions";

export const metadata: Metadata = { title: "bildirimler" };

type NotificationType =
  | "upvote"
  | "favorite"
  | "reply"
  | "message"
  | "yazarlik"
  | "takip"
  | "rozet"
  | "entry_silindi"
  | "susturma";

type NotificationRow = {
  id: number;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
  actor: { username: string; avatar_url: string | null } | null;
  entry: {
    id: number;
    content: string;
    deleted_at: string | null;
    topic: { title: string; slug: string } | null;
  } | null;
};

const NOTIFICATION_SELECT =
  "id, type, is_read, created_at, actor:profiles!notifications_actor_id_fkey(username, avatar_url), entry:entries!notifications_entry_id_fkey(id, content, deleted_at, topic:topics!entries_topic_id_fkey(title, slug))";

function describe(notification: NotificationRow, viewerUsername: string) {
  const entry = notification.entry;
  const entryHref = entry?.topic
    ? `/baslik/${entry.topic.slug}#entry-${entry.id}`
    : null;
  const topicHref = entry?.topic ? `/baslik/${entry.topic.slug}` : null;
  const myProfile = `/yazar/${encodeURIComponent(viewerUsername)}`;

  switch (notification.type) {
    case "upvote":
      return { text: "entry'ni artıladı", href: entryHref };
    case "favorite":
      return { text: "entry'ni favoriledi", href: entryHref };
    case "reply":
      return { text: "açtığın başlığa entry girdi", href: entryHref };
    case "message":
      return {
        text: "sana mesaj attı",
        href: notification.actor
          ? `/mesajlar/${encodeURIComponent(notification.actor.username)}`
          : "/mesajlar",
      };
    case "takip":
      return {
        text: "seni takip etti",
        href: notification.actor
          ? `/yazar/${encodeURIComponent(notification.actor.username)}`
          : null,
      };
    case "yazarlik":
      return {
        text: "seni yazarlığa yükseltti. artık yeni başlık açabilirsin.",
        href: myProfile,
      };
    case "rozet":
      return { text: "yeni bir rozet kazandın.", href: myProfile };
    case "entry_silindi":
      return {
        text: "entry'ni kurallara aykırı bulup sildi.",
        href: topicHref,
      };
    case "susturma":
      return { text: "seni susturdu.", href: null };
  }
}

export default async function NotificationsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");

  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select(NOTIFICATION_SELECT)
    .eq("user_id", viewer.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Silinmiş entry'lerin bildirimleri gizlenir; "entry'n silindi" bildirimi hariç.
  const notifications = ((data ?? []) as unknown as NotificationRow[]).filter(
    (notification) =>
      notification.type === "entry_silindi" ||
      !notification.entry ||
      notification.entry.deleted_at === null,
  );
  const newestUnread = notifications.find(
    (notification) => !notification.is_read,
  );

  return (
    <section className="space-y-3">
      <LiveRefresh
        channel={`bildirim-kutusu:${viewer.id}`}
        subscriptions={[
          { table: "notifications", filter: `user_id=eq.${viewer.id}` },
        ]}
      />
      {newestUnread && (
        <MarkRead key={newestUnread.id} action={markNotificationsRead} />
      )}

      <h1 className="text-xl font-bold">bildirimler</h1>

      {notifications.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-4 leading-relaxed text-muted shadow-sm">
          {
            "henüz bildirimin yok. entry'lerin artılanınca, favorilenince, biri seni takip edince ya da sana mesaj gelince burada görünecek."
          }
        </p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
          {notifications.map((notification) => {
            const { text, href } = describe(notification, viewer.username);
            const actorName = notification.actor?.username ?? "zihin sözlük";
            const body = (
              <>
                <Avatar
                  username={actorName}
                  url={notification.actor?.avatar_url ?? null}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] leading-snug">
                    <span className="font-semibold text-gold-ink">
                      {actorName}
                    </span>{" "}
                    {text}
                    {!notification.is_read && (
                      <span className="ml-2 rounded-full bg-alert px-2 py-px text-[11px] font-bold text-on-alert">
                        yeni
                      </span>
                    )}
                  </p>
                  {notification.entry && (
                    <p className="mt-0.5 line-clamp-2 break-words text-sm text-muted">
                      {notification.entry.topic && (
                        <span className="font-semibold">
                          {notification.entry.topic.title}:{" "}
                        </span>
                      )}
                      {notification.entry.content}
                    </p>
                  )}
                  <time
                    dateTime={notification.created_at}
                    className="mt-0.5 block text-xs text-muted"
                  >
                    {formatDateTime(notification.created_at)}
                  </time>
                </div>
              </>
            );

            return (
              <li
                key={notification.id}
                className={notification.is_read ? "" : "bg-page"}
              >
                {href ? (
                  <Link
                    href={href}
                    className="flex gap-3 px-4 py-3 hover:bg-page"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="flex gap-3 px-4 py-3">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
