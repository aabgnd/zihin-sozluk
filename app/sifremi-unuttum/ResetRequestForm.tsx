"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/app/auth/actions";
import Field from "@/components/Field";
import type { FormState } from "@/lib/types";

export default function ResetRequestForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    requestPasswordReset,
    {},
  );

  if (state.message) {
    return (
      <p
        role="status"
        className="rounded-md border border-line px-4 py-3 leading-relaxed"
      >
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <Field
        label="e-posta"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-md bg-gold text-sm font-semibold text-on-gold hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "gönderiliyor…" : "yenileme bağlantısı gönder"}
      </button>
    </form>
  );
}
