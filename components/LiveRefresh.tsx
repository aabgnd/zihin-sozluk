"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export type LiveSubscription = {
  table: "messages" | "notifications" | "entries";
  filter?: string;
};

export default function LiveRefresh({
  channel,
  subscriptions,
  listenForSync = false,
}: {
  channel: string;
  subscriptions: LiveSubscription[];
  listenForSync?: boolean;
}) {
  const router = useRouter();
  const subscriptionKey = JSON.stringify(subscriptions);

  useEffect(() => {
    const supabase = createClient();
    const realtime = supabase.channel(channel);
    const refresh = () => router.refresh();

    for (const { table, filter } of JSON.parse(
      subscriptionKey,
    ) as LiveSubscription[]) {
      realtime.on(
        "postgres_changes",
        { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
        refresh,
      );
    }
    if (listenForSync) realtime.on("broadcast", { event: "sync" }, refresh);
    realtime.subscribe();

    return () => {
      void supabase.removeChannel(realtime);
    };
  }, [channel, subscriptionKey, listenForSync, router]);

  return null;
}
