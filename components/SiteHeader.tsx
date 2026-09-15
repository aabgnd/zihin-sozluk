import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";
import AccountNav from "./AccountNav";
import LiveRefresh from "./LiveRefresh";
import SearchForm from "./SearchForm";
import TabBar, { TabLinks } from "./TabBar";

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

      <div className="bg-bar">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-3 py-2 lg:max-w-6xl lg:gap-6 lg:px-4 lg:py-3">
          <Link
            href="/"
            className="mr-auto shrink-0 text-lg font-bold tracking-wide text-gold sm:text-xl lg:mr-0 lg:text-2xl"
          >
            ZİHİN SÖZLÜK
          </Link>

          <SearchForm
            inputId="q-genis"
            className="hidden lg:mx-auto lg:flex lg:min-w-0 lg:max-w-md lg:flex-1"
          />

          {viewer ? (
            <AccountNav
              viewer={viewer}
              unreadMessages={unreadMessages}
              unreadNotifications={unreadNotifications}
            />
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/giris"
                className="flex h-11 items-center rounded-sm bg-bar-2 px-4 text-[15px] text-on-bar hover:text-gold lg:bg-transparent"
              >
                giriş
              </Link>
              <Link
                href="/kayit"
                className="flex h-11 items-center rounded-sm bg-gold px-4 text-[15px] font-semibold text-on-gold hover:brightness-95"
              >
                kaydol
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="bg-bar-2 lg:hidden">
        <SearchForm inputId="q" className="mx-auto flex max-w-2xl px-3 py-2" />
      </div>

      <Suspense fallback={<TabLinks active={null} />}>
        <TabBar />
      </Suspense>
    </header>
  );
}
