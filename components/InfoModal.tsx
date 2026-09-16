"use client";

import { useRef } from "react";
import { RULES_TEXT, RULES_TITLE } from "@/lib/text";
import { InfoIcon, XIcon } from "./icons";

export default function InfoModal({ className }: { className: string }) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label={RULES_TITLE}
        className={className}
      >
        <InfoIcon className="size-7" />
      </button>

      <dialog
        ref={dialog}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close();
        }}
        className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-0 text-ink shadow-lg backdrop:bg-black/50"
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-bold">{RULES_TITLE}</h2>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="kapat"
              className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-page hover:text-ink"
            >
              <XIcon className="size-5" />
            </button>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">{RULES_TEXT}</p>
        </div>
      </dialog>
    </>
  );
}
