"use client";

import { useActionState, useRef } from "react";
import { reportEntry } from "@/app/baslik/actions";
import { REPORT_REASONS } from "@/lib/moderation";
import type { FormState } from "@/lib/types";
import { FlagIcon } from "./icons";

export default function ReportButton({
  entryId,
  className,
}: {
  entryId: number;
  className: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    reportEntry.bind(null, entryId),
    {},
  );

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label="entry'yi bildir"
        title="bildir"
        className={className}
      >
        <FlagIcon className="size-4" />
      </button>

      <dialog
        ref={dialog}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close();
        }}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-0 text-ink shadow-lg backdrop:bg-black/50"
      >
        <div className="p-5">
          <h2 className="text-lg font-bold">entry&apos;yi bildir</h2>

          {state.message ? (
            <>
              <p role="status" className="mt-3 text-sm">
                {state.message}
              </p>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => dialog.current?.close()}
                  className="h-10 rounded-lg border border-line px-4 text-sm font-semibold hover:bg-page"
                >
                  kapat
                </button>
              </div>
            </>
          ) : (
            <form action={formAction} className="mt-3 space-y-3">
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold">sebep</legend>
                {REPORT_REASONS.map((reason, index) => (
                  <label
                    key={reason.value}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason.value}
                      defaultChecked={index === 0}
                      required
                      className="size-4 accent-gold"
                    />
                    {reason.label}
                  </label>
                ))}
              </fieldset>

              <div className="space-y-1">
                <label
                  htmlFor={`note-${entryId}`}
                  className="block text-sm font-semibold"
                >
                  açıklama{" "}
                  <span className="font-normal text-muted">(isteğe bağlı)</span>
                </label>
                <textarea
                  id={`note-${entryId}`}
                  name="note"
                  rows={3}
                  maxLength={300}
                  className="block w-full rounded-lg border border-line bg-page p-2.5 text-sm focus:border-gold focus:outline-none"
                />
              </div>

              {state.error && (
                <p role="alert" className="text-sm text-danger">
                  {state.error}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => dialog.current?.close()}
                  className="h-10 rounded-lg border border-line px-4 text-sm font-semibold hover:bg-page"
                >
                  vazgeç
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="h-10 rounded-lg bg-gold px-4 text-sm font-bold text-on-gold hover:brightness-95 disabled:opacity-60"
                >
                  {pending ? "gönderiliyor…" : "gönder"}
                </button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
