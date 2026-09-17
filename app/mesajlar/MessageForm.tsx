"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { XIcon } from "@/components/icons";
import MessageRefCard from "@/components/MessageRefCard";
import type { MesajReferansi } from "@/lib/messages";
import type { FormAction, FormState } from "@/lib/types";

export default function MessageForm({
  action,
  referans: gelenReferans = null,
}: {
  action: FormAction;
  /** Entry'den gelindiyse otomatik eklenen referans. */
  referans?: MesajReferansi | null;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    {},
  );
  const [referans, setReferans] = useState(gelenReferans);
  const form = useRef<HTMLFormElement>(null);

  // Adres değişip yeni bir entry'den gelinirse referans yenilenir.
  useEffect(() => {
    setReferans(gelenReferans);
  }, [gelenReferans]);

  // Gönderildikten sonra kutu ve referans temizlenir; aksi hâlde sıradaki
  // mesaj aynı entry'yi taşımaya devam ederdi.
  useEffect(() => {
    if (!state.sent) return;
    form.current?.reset();
    setReferans(null);
  }, [state]);

  return (
    <form
      ref={form}
      action={formAction}
      className="sticky bottom-0 space-y-2 border-t border-line bg-page pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3"
    >
      {referans && (
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <MessageRefCard referans={referans} />
          </div>
          <input type="hidden" name="entry_id" value={referans.id} />
          <button
            type="button"
            onClick={() => setReferans(null)}
            aria-label="entry referansını kaldır"
            title="referansı kaldır"
            className="grid size-9 shrink-0 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-danger"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      )}

      <label htmlFor="message" className="sr-only">
        mesaj yaz
      </label>
      <div className="flex items-end gap-2">
        <textarea
          id="message"
          name="content"
          required
          maxLength={5000}
          rows={2}
          placeholder="mesaj yaz"
          className="block min-h-11 w-full flex-1 resize-y rounded-md border border-line bg-surface p-2.5 text-[15px] leading-6 placeholder:text-muted focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-11 shrink-0 rounded-md bg-gold px-4 text-sm font-semibold text-on-gold hover:brightness-95 disabled:opacity-60"
        >
          {pending ? "gönderiliyor…" : "gönder"}
        </button>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
