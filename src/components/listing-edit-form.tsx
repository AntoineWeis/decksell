"use client";

import { useActionState } from "react";
import { submitWithoutReset } from "@/lib/form";
import { updateListing, type FormState } from "@/app/espace/actions";
import { FORMATS, STATUSES, archetypesFor, normalizeFormat, type Archetype, type Listing } from "@/lib/listings";
import { ArchetypeSelect, ColorPicker } from "./deck-tags-fields";
import { useActionToast } from "./toaster";
import { BRACKETS, allowedBrackets, type BracketLevel } from "@/lib/bracket";

const fieldClass =
  "block h-[46px] w-full rounded-xl border border-line bg-sunken px-3 outline-none focus:border-link focus:ring-2 focus:ring-link/25";

/** Tout ce qui décrit l'annonce, au même endroit : nom, format, statut, prix, couleurs, archétype. */
export function ListingEditForm({
  listing: l,
  archetypes,
  bracket = null,
}: {
  listing: Listing;
  archetypes: Archetype[];
  /** Commander : niveau annoncé et minimum déduit de la liste. */
  bracket?: { declared: BracketLevel | null; min: BracketLevel } | null;
}) {
  const [state, action, saving] = useActionState<FormState, FormData>(updateListing.bind(null, l.id), { status: "idle" });
  useActionToast(state, { success: "Annonce enregistrée" });
  const format = normalizeFormat(l.format);
  const commander = format === "commander";

  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-4 rounded-xl border border-line bg-surface p-4 sm:p-5">
      <h3 className="font-semibold">Annonce</h3>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Nom du deck</span>
          <input name="title" defaultValue={l.title} required minLength={3} maxLength={80} className={fieldClass} />
        </label>
        {/* Le format suit la liste (ses règles ont été contrôlées à la publication) : il ne se change pas ici. */}
        <div>
          <span className="mb-1.5 block text-sm font-medium">Format de jeu</span>
          <p className={`${fieldClass} flex items-center text-muted`}>
            {FORMATS[format]}
            {commander && (l.commanders ?? []).length > 0 && (
              <span className="ml-1 truncate">· {(l.commanders ?? []).join(" et ")}</span>
            )}
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Prix demandé (€)</span>
          <input
            name="asking_price"
            inputMode="decimal"
            required
            defaultValue={(l.asking_cents / 100).toString().replace(".", ",")}
            className={`${fieldClass} tabular-nums`}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Statut</span>
          <select name="status" defaultValue={l.status} className={fieldClass}>
            {Object.entries(STATUSES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Archétype</span>
          <ArchetypeSelect archetypes={archetypesFor(archetypes, format)} defaultId={l.archetype?.id ?? null} className={fieldClass} />
        </label>
      </div>
      {commander && bracket && (
        <label className="block max-w-72">
          <span className="mb-1.5 block text-sm font-medium">Niveau de puissance</span>
          <select name="bracket" defaultValue={bracket.declared ?? bracket.min} className={fieldClass}>
            {allowedBrackets(bracket.min).map((b) => (
              <option key={b} value={b}>
                {b} · {BRACKETS[b].name}
                {b === bracket.min ? " (d'après la liste)" : ""}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-muted">Jamais en dessous du minimum imposé par la liste.</span>
        </label>
      )}
      {/* Commander : un commandant incolore donne un deck sans couleur. */}
      <ColorPicker defaultColors={l.colors ?? []} required={!commander} />
      {/* Sans détail carte par carte (anciennes annonces), la part de français se saisit ici. */}
      {(l.card_details ?? []).length === 0 && (
        <label className="block max-w-48">
          <span className="mb-1.5 block text-sm font-medium">Cartes en français (%)</span>
          <input
            name="french_percent"
            type="number"
            min={0}
            max={100}
            inputMode="numeric"
            defaultValue={l.french_percent ?? ""}
            className={`${fieldClass} tabular-nums`}
          />
        </label>
      )}
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
