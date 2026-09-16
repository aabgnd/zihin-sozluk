"use client";

import { useActionState } from "react";
import { resendConfirmation } from "@/app/auth/actions";
import Field from "@/components/Field";
import type { FormState } from "@/lib/types";

export default function ResendForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    resendConfirmation,
    {},
  );

  if (state.message) {
    return (
      <p role="status" className="text-sm leading-relaxed">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <p className="text-sm leading-relaxed text-muted">
        e-posta adresini yaz, yeni bir onay bağlantısı gönderelim.
      </p>
      <Field label="e-posta" name="email" type="email" autoComplete="email" required />
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded-md border border-line px-4 text-sm hover:bg-surface-2 disabled:opacity-60"
      >
        {pending ? "gönderiliyor…" : "onay bağlantısını yeniden gönder"}
      </button>
    </form>
  );
}
