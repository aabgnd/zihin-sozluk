import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";
import AccountNav from "./AccountNav";
import { SettingsIcon } from "./icons";
import InfoModal from "./InfoModal";
import LiveRefresh from "./LiveRefresh";
import SearchForm from "./SearchForm";
import TabBar, { TabLinks } from "./TabBar";
import ThemeToggle from "./ThemeToggle";

// Dokunma alanı 44px, ikon 28px.
const goldIconButton =
  "relative grid size-11 place-items-center rounded-lg text-on-gold hover:bg-black/10";
const barIconButton =
  "relative grid size-11 shrink-0 place-items-center rounded-lg border border-line bg-surface text-ink hover:bg-page";

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
    <header>
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

      <div className="bg-gold text-on-gold">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 md:px-5 md:py-3">
          <Link
            href="/"
            aria-label="zihin sözlük ana sayfa"
            className="mr-auto shrink-0 text-xl font-extrabold lowercase tracking-tight sm:text-2xl md:mr-0"
          >
            <span className="text-logo">zihin</span>
            <span className="ml-[0.1em] text-on-gold">sözlük</span>
          </Link>

          <SearchForm
            inputId="q-genis"
            className="hidden md:mx-auto md:flex md:min-w-0 md:max-w-md md:flex-1"
          />

          <div className="hidden items-center gap-1 md:flex">
            <InfoModal className={goldIconButton} />
            <ThemeToggle className={goldIconButton} />
          </div>

          <div className="flex items-center gap-1">
            {viewer ? (
              <AccountNav
                viewer={viewer}
                unreadMessages={unreadMessages}
                unreadNotifications={unreadNotifications}
                iconButtonClass={goldIconButton}
              />
            ) : (
              <>
                <Link
                  href="/giris"
                  className="flex h-11 items-center rounded-lg px-3 text-[15px] font-semibold hover:bg-black/10"
                >
                  giriş
                </Link>
                <Link
                  href="/kayit"
                  className="flex h-11 items-center rounded-lg bg-ink px-4 text-[15px] font-semibold text-page hover:opacity-90"
                >
                  kaydol
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-line bg-surface md:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2">
          <SearchForm inputId="q" className="flex min-w-0 flex-1" />
          {viewer && (
            <Link href="/ayarlar" aria-label="ayarlar" className={barIconButton}>
              <SettingsIcon className="size-7" />
            </Link>
          )}
          <InfoModal className={barIconButton} />
          <ThemeToggle className={barIconButton} />
        </div>
      </div>

      <Suspense fallback={<TabLinks active={null} />}>
        <TabBar />
      </Suspense>
    </header>
  );
}
