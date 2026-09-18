"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/lib/types";
import { updateBio } from "./actions";

import { BIO_MAX } from "@/lib/bio-sabit";

export default function BioForm({ mevcut }: { mevcut: string | null }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateBio,
    {},
  );
  const [uzunluk, setUzunluk] = useState(mevcut?.length ?? 0);

  return (
    <form action={formAction} className="space-y-2">
      <label htmlFor="bio" className="sr-only">
        bio
      </label>
      <textarea
        id="bio"
        name="bio"
        rows={3}
        maxLength={BIO_MAX}
        defaultValue={mevcut ?? ""}
        onChange={(event) => setUzunluk(event.target.value.length)}
        placeholder="kendini birkaç cümleyle anlat"
        className="block w-full resize-y rounded-md border border-line bg-surface p-2.5 text-[15px] leading-6 placeholder:text-muted focus:border-gold focus:outline-none"
      />
      <div className="flex items-center justify-between gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-md bg-gold px-4 text-sm font-semibold text-on-gold hover:brightness-95 disabled:opacity-60"
        >
          {pending ? "kaydediliyor…" : "bio'yu kaydet"}
        </button>
        <span className="text-xs text-muted">
          {uzunluk}/{BIO_MAX}
        </span>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="text-sm">
          {state.message}
        </p>
      )}
    </form>
  );
}
