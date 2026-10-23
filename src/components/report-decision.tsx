"use client";

import { useActionState } from "react";
import { submitWithoutReset } from "@/lib/form";
import { handleReport } from "@/app/espace/moderation/actions";
import type { FormState } from "@/app/espace/actions";
import { useActionToast } from "./toaster";

const fieldClass =
  "block w-full rounded-xl border border-line bg-sunken px-3 py-2.5 text-sm outline-none focus:border-link focus:ring-2 focus:ring-link/25";

/** Décision sur un signalement : statut, note interne, retrait de l'annonce, sanction du membre visé. */
export function ReportDecision({
  reportId,
  status,
  note,
  listingWithdrawable,
  memberName,
  memberSuspended,
}: {
  reportId: number;
  status: "open" | "resolved" | "dismissed";
  note: string | null;
  listingWithdrawable: boolean;
  /** Membre visé par le signalement. */
  memberName: string;
  memberSuspended: boolean;
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
      <div className="space-y-3 border-t border-line pt-4">
        <label className="block max-w-sm">
          <span className="mb-1.5 block text-sm font-medium">Sanction pour {memberName}</span>
          <select name="suspend_days" defaultValue="0" className={fieldClass}>
            <option value="0">{memberSuspended ? "Garder la suspension en cours" : "Aucune suspension"}</option>
            <option value="3">Suspendre 3 jours</option>
            <option value="7">Suspendre 7 jours</option>
            <option value="30">Suspendre 30 jours</option>
            <option value="3650">Suspendre définitivement</option>
            {memberSuspended && <option value="-1">Lever la suspension</option>}
          </select>
          <span className="mt-1 block text-xs text-muted">
            Suspendu : plus de message ni de modification d&apos;annonce, et ses annonces disparaissent des decks en vente.
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="warn" className="mt-0.5" />
          <span>
            <span className="font-medium">Avertir {memberName} par email</span>
            <span className="block text-xs text-muted">Toujours envoyé en cas de suspension.</span>
          </span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            Message au membre <span className="font-normal text-muted">(facultatif, recopié dans l&apos;email)</span>
          </span>
          <textarea name="member_message" rows={2} maxLength={1000} className={fieldClass} />
        </label>
      </div>
      {listingWithdrawable && (
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="withdraw_listing" className="checkbox-danger mt-0.5" />
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
