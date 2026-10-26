"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { submitWithoutReset } from "@/lib/form";
import { unlockSite, type GateState } from "./actions";

export function GateForm() {
  const next = useSearchParams().get("next") ?? "/";
  const [state, action, pending] = useActionState<GateState, FormData>(unlockSite, { error: null });

  return (
    <form onSubmit={submitWithoutReset(action)} className="w-full max-w-sm">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="gate-password" className="mb-2 block text-sm font-medium text-banner-muted">
        Accès anticipé
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="gate-password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Mot de passe"
          required
          autoFocus
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "gate-error" : undefined}
          className="block h-11 min-w-0 flex-1 rounded-xl border border-white/15 bg-white/[0.06] px-3 text-banner-ink outline-none backdrop-blur placeholder:text-banner-muted/70 focus:border-[#7fa8ff] focus:ring-2 focus:ring-[#7fa8ff]/30"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex h-11 shrink-0 items-center justify-center rounded-xl bg-accent px-5 font-semibold text-on-accent transition hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "Vérification…" : "Entrer"}
        </button>
      </div>
      <p id="gate-error" role="alert" className="mt-2 min-h-5 text-sm text-[#ff8a80]">
        {state.error}
      </p>
    </form>
  );
}
