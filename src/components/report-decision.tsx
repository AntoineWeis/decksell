"use client";

import { useActionState } from "react";
import { submitWithoutReset } from "@/lib/form";
import { handleReport } from "@/app/espace/moderation/actions";
import type { FormState } from "@/app/espace/actions";
import { useActionToast } from "./toaster";

/** Décision sur un signalement : statut, note interne, retrait de l'annonce. */
export function ReportDecision({
  reportId,
  status,
  note,
  listingWithdrawable,
}: {
  reportId: number;
  status: "open" | "resolved" | "dismissed";
  note: string | null;
  listingWithdrawable: boolean;
}) {
  const [state, action, saving] = useActionState<FormState, FormData>(handleReport.bind(null, reportId), { status: "idle" });
  useActionToast(state, { success: "Signalement enregistré" });

  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-4 rounded-xl border border-line bg-surface p-4 sm:p-5">
      <h3 className="font-semibold">Décision</h3>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Statut</legend>
        {(
          [
            ["resolved", "Résolu"],
            ["dismissed", "Sans suite"],
            ["open", "À traiter"],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className="cursor-pointer">
            <input type="radio" name="status" value={value} defaultChecked={status === value} className="peer sr-only" />
            <span className="block rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-muted transition peer-checked:border-link peer-checked:bg-brand-soft peer-checked:text-link peer-focus-visible:outline-2 peer-focus-visible:outline-link">
              {label}
            </span>
          </label>
        ))}
      </fieldset>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">
          Note interne <span className="font-normal text-muted">(visible des admins seulement)</span>
        </span>
        <textarea
          name="note"
          rows={3}
          maxLength={1000}
          defaultValue={note ?? ""}
          placeholder="Ce qui a été constaté, ce qui a été fait…"
          className="block w-full rounded-xl border border-line bg-sunken px-3 py-2.5 text-sm outline-none focus:border-link focus:ring-2 focus:ring-link/25"
        />
      </label>
      {listingWithdrawable && (
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="withdraw_listing" className="mt-0.5 h-4 w-4 accent-[var(--danger)]" />
          <span>
            <span className="font-medium">Retirer l&apos;annonce</span>
            <span className="block text-xs text-muted">Elle disparaît des decks en vente ; le vendeur la voit « Retirée » dans son espace.</span>
          </span>
        </label>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="h-9 rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer la décision"}
        </button>
        {state.status === "error" && <span className="text-sm text-danger">{state.message}</span>}
      </div>
    </form>
  );
}
