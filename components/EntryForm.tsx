"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/types";

type EntryAction = (state: FormState, formData: FormData) => Promise<FormState>;

export default function EntryForm({ action }: { action: EntryAction }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction} className="space-y-2 px-3 py-4">
      <label htmlFor="content" className="block text-sm font-semibold">
        entry yaz
      </label>
      <textarea
        id="content"
        name="content"
        required
        maxLength={10000}
        rows={5}
        className="block w-full rounded-sm border border-line bg-surface p-3 text-base leading-7 focus:border-gold focus:outline-none"
      />
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded-sm bg-gold px-5 font-semibold text-on-gold hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "gönderiliyor…" : "gönder"}
      </button>
    </form>
  );
}
