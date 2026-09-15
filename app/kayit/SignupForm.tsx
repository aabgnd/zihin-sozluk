"use client";

import { useActionState } from "react";
import { signUp } from "@/app/auth/actions";
import Field from "@/components/Field";
import { RULES_TEXT, RULES_TITLE } from "@/lib/text";
import type { FormState } from "@/lib/types";

export default function SignupForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    signUp,
    {},
  );

  if (state.message) {
    return (
      <p
        role="status"
        className="rounded-sm border border-gold bg-surface px-4 py-3 leading-relaxed"
      >
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <Field
        label="kullanıcı adı"
        name="username"
        autoComplete="username"
        minLength={3}
        maxLength={30}
        required
      />
      <Field
        label="e-posta"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <Field
        label="şifre (en az 8 karakter)"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <div className="rounded-sm border border-gold bg-surface p-3 text-sm">
        <p className="font-semibold text-gold-ink">{RULES_TITLE}</p>
        <p className="mt-1 leading-relaxed text-muted">{RULES_TEXT}</p>
        <label
          htmlFor="rules"
          className="mt-3 flex items-center gap-2 font-semibold"
        >
          <input
            id="rules"
            name="rules"
            type="checkbox"
            required
            className="size-4 accent-gold"
          />
          okudum, kabul ediyorum
        </label>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-sm bg-gold font-semibold text-on-gold hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "kaydediliyor…" : "kaydol"}
      </button>
    </form>
  );
}
