"use client";

import { useActionState } from "react";
import { submitWithoutReset } from "@/lib/form";
import { updateListingIdentity, type FormState } from "@/app/espace/actions";
import type { ManaColor } from "@/lib/listings";
import { ColorPicker } from "./deck-tags-fields";
import { useActionToast } from "./toaster";

/** Nom et couleurs du deck, sur la page de gestion d'une annonce. */
export function ListingIdentityForm({ listingId, title, colors }: { listingId: string; title: string; colors: ManaColor[] }) {
  const [state, action, saving] = useActionState<FormState, FormData>(updateListingIdentity.bind(null, listingId), {
    status: "idle",
  });
  useActionToast(state, { success: "Nom et couleurs enregistrés" });

  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-4 rounded-xl border border-line bg-surface p-4 sm:p-5">
      <h3 className="font-semibold">Nom et couleurs</h3>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Nom du deck</span>
        <input
          name="title"
          defaultValue={title}
          required
          minLength={3}
          maxLength={80}
          className="block w-full rounded-xl border border-line bg-sunken px-3 py-2.5 outline-none focus:border-link focus:ring-2 focus:ring-link/25"
        />
      </label>
      <ColorPicker defaultColors={colors} required />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="h-9 rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        {state.status === "error" && <span className="text-sm text-danger">{state.message}</span>}
      </div>
    </form>
  );
}
