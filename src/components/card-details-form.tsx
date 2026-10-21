"use client";

import { useActionState } from "react";
import { submitWithoutReset } from "@/lib/form";
import { updateCardDetails, type FormState } from "@/app/espace/actions";
import type { Board, CardDetail } from "@/lib/card-details";
import { CardDetailsEditor } from "./card-details-editor";
import { useActionToast } from "./toaster";

/** Modification de l'état et de la langue des cartes d'une annonce déjà publiée. */
export function CardDetailsForm({
  listingId,
  lines,
  initial,
}: {
  listingId: string;
  lines: { board: Board; name: string; quantity: number }[];
  initial: CardDetail[];
}) {
  const [state, action, saving] = useActionState<FormState, FormData>(updateCardDetails.bind(null, listingId), {
    status: "idle",
  });
  useActionToast(state, { success: "État et langue des cartes enregistrés" });
  return (
    <form onSubmit={submitWithoutReset(action)} className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <CardDetailsEditor lines={lines} initial={initial} />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="h-9 rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer l'état et la langue"}
        </button>
        {state.status === "error" && <span className="text-sm text-danger">{state.message}</span>}
      </div>
    </form>
  );
}
