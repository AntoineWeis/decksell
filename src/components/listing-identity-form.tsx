"use client";

import { useActionState } from "react";
import { submitWithoutReset } from "@/lib/form";
import { updateListingIdentity, type FormState } from "@/app/espace/actions";
import type { DeckFormat, ManaColor } from "@/lib/listings";
import { ColorPicker } from "./deck-tags-fields";
import { FormatSelect } from "./format-select";
import { useActionToast } from "./toaster";

const fieldClass =
  "block h-[46px] w-full rounded-xl border border-line bg-sunken px-3 outline-none focus:border-link focus:ring-2 focus:ring-link/25";

/** Nom, format et couleurs du deck, sur la page de gestion d'une annonce. */
export function ListingIdentityForm({
  listingId,
  title,
  format,
  colors,
}: {
  listingId: string;
  title: string;
  format: DeckFormat;
  colors: ManaColor[];
}) {
  const [state, action, saving] = useActionState<FormState, FormData>(updateListingIdentity.bind(null, listingId), {
    status: "idle",
  });
  useActionToast(state, { success: "Nom, format et couleurs enregistrés" });

  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-4 rounded-xl border border-line bg-surface p-4 sm:p-5">
      <h3 className="font-semibold">Nom, format et couleurs</h3>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Nom du deck</span>
          <input
            name="title"
            defaultValue={title}
            required
            minLength={3}
            maxLength={80}
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Format de jeu</span>
          <FormatSelect defaultFormat={format} className={fieldClass} />
        </label>
      </div>
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
