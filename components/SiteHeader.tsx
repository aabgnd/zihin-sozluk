import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";
import AccountNav from "./AccountNav";
import InfoModal from "./InfoModal";
import LiveRefresh from "./LiveRefresh";
import MobileSearch from "./MobileSearch";
import SearchForm from "./SearchForm";
import TabBar, { TabLinks } from "./TabBar";
import ThemeToggle from "./ThemeToggle";

// Dokunma alanı 44px.
const iconButton =
  "relative grid size-11 place-items-center rounded-md text-ink hover:bg-surface-2";

export default async function SiteHeader() {
  const viewer = await getViewer();

  let unreadMessages = 0;
  let unreadNotifications = 0;
  if (viewer) {
    const supabase = await createClient();
    const [messages, notifications] = await Promise.all([
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", viewer.id)
        .eq("is_read", false),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", viewer.id)
        .eq("is_read", false),
    ]);
    unreadMessages = messages.count ?? 0;
    unreadNotifications = notifications.count ?? 0;
  }

  return (
    <header className="bg-surface">
      {viewer && (
        <LiveRefresh
          channel={`kullanici:${viewer.id}`}
          listenForSync
          subscriptions={[
            { table: "messages", filter: `receiver_id=eq.${viewer.id}` },
            { table: "messages", filter: `sender_id=eq.${viewer.id}` },
            { table: "notifications", filter: `user_id=eq.${viewer.id}` },
          ]}
        />
      )}

      {/* Sarı sadece ince şerit olarak. */}
      <div className="h-1 bg-gold" />

      <div className="relative border-b border-line">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-3 px-4">
          <Link
            href="/"
            aria-label="zihin sözlük ana sayfa"
            className="shrink-0 text-lg font-extrabold lowercase tracking-tight sm:text-xl md:text-2xl"
          >
            <span className="text-logo">zihin</span>
            <span className="ml-[0.1em] text-ink">sözlük</span>
          </Link>

          <SearchForm
            inputId="q-genis"
            className="mx-auto hidden w-full max-w-xl md:flex"
          />

          <div className="ml-auto flex items-center gap-0.5 md:ml-0">
            <div className="md:hidden">
              <MobileSearch buttonClassName={iconButton} />
            </div>
            <InfoModal className={iconButton} />
            <ThemeToggle className={iconButton} />

            {viewer ? (
              <AccountNav
                viewer={viewer}
                unreadMessages={unreadMessages}
                unreadNotifications={unreadNotifications}
                iconButtonClass={iconButton}
              />
            ) : (
              <>
                <Link
                  href="/giris"
                  className="hidden h-11 items-center rounded-md px-3 text-[15px] hover:bg-surface-2 sm:flex"
                >
                  giriş
                </Link>
                <Link
                  href="/kayit"
                  className="flex h-11 items-center rounded-md bg-gold px-4 text-[15px] font-semibold text-on-gold hover:brightness-95"
                >
                  kaydol
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <Suspense fallback={<TabLinks active={null} />}>
        <TabBar />
      </Suspense>
    </header>
  );
}
