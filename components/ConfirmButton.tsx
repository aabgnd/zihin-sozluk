"use client";

import { useRef, type ReactNode } from "react";

export default function ConfirmButton({
  action,
  label,
  ariaLabel,
  title,
  description,
  confirmLabel = "sil",
  className,
}: {
  action: () => Promise<void>;
  label: ReactNode;
  /** label bir ikonsa ekran okuyucu için gerekir. */
  ariaLabel?: string;
  title: string;
  description?: string;
  confirmLabel?: string;
  className: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label={ariaLabel}
        className={className}
      >
        {label}
      </button>

      <dialog
        ref={dialog}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close();
        }}
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-0 text-ink shadow-lg backdrop:bg-black/50"
      >
        <div className="p-5">
          <h2 className="text-lg font-bold">{title}</h2>
          {description && (
            <p className="mt-2 text-sm text-muted">{description}</p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="h-10 rounded-lg border border-line px-4 text-sm font-semibold hover:bg-page"
            >
              vazgeç
            </button>
            <form action={action}>
              <button
                type="submit"
                className="h-10 rounded-lg bg-danger px-4 text-sm font-bold text-surface hover:opacity-90"
              >
                {confirmLabel}
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
