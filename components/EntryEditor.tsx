"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import type { FormAction, FormState } from "@/lib/types";

type Props = {
  action: FormAction;
  draftKey: string;
  initialContent?: string;
  label?: string;
  submitLabel?: string;
  cancelHref?: string;
};

function readDraft(key: string) {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

export default function EntryEditor({
  action,
  draftKey,
  initialContent = "",
  label = "entry yaz",
  submitLabel = "gönder",
  cancelHref,
}: Props) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const [content, setContent] = useState(initialContent);
  const [draftRestored, setDraftRestored] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const draft = readDraft(draftKey);
    if (draft && draft !== initialContent) {
      setContent(draft);
      setDraftRestored(true);
    }
  }, [draftKey, initialContent]);

  useEffect(() => {
    if (content === initialContent) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, content);
      } catch {
        // gizli sekmede localStorage kapalı olabilir; taslak kaydedilmez.
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [content, draftKey, initialContent]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // yoksay
    }
  };

  const discardDraft = () => {
    clearDraft();
    setContent(initialContent);
    setDraftRestored(false);
  };

  const wrapSelectionWithSpoiler = () => {
    const field = textarea.current;
    if (!field) return;
    const { selectionStart, selectionEnd } = field;
    const selected = content.slice(selectionStart, selectionEnd);
    const next = `${content.slice(0, selectionStart)}[spoiler]${selected}[/spoiler]${content.slice(selectionEnd)}`;
    setContent(next);
    requestAnimationFrame(() => {
      field.focus();
      const caret = selectionStart + "[spoiler]".length + selected.length;
      field.setSelectionRange(caret, caret);
    });
  };

  return (
    <form action={formAction} onSubmit={clearDraft} className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor="content" className="text-sm font-semibold">
          {label}
        </label>
        <button
          type="button"
          onClick={wrapSelectionWithSpoiler}
          className="h-9 rounded-md border border-line px-3 text-xs text-muted hover:bg-surface-2 hover:text-ink"
        >
          spoiler ekle
        </button>
      </div>

      <textarea
        ref={textarea}
        id="content"
        name="content"
        required
        maxLength={10000}
        rows={5}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        className="block w-full rounded-md border border-line bg-surface p-3 text-[15px] leading-7 focus:border-gold focus:outline-none"
      />

      {draftRestored && (
        <p className="text-xs text-muted">
          kaydedilmemiş taslağın geri yüklendi.{" "}
          <button
            type="button"
            onClick={discardDraft}
            className="font-semibold text-gold-ink hover:underline"
          >
            taslağı sil
          </button>
        </p>
      )}

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-md bg-gold px-5 text-sm font-semibold text-on-gold hover:brightness-95 disabled:opacity-60"
        >
          {pending ? "gönderiliyor…" : submitLabel}
        </button>
        {cancelHref && (
          <Link
            href={cancelHref}
            className="flex h-10 items-center rounded-md border border-line px-4 text-sm hover:bg-surface-2"
          >
            vazgeç
          </Link>
        )}
      </div>
    </form>
  );
}
