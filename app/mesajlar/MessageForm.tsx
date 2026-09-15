"use client";

import { useActionState } from "react";
import type { FormAction, FormState } from "@/lib/types";

export default function MessageForm({ action }: { action: FormAction }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    {},
  );

  return (
    <form
      action={formAction}
      className="sticky bottom-0 space-y-2 border-t border-line bg-page px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3"
    >
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
          className="block min-h-11 w-full flex-1 resize-y rounded-sm border border-line bg-surface p-2.5 text-base leading-6 placeholder:text-muted focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-11 shrink-0 rounded-sm bg-gold px-4 font-semibold text-on-gold hover:brightness-95 disabled:opacity-60"
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
